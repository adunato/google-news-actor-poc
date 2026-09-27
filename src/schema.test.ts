import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

type JsonObject = Record<string, unknown>;

type SchemaProperty = Record<string, unknown>;

function readSchema(name: string): JsonObject {
  return JSON.parse(
    readFileSync(new URL(`../.actor/${name}`, import.meta.url), "utf8"),
  ) as JsonObject;
}

describe("native Actor schemas", () => {
  it("describes the runtime input defaults and bounds", () => {
    const schema = readSchema("input_schema.json");
    const properties = schema.properties as Record<string, SchemaProperty>;

    expect(schema.required).toEqual(["queries"]);
    expect(properties.queries).toMatchObject({
      minItems: 1,
      maxItems: 20,
      items: { minLength: 1, pattern: "\\S" },
    });
    expect(properties.maxItemsPerQuery).toMatchObject({
      default: 20,
      minimum: 1,
      maximum: 100,
    });
    expect(properties.language).toMatchObject({
      default: "en-US",
      minLength: 1,
      pattern: "\\S",
    });
    expect(properties.country).toMatchObject({
      default: "US",
      minLength: 1,
      pattern: "\\S",
    });
    expect(properties.dateRange).toMatchObject({
      default: "7d",
      enum: ["any", "1h", "6h", "1d", "7d", "30d"],
    });
    expect(properties.dedupe!.default).toBe(true);
  });

  it("describes the normalized result contract and default dataset output", () => {
    const datasetSchema = readSchema("dataset_schema.json");
    const outputSchema = readSchema("output_schema.json");
    const fields = datasetSchema.fields as {
      required: unknown;
      properties: Record<string, unknown>;
    };

    expect(fields.required).toEqual([
      "query",
      "title",
      "sourceName",
      "googleNewsUrl",
      "publishedAt",
      "position",
      "language",
      "country",
      "scrapedAt",
    ]);
    expect(fields.properties).toHaveProperty("sourceUrl");
    expect(fields.properties).toHaveProperty("descriptionText");
    expect(fields.properties).toHaveProperty("guid");
    const outputProperties = outputSchema.properties as {
      results: SchemaProperty;
    };
    expect(outputProperties.results.template).toBe(
      "{{links.apiDefaultDatasetUrl}}/items",
    );
  });
});
