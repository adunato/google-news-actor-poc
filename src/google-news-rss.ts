import type { DateRange } from "./contracts.js";

export const GOOGLE_NEWS_RSS_SOURCE_ID = "https://news.google.com/rss/search";
const MAX_ATTEMPTS = 3;
const ATTEMPT_TIMEOUT_MS = 10_000;
const OVERALL_TIMEOUT_MS = 25_000;
const MAX_BODY_BYTES = 2_097_152;
const RETRY_DELAYS_MS = [250, 500] as const;
const TIMEOUT = Symbol("timeout");
const DEADLINE = Symbol("deadline");
const CALLER_CANCELLED = Symbol("caller-cancelled");

function fallbackRetryDelay(attempt: number): number {
  return RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)]!;
}

export interface GoogleNewsRssRequest {
  query: string;
  language: string;
  country: string;
  dateRange: DateRange;
  signal?: AbortSignal;
}

export interface GoogleNewsRssResponse {
  body: string;
  status: number;
  contentType: string | null;
  sourceId: typeof GOOGLE_NEWS_RSS_SOURCE_ID;
}

export type GoogleNewsRssErrorCategory =
  "network" | "timeout" | "http" | "oversize" | "cancelled";

export class GoogleNewsRssError extends Error {
  readonly category: GoogleNewsRssErrorCategory;
  readonly status?: number;
  readonly attempts: number;
  readonly sourceId = GOOGLE_NEWS_RSS_SOURCE_ID;

  constructor(
    category: GoogleNewsRssErrorCategory,
    attempts: number,
    options: { status?: number; cause?: unknown } = {},
  ) {
    super(`Google News request failed (${category})`, { cause: options.cause });
    this.name = "GoogleNewsRssError";
    this.category = category;
    this.attempts = attempts;
    if (options.status !== undefined) this.status = options.status;
  }
}

export interface GoogleNewsRssDependencies {
  fetch?: typeof fetch;
  now?: () => number;
  setTimeout?: typeof globalThis.setTimeout;
  clearTimeout?: typeof globalThis.clearTimeout;
  sleep?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}

function makeUrl(request: GoogleNewsRssRequest): URL {
  const url = new URL(GOOGLE_NEWS_RSS_SOURCE_ID);
  const query =
    request.dateRange === "any"
      ? request.query
      : `${request.query} when:${request.dateRange}`;
  url.searchParams.set("q", query);
  url.searchParams.set("hl", request.language);
  url.searchParams.set("gl", request.country);
  url.searchParams.set(
    "ceid",
    `${request.country}:${request.language.split("-", 1)[0]}`,
  );
  return url;
}

function abortError(signal: AbortSignal): unknown {
  return signal.reason;
}

function raceWithSignal<T>(
  promise: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  if (signal.aborted) return Promise.reject(abortError(signal));
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortError(signal));
    signal.addEventListener("abort", onAbort, { once: true });
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", onAbort));
  });
}

function createLinkedController(signals: AbortSignal[]): {
  controller: AbortController;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const listeners: Array<() => void> = [];
  for (const signal of signals) {
    const forward = () => controller.abort(signal.reason);
    if (signal.aborted) {
      forward();
      break;
    }
    signal.addEventListener("abort", forward, { once: true });
    listeners.push(() => signal.removeEventListener("abort", forward));
  }
  return { controller, cleanup: () => listeners.forEach((remove) => remove()) };
}

function retryAfterMs(value: string | null, now: number): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value.trim());
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;
  const date = Date.parse(value);
  if (!Number.isFinite(date)) return undefined;
  return Math.max(0, date - now);
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function cancelQuietly(
  stream: ReadableStream<Uint8Array> | null | undefined,
): void {
  try {
    void stream?.cancel().catch(() => {});
  } catch {
    // Cancellation is best-effort; the caller must still settle by its deadline.
  }
}

