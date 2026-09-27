import { log } from "apify";
import { describe, expect, it, vi } from "vitest";

import type { NewsResult } from "./contracts.js";
import { parseGoogleNewsFeed } from "./google-news-parser.js";
import { runActor } from "./index.js";
import { GoogleNewsRssError } from "./google-news-rss.js";

function result(query: string, url: string, position = 1): NewsResult {
  return {
    query,
    title: `Title ${url}`,
    sourceName: "Example News",
    googleNewsUrl: url,
    publishedAt: "2026-09-26T09:30:00.000Z",
    position,
    language: "en-US",
    country: "US",
    scrapedAt: "2026-09-26T10:00:00.000Z",
  };
}

function setup(
  input: unknown,
  parsedByQuery: Record<string, NewsResult[]>,
  feedParser?: typeof parseGoogleNewsFeed,
) {
  const getInput = vi.fn(async () => input);
  const main = vi.fn(async (callback: () => Promise<unknown>) => callback());
  const pushedRecords: NewsResult[][] = [];
  const pushData = vi.fn(async (records: NewsResult[]) => {
    pushedRecords.push(records);
  });
  const request = vi.fn(async ({ query }: { query: string }) => ({
    body: query,
    status: 200,
    contentType: "application/rss+xml",
    sourceId: "https://news.google.com/rss/search" as const,
  }));
  const parse = vi.fn(
    (body: string, context: Parameters<typeof parseGoogleNewsFeed>[1]) =>
      feedParser ? feedParser(body, context) : (parsedByQuery[body] ?? []),
  );
  const now = vi.fn(() => "2026-09-26T10:00:00.000Z");
  const runtime = { getInput, main, pushData } as unknown as Parameters<
    typeof runActor
  >[0];
  return {
    runtime,
    getInput,
    main,
    pushData,
    pushedRecords,
    request,
    parse,
    now,
    dependencies: { request, parse, now },
  };
}

describe("Actor query orchestration", () => {
  it("processes queries in order, applies per-query limits, deduplicates by Google News URL, and keeps first context", async () => {
    const duplicate = "https://news.google.com/rss/articles/shared";
    const state = setup(
      { queries: ["first", "second"], maxItemsPerQuery: 2 },
      {
        first: [
          result("first", duplicate),
          result("first", "first-2"),
          result("first", "over-limit"),
        ],
        second: [result("second", duplicate), result("second", "second-2")],
      },
    );

    await runActor(state.runtime, state.dependencies);

    expect(state.request.mock.calls.map(([request]) => request.query)).toEqual([
      "first",
      "second",
    ]);
    expect(state.parse.mock.calls.map(([body]) => body)).toEqual([
      "first",
      "second",
    ]);
    expect(state.pushData).toHaveBeenCalledTimes(2);
    expect(state.pushedRecords.flat()).toEqual([
      result("first", duplicate),
      result("first", "first-2"),
      result("second", "second-2"),
    ]);
  });

  it("keeps matching results independently visible when deduplication is disabled", async () => {
    const duplicate = "https://news.google.com/rss/articles/shared";
    const state = setup(
      { queries: ["first", "second"], dedupe: false },
      {
        first: [result("first", duplicate)],
        second: [result("second", duplicate)],
      },
    );

    await runActor(state.runtime, state.dependencies);

    expect(state.pushedRecords.flat()).toEqual([
      result("first", duplicate),
      result("second", duplicate),
    ]);
  });

  it("stops and propagates a typed source failure instead of treating it as an empty query", async () => {
    const error = new GoogleNewsRssError("http", 3, { status: 503 });
    const state = setup({ queries: ["first", "second"] }, {});
    state.request.mockRejectedValueOnce(error);

    await expect(runActor(state.runtime, state.dependencies)).rejects.toBe(
      error,
    );

    expect(state.request).toHaveBeenCalledTimes(1);
    expect(state.parse).not.toHaveBeenCalled();
    expect(state.pushData).not.toHaveBeenCalled();
  });

  it("keeps a successful empty query distinct and continues to later queries", async () => {
    const state = setup(
      { queries: ["empty", "has-results"] },
      { "has-results": [result("has-results", "result-url")] },
    );

    await runActor(state.runtime, state.dependencies);

    expect(state.request.mock.calls.map(([request]) => request.query)).toEqual([
      "empty",
      "has-results",
    ]);
    expect(state.pushedRecords.flat()).toEqual([
      result("has-results", "result-url"),
    ]);
  });

  it("logs and propagates malformed HTTP 200 feeds, stopping the run", async () => {
    const state = setup(
      { queries: ["malformed", "not-requested"] },
      {},
      parseGoogleNewsFeed,
    );
    state.request.mockResolvedValueOnce({
      body: "<rss><channel>",
      status: 200,
      contentType: "application/rss+xml",
      sourceId: "https://news.google.com/rss/search",
    });
    const errorLog = vi.spyOn(log, "error").mockImplementation(() => {});

    try {
      await expect(
        runActor(state.runtime, state.dependencies),
      ).rejects.toMatchObject({
        name: "GoogleNewsFeedParseError",
        category: "invalid-xml",
      });
      expect(errorLog).toHaveBeenCalledWith(
        "Google News feed could not be parsed",
        { query: "malformed", category: "invalid-xml" },
      );
    } finally {
      errorLog.mockRestore();
    }

    expect(state.request).toHaveBeenCalledTimes(1);
    expect(state.pushData).not.toHaveBeenCalled();
  });

  it("treats a valid empty RSS feed as success and continues to later queries", async () => {
    const state = setup(
      { queries: ["empty", "has-results"] },
      {},
      parseGoogleNewsFeed,
    );
    state.request
      .mockResolvedValueOnce({
        body: "<rss><channel><title>News</title></channel></rss>",
        status: 200,
        contentType: "application/rss+xml",
        sourceId: "https://news.google.com/rss/search",
      })
      .mockResolvedValueOnce({
        body: "<rss><channel><item><title>Report - Publisher</title><link>https://news.google.com/rss/articles/valid</link><pubDate>Sat, 26 Sep 2026 09:30:00 GMT</pubDate></item></channel></rss>",
        status: 200,
        contentType: "application/rss+xml",
        sourceId: "https://news.google.com/rss/search",
      });

    await runActor(state.runtime, state.dependencies);

    expect(state.request.mock.calls.map(([request]) => request.query)).toEqual([
      "empty",
      "has-results",
    ]);
    expect(state.pushedRecords.flat()).toHaveLength(1);
    expect(state.pushedRecords.flat()[0]).toMatchObject({
      query: "has-results",
      title: "Report",
    });
  });

  it("keeps validation failures inside the Actor lifecycle boundary", async () => {
    const state = setup({ queries: [] }, {});

    await expect(runActor(state.runtime, state.dependencies)).rejects.toThrow(
      /queries/,
    );
    expect(state.main).toHaveBeenCalledOnce();
    expect(state.getInput).toHaveBeenCalledOnce();
    expect(state.request).not.toHaveBeenCalled();
  });
});
