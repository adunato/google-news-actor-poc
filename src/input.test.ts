import { describe, expect, it } from "vitest";

import { DATE_RANGES } from "./contracts.js";
import { InputValidationError, normalizeActorInput } from "./input.js";

describe("normalizeActorInput", () => {
  it("applies the approved defaults and trims query values", () => {
    expect(normalizeActorInput({ queries: ["  climate policy  "] })).toEqual({
      queries: ["climate policy"],
      maxItemsPerQuery: 20,
      language: "en-US",
      country: "US",
      dateRange: "7d",
      dedupe: true,
    });
  });

  it("accepts the query and result-count boundaries", () => {
    expect(normalizeActorInput({ queries: ["one"] }).queries).toHaveLength(1);
    expect(
      normalizeActorInput({
        queries: Array.from({ length: 20 }, (_, index) => `query-${index}`),
        maxItemsPerQuery: 100,
      }),
    ).toMatchObject({ maxItemsPerQuery: 100 });
  });

  it.each([
    { queries: [], message: "queries" },
    {
      queries: Array.from({ length: 21 }, (_, index) => `query-${index}`),
      message: "queries",
    },
  ])("rejects invalid query counts", (input) => {
    expect(() => normalizeActorInput(input)).toThrowError(InputValidationError);
  });

  it.each(["", "  ", 42, null])("rejects invalid query values", (query) => {
    expect(() => normalizeActorInput({ queries: [query] })).toThrowError(
      /queries\[0\]/,
    );
  });

  it.each([0, 101, 1.5, "20", null, undefined])(
    "rejects invalid maxItemsPerQuery values (%s)",
    (maxItemsPerQuery) => {
      expect(() =>
        normalizeActorInput({ queries: ["topic"], maxItemsPerQuery }),
      ).toThrowError(/maxItemsPerQuery/);
    },
  );

  it("accepts every supported date range and rejects unsupported values", () => {
    for (const dateRange of DATE_RANGES) {
      expect(
        normalizeActorInput({ queries: ["topic"], dateRange }),
      ).toMatchObject({
        dateRange,
      });
    }

    expect(() =>
      normalizeActorInput({ queries: ["topic"], dateRange: "2d" }),
    ).toThrowError(/dateRange/);
  });

  it("validates locale controls and dedupe without coercion", () => {
    expect(
      normalizeActorInput({
        queries: ["topic"],
        language: "fr-FR",
        country: "FR",
        dedupe: false,
      }),
    ).toMatchObject({ language: "fr-FR", country: "FR", dedupe: false });

    expect(() =>
      normalizeActorInput({ queries: ["topic"], language: 7 }),
    ).toThrowError(/language/);
    expect(() =>
      normalizeActorInput({ queries: ["topic"], country: null }),
    ).toThrowError(/country/);
    expect(() =>
      normalizeActorInput({ queries: ["topic"], dedupe: "true" }),
    ).toThrowError(/dedupe/);
  });

  it("rejects missing or non-object input before downstream processing", () => {
    expect(() => normalizeActorInput(null)).toThrowError(/object/);
    expect(() => normalizeActorInput({})).toThrowError(/queries/);
    expect(() => normalizeActorInput([])).toThrowError(/object/);
  });
});