export async function requestGoogleNewsRss(
  request: GoogleNewsRssRequest,
  deps: GoogleNewsRssDependencies = {},
): Promise<GoogleNewsRssResponse> {
  const url = makeUrl(request);
  const fetchImpl = deps.fetch ?? globalThis.fetch;
  const now = deps.now ?? Date.now;
  const setTimer = deps.setTimeout ?? globalThis.setTimeout;
  const clearTimer = deps.clearTimeout ?? globalThis.clearTimeout;
  const startedAt = now();
  const deadlineAt = startedAt + OVERALL_TIMEOUT_MS;
  const overall = new AbortController();
  const onCallerAbort = () => overall.abort(CALLER_CANCELLED);
  if (request.signal?.aborted) overall.abort(CALLER_CANCELLED);
  else request.signal?.addEventListener("abort", onCallerAbort, { once: true });
  const overallTimer = setTimer(
    () => overall.abort(DEADLINE),
    OVERALL_TIMEOUT_MS,
  );
  let attempts = 0;

  const failForAbort = (reason: unknown): GoogleNewsRssError => {
    if (reason === CALLER_CANCELLED)
      return new GoogleNewsRssError("cancelled", attempts);
    if (reason === DEADLINE)
      return new GoogleNewsRssError("timeout", attempts, { cause: reason });
    if (reason === TIMEOUT)
      return new GoogleNewsRssError("timeout", attempts, { cause: reason });
    return new GoogleNewsRssError("cancelled", attempts, { cause: reason });
  };

  const wait = async (milliseconds: number): Promise<void> => {
    const remaining = deadlineAt - now();
    if (remaining <= 0 || milliseconds >= remaining) {
      if (milliseconds >= remaining) {
        await new Promise<void>((resolve, reject) => {
          if (overall.signal.aborted) reject(overall.signal.reason);
          else
            overall.signal.addEventListener(
              "abort",
              () => reject(overall.signal.reason),
              { once: true },
            );
        });
      }
      return;
    }
    if (deps.sleep)
      return raceWithSignal(
        deps.sleep(milliseconds, overall.signal),
        overall.signal,
      );
    await new Promise<void>((resolve, reject) => {
      if (overall.signal.aborted) return reject(overall.signal.reason);
      const onAbort = () => {
        clearTimer(timer);
        overall.signal.removeEventListener("abort", onAbort);
        reject(overall.signal.reason);
      };
      const timer = setTimer(() => {
        overall.signal.removeEventListener("abort", onAbort);
        resolve();
      }, milliseconds);
      overall.signal.addEventListener("abort", onAbort, { once: true });
    });
  };

  try {
    for (attempts = 1; attempts <= MAX_ATTEMPTS; attempts += 1) {
      if (overall.signal.aborted) throw failForAbort(overall.signal.reason);
      const remaining = deadlineAt - now();
      if (remaining <= 0) throw new GoogleNewsRssError("timeout", attempts - 1);
      const attemptController = new AbortController();
      const attemptTimer = setTimer(
        () => attemptController.abort(TIMEOUT),
        Math.min(ATTEMPT_TIMEOUT_MS, remaining),
      );
      const linked = createLinkedController([
        overall.signal,
        attemptController.signal,
      ]);
      let response: Response;
      try {
        response = await raceWithSignal(
          Promise.resolve(
            fetchImpl(url, { method: "GET", signal: linked.controller.signal }),
          ),
          linked.controller.signal,
        );
      } catch (error) {
        if (overall.signal.aborted) throw failForAbort(overall.signal.reason);
        const timedOut = attemptController.signal.reason === TIMEOUT;
        if (!timedOut && attempts >= MAX_ATTEMPTS)
          throw new GoogleNewsRssError("network", attempts, { cause: error });
        if (!timedOut && attempts < MAX_ATTEMPTS) {
          clearTimer(attemptTimer);
          linked.cleanup();
          await wait(fallbackRetryDelay(attempts));
          continue;
        }
        if (timedOut && attempts >= MAX_ATTEMPTS)
          throw new GoogleNewsRssError("timeout", attempts, { cause: error });
        clearTimer(attemptTimer);
        linked.cleanup();
        await wait(fallbackRetryDelay(attempts));
        continue;
      }

      if (!response.ok) {
        const status = response.status;
        cancelQuietly(response.body);
        clearTimer(attemptTimer);
        linked.cleanup();
        if (!isRetryableStatus(status))
          throw new GoogleNewsRssError("http", attempts, { status });
        if (attempts >= MAX_ATTEMPTS)
          throw new GoogleNewsRssError("http", attempts, { status });
        const headerDelay =
          status === 429 || status === 503
            ? retryAfterMs(response.headers.get("retry-after"), now())
            : undefined;
        const delay =
          headerDelay !== undefined &&
          headerDelay <= 1_000 &&
          headerDelay < deadlineAt - now()
            ? headerDelay
            : fallbackRetryDelay(attempts);
        await wait(delay);
        continue;
      }

      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      try {
        if (reader) {
          while (true) {
            const { done, value } = await raceWithSignal(
              reader.read(),
              linked.controller.signal,
            );
            if (done) break;
            total += value.byteLength;
            if (total > MAX_BODY_BYTES) {
              try {
                void reader.cancel().catch(() => {});
              } catch {
                // Keep the oversize result independent of upstream cleanup.
              }
              throw new GoogleNewsRssError("oversize", attempts);
            }
            chunks.push(value);
          }
        }
      } catch (error) {
        if (reader) {
          try {
            void reader.cancel().catch(() => {});
          } catch {
            // Keep timeout and cancellation handling bounded.
          }
        }
        clearTimer(attemptTimer);
        linked.cleanup();
        if (error instanceof GoogleNewsRssError) throw error;
        if (overall.signal.aborted) throw failForAbort(overall.signal.reason);
        if (attemptController.signal.reason === TIMEOUT) {
          if (attempts >= MAX_ATTEMPTS)
            throw new GoogleNewsRssError("timeout", attempts, { cause: error });
          await wait(fallbackRetryDelay(attempts));
          continue;
        }
        if (attempts < MAX_ATTEMPTS) {
          await wait(fallbackRetryDelay(attempts));
          continue;
        }
        throw new GoogleNewsRssError("network", attempts, { cause: error });
      } finally {
        try {
          reader?.releaseLock();
        } catch {
          /* reader may already be released */
        }
      }
      clearTimer(attemptTimer);
      linked.cleanup();
      const bytes = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return {
        body: new TextDecoder("utf-8").decode(bytes),
        status: response.status,
        contentType: response.headers.get("content-type"),
        sourceId: GOOGLE_NEWS_RSS_SOURCE_ID,
      };
    }
    throw new GoogleNewsRssError("network", attempts);
  } catch (error) {
    if (error instanceof GoogleNewsRssError) throw error;
    if (overall.signal.aborted) throw failForAbort(overall.signal.reason);
    throw new GoogleNewsRssError("network", attempts, { cause: error });
  } finally {
    clearTimer(overallTimer);
    request.signal?.removeEventListener("abort", onCallerAbort);
  }
}
