import { readFileSync } from "node:fs";

import { XMLParser } from "fast-xml-parser";
import { describe, expect, it, vi } from "vitest";

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

  it("throws a typed error for malformed XML", () => {
    expect(() =>
      parseGoogleNewsFeed(fixture("google-news-malformed.xml"), context),
    ).toThrowError(
      expect.objectContaining({
        name: "GoogleNewsFeedParseError",
        category: "invalid-xml",
      }),
    );
  });

  it("throws a typed error for valid XML without an RSS channel", () => {
    expect(() => parseGoogleNewsFeed("<root />", context)).toThrowError(
      expect.objectContaining({
        name: "GoogleNewsFeedParseError",
        category: "missing-channel",
      }),
    );
  });

  it("returns no results for a valid RSS channel with no items", () => {
    expect(
      parseGoogleNewsFeed(
        "<rss><channel><title>News</title></channel></rss>",
        context,
      ),
    ).toEqual([]);
  });

  it("wraps parser exceptions in a typed feed parse error", () => {
    const parse = vi
      .spyOn(XMLParser.prototype, "parse")
      .mockImplementationOnce(() => {
        throw new Error("parser failure");
      });

    try {
      expect(() =>
        parseGoogleNewsFeed("<rss><channel /></rss>", context),
      ).toThrowError(
        expect.objectContaining({
          name: "GoogleNewsFeedParseError",
          category: "parser",
          cause: expect.objectContaining({ message: "parser failure" }),
        }),
      );
    } finally {
      parse.mockRestore();
    }
  });
});
