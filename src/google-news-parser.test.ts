import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { parseGoogleNewsFeed } from "./google-news-parser.js";

const context = {
  query: "climate policy",
  language: "en-GB",
  country: "GB",
  scrapedAt: "2026-09-26T10:00:00.000Z",
};

function fixture(name: string): string {
  return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
}

describe("parseGoogleNewsFeed", () => {
  it("normalizes valid RSS items and preserves their source order", () => {
    const results = parseGoogleNewsFeed(
      fixture("google-news-valid.xml"),
      context,
    );

    expect(results).toEqual([
      {
        query: "climate policy",
        title: "Climate policy reaches a new milestone",
        sourceName: "Example News",
        googleNewsUrl: "https://news.google.com/rss/articles/example-one",
        publishedAt: "2026-09-26T09:30:00.000Z",
        position: 1,
        language: "en-GB",
        country: "GB",
        scrapedAt: "2026-09-26T10:00:00.000Z",
        sourceUrl: "https://publisher.example",
        descriptionText: "Read the report Policy details & analysis’ © ’ &lt;",
        guid: "example-guid-1",
      },
      {
        query: "climate policy",
        title: "Energy markets open higher",
        sourceName: "Market Desk",
        googleNewsUrl: "https://news.google.com/rss/articles/example-two",
        publishedAt: "2026-09-26T08:00:00.000Z",
        position: 2,
        language: "en-GB",
        country: "GB",
        scrapedAt: "2026-09-26T10:00:00.000Z",
      },
    ]);
    expect("sourceUrl" in results[1]!).toBe(false);
    expect("descriptionText" in results[1]!).toBe(false);
    expect("guid" in results[1]!).toBe(false);
  });

  it("skips incomplete items without renumbering later source positions", () => {
    const results = parseGoogleNewsFeed(
      fixture("google-news-incomplete.xml"),
      context,
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: "Valid item after an incomplete item",
      position: 2,
    });
  });

  it("returns no results for malformed XML", () => {
    expect(
      parseGoogleNewsFeed(fixture("google-news-malformed.xml"), context),
    ).toEqual([]);
  });

  it("returns no results for valid XML without an RSS channel", () => {
    expect(parseGoogleNewsFeed("<root />", context)).toEqual([]);
  });
});
