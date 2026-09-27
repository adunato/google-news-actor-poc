import { Actor, log } from "apify";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { NewsResult, NormalizedActorInput } from "./contracts.js";
import {
  GoogleNewsFeedParseError,
  parseGoogleNewsFeed,
  type GoogleNewsFeedContext,
} from "./google-news-parser.js";
import {
  GoogleNewsRssError,
  requestGoogleNewsRss,
  type GoogleNewsRssRequest,
} from "./google-news-rss.js";
import { normalizeActorInput } from "./input.js";

type ActorRuntime = Pick<typeof Actor, "getInput" | "main" | "pushData">;

interface RunDependencies {
  request: (
    request: GoogleNewsRssRequest,
  ) => ReturnType<typeof requestGoogleNewsRss>;
  parse: (body: string, context: GoogleNewsFeedContext) => NewsResult[];
  now: () => string;
}

const defaultDependencies: RunDependencies = {
  request: requestGoogleNewsRss,
  parse: parseGoogleNewsFeed,
  now: () => new Date().toISOString(),
};

/** Run a bounded multi-query search and deliver normalized records to the default dataset. */
export async function runActor(
  runtime: ActorRuntime = Actor,
  dependencies: RunDependencies = defaultDependencies,
): Promise<NormalizedActorInput | undefined> {
  return runtime.main(async () => {
    const input = await runtime.getInput<unknown>();
    const normalizedInput = normalizeActorInput(input);

    log.info("Actor input accepted", {
      queryCount: normalizedInput.queries.length,
      maxItemsPerQuery: normalizedInput.maxItemsPerQuery,
      language: normalizedInput.language,
      country: normalizedInput.country,
      dateRange: normalizedInput.dateRange,
      dedupe: normalizedInput.dedupe,
    });

    const seenUrls = new Set<string>();
    for (const query of normalizedInput.queries) {
      let response;
      try {
        response = await dependencies.request({
          query,
          language: normalizedInput.language,
          country: normalizedInput.country,
          dateRange: normalizedInput.dateRange,
        });
      } catch (error) {
        if (error instanceof GoogleNewsRssError) {
          log.error("Google News query failed", {
            query,
            category: error.category,
            attempts: error.attempts,
            ...(error.status === undefined ? {} : { status: error.status }),
          });
        }
        throw error;
      }

      const context: GoogleNewsFeedContext = {
        query,
        language: normalizedInput.language,
        country: normalizedInput.country,
        scrapedAt: dependencies.now(),
      };
      let parsedResults: NewsResult[];
      try {
        parsedResults = dependencies.parse(response.body, context);
      } catch (error) {
        if (error instanceof GoogleNewsFeedParseError) {
          log.error("Google News feed could not be parsed", {
            query,
            category: error.category,
          });
        }
        throw error;
      }
      const queryResults = parsedResults.slice(
        0,
        normalizedInput.maxItemsPerQuery,
      );
      const emitted = normalizedInput.dedupe
        ? queryResults.filter((result) => {
            if (seenUrls.has(result.googleNewsUrl)) return false;
            seenUrls.add(result.googleNewsUrl);
            return true;
          })
        : queryResults;

      if (queryResults.length === 0) {
        log.info("Google News query completed with no results", { query });
      }
      if (emitted.length > 0) await runtime.pushData(emitted);
    }

    return normalizedInput;
  });
}

function isEntrypoint(): boolean {
  const entrypoint = process.argv[1];
  return (
    entrypoint !== undefined &&
    fileURLToPath(import.meta.url) === resolve(entrypoint)
  );
}

if (isEntrypoint()) {
  await runActor();
}
