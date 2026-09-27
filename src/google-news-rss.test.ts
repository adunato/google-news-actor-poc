import { describe, expect, it, vi } from "vitest";
import {
  GOOGLE_NEWS_RSS_SOURCE_ID,
  GoogleNewsRssError,
  requestGoogleNewsRss,
  type GoogleNewsRssRequest,
} from "./google-news-rss.js";

const request: GoogleNewsRssRequest = {
  query: "climate change & energy",
  language: "en-US",
  country: "US",
  dateRange: "any",
};

function response(
  body: string | Uint8Array,
  status = 200,
  headers?: HeadersInit,
): Response {
  const initBody =
    typeof body === "string"
      ? body
      : (body.buffer.slice(
          body.byteOffset,
          body.byteOffset + body.byteLength,
        ) as ArrayBuffer);
  return new Response(
    initBody,
    headers === undefined ? { status } : { status, headers },
  );
}

describe("requestGoogleNewsRss", () => {
  it("builds an encoded Google News request with locale and date range", async () => {
    let captured: URL | undefined;
    const result = await requestGoogleNewsRss(
      {
        ...request,
        query: "東京 news & weather",
        language: "fr-CA",
        country: "CA",
        dateRange: "7d",
      },
      {
        fetch: async (input) => {
          captured = new URL(String(input));
          return response("feed", 200, {
            "content-type": "application/rss+xml",
          });
        },
      },
    );

    expect(captured!.origin + captured!.pathname).toBe(
      GOOGLE_NEWS_RSS_SOURCE_ID,
    );
    expect(captured?.searchParams.get("q")).toBe("東京 news & weather when:7d");
    expect(captured?.searchParams.get("hl")).toBe("fr-CA");
    expect(captured?.searchParams.get("gl")).toBe("CA");
    expect(captured?.searchParams.get("ceid")).toBe("CA:fr");
    expect(result).toEqual({
      body: "feed",
      status: 200,
      contentType: "application/rss+xml",
      sourceId: GOOGLE_NEWS_RSS_SOURCE_ID,
    });
  });

  it.each(["any", "1h", "6h", "1d", "7d", "30d"] as const)(
    "maps dateRange %s",
    async (dateRange) => {
      let captured: URL | undefined;
      await requestGoogleNewsRss(
        { ...request, dateRange },
        {
          fetch: async (input) => {
            captured = new URL(String(input));
            return response("");
          },
        },
      );
      expect(captured?.searchParams.get("q")).toBe(
        dateRange === "any"
          ? request.query
          : `${request.query} when:${dateRange}`,
      );
    },
  );

  it("accepts exactly 2 MiB and rejects an additional byte while cancelling the stream", async () => {
    const exact = new Uint8Array(2_097_152);
    const result = await requestGoogleNewsRss(request, {
      fetch: async () => response(exact),
    });
    expect(new TextEncoder().encode(result.body)).toHaveLength(2_097_152);

    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(2_097_152));
        controller.enqueue(new Uint8Array(1));
      },
      cancel() {
        cancelled = true;
      },
    });
    await expect(
      requestGoogleNewsRss(request, {
        fetch: async () => new Response(stream),
      }),
    ).rejects.toMatchObject({ category: "oversize", attempts: 1 });
    expect(cancelled).toBe(true);
  });

  it("retries network failures and retryable HTTP statuses, then returns the raw response", async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("private query and URL details"))
      .mockResolvedValueOnce(response("busy", 503))
      .mockResolvedValueOnce(response("raw feed"));
    const sleep = vi.fn(async (duration: number): Promise<void> => {
      void duration;
    });
    const result = await requestGoogleNewsRss(request, { fetch, sleep });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map(([duration]) => duration)).toEqual([250, 500]);
    expect(result.body).toBe("raw feed");
  });

  it("honors Retry-After only when it is at most one second", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response("busy", 429, { "retry-after": "0.75" }))
      .mockResolvedValue(response("ok"));
    const sleep = vi.fn(async (duration: number): Promise<void> => {
      void duration;
    });
    await requestGoogleNewsRss(request, { fetch, sleep });
    expect(sleep).toHaveBeenCalledWith(750, expect.any(AbortSignal));
  });

  it("uses bounded fallback when Retry-After exceeds one second", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response("busy", 503, { "retry-after": "2" }))
      .mockResolvedValue(response("ok"));
    const sleep = vi.fn(async (duration: number): Promise<void> => {
      void duration;
    });
    await requestGoogleNewsRss(request, { fetch, sleep });
    expect(sleep).toHaveBeenCalledWith(250, expect.any(AbortSignal));
  });

  it("uses bounded fallback for an invalid Retry-After value", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response("busy", 429, { "retry-after": "later" }))
      .mockResolvedValue(response("ok"));
    const sleep = vi.fn(async (duration: number): Promise<void> => {
      void duration;
    });
    await requestGoogleNewsRss(request, { fetch, sleep });
    expect(sleep).toHaveBeenCalledWith(250, expect.any(AbortSignal));
  });

  it("falls back to a delay that fits when Retry-After exceeds the remaining deadline", async () => {
    let clock = 0;
    const fetch = vi
      .fn()
      .mockImplementationOnce(async () => {
        clock = 24_700;
        return response("busy", 429, { "retry-after": "0.5" });
      })
      .mockResolvedValueOnce(response("ok"));
    const sleep = vi.fn(async (duration: number): Promise<void> => {
      clock += duration;
    });
    await expect(
      requestGoogleNewsRss(request, { fetch, now: () => clock, sleep }),
    ).resolves.toMatchObject({ body: "ok" });
    expect(sleep).toHaveBeenCalledWith(250, expect.any(AbortSignal));
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each([408, 429, 500, 503])(
    "exhausts retries for retryable HTTP status %s",
    async (status) => {
      const fetch = vi.fn(async () => response("unavailable", status));
      const sleep = vi.fn(async (duration: number): Promise<void> => {
        void duration;
      });
      await expect(
        requestGoogleNewsRss(request, { fetch, sleep }),
      ).rejects.toMatchObject({ category: "http", status, attempts: 3 });
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(sleep.mock.calls.map(([duration]) => duration)).toEqual([
        250, 500,
      ]);
    },
  );

  it("bounds hung attempts and the complete call with the overall deadline", async () => {
    vi.useFakeTimers();
    try {
      const fetch = vi.fn<typeof globalThis.fetch>(
        () => new Promise<Response>(() => {}),
      );
      const pending = requestGoogleNewsRss(request, { fetch });
      const assertion = expect(pending).rejects.toMatchObject({
        category: "timeout",
        attempts: 3,
      });
      await vi.advanceTimersByTimeAsync(25_000);
      await assertion;
      expect(fetch).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it("retries after a per-attempt timeout", async () => {
    vi.useFakeTimers();
    try {
      const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockImplementationOnce(() => new Promise<Response>(() => {}))
        .mockResolvedValueOnce(response("recovered"));
      const pending = requestGoogleNewsRss(request, { fetch });
      await vi.advanceTimersByTimeAsync(10_250);
      await expect(pending).resolves.toMatchObject({ body: "recovered" });
      expect(fetch).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("times out during a body read and retries within the overall deadline", async () => {
    vi.useFakeTimers();
    try {
      const hangingBody = new ReadableStream<Uint8Array>({
        pull: () => new Promise<void>(() => {}),
      });
      const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValueOnce(new Response(hangingBody))
        .mockResolvedValueOnce(response("recovered"));
      const pending = requestGoogleNewsRss(request, { fetch });
      await vi.advanceTimersByTimeAsync(10_250);
      await expect(pending).resolves.toMatchObject({ body: "recovered" });
      expect(fetch).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not retry terminal HTTP errors and omits request and body data from diagnostics", async () => {
    const fetch = vi.fn(async () => response("PRIVATE RESPONSE BODY", 403));
    let error: unknown;
    try {
      await requestGoogleNewsRss(
        { ...request, query: "PRIVATE QUERY" },
        { fetch },
      );
    } catch (caught) {
      error = caught;
    }
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(error).toBeInstanceOf(GoogleNewsRssError);
    const adapterError = error as GoogleNewsRssError;
    expect(adapterError).toMatchObject({
      category: "http",
      status: 403,
      attempts: 1,
      sourceId: GOOGLE_NEWS_RSS_SOURCE_ID,
    });
    expect(JSON.stringify(adapterError)).not.toContain("PRIVATE");
    expect(adapterError.message).not.toContain("PRIVATE");
  });

  it("propagates caller cancellation and reports only completed attempts", async () => {
    const controller = new AbortController();
    const fetch = vi.fn<typeof globalThis.fetch>(
      (_url, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true },
          );
        }),
    );
    const pending = requestGoogleNewsRss(
      { ...request, signal: controller.signal },
      { fetch },
    );
    controller.abort();
    await expect(pending).rejects.toMatchObject({
      category: "cancelled",
      attempts: 1,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("propagates caller cancellation while a body read is pending", async () => {
    const controller = new AbortController();
    let markReadStarted!: () => void;
    const readStarted = new Promise<void>((resolve) => {
      markReadStarted = resolve;
    });
    const body = new ReadableStream<Uint8Array>({
      pull: () => {
        markReadStarted();
        return new Promise<void>(() => {});
      },
    });
    const fetch = vi.fn(async () => new Response(body));
    const pending = requestGoogleNewsRss(
      { ...request, signal: controller.signal },
      { fetch },
    );
    await readStarted;
    controller.abort();
    await expect(pending).rejects.toMatchObject({
      category: "cancelled",
      attempts: 1,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
