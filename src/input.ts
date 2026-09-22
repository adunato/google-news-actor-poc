import {
  DATE_RANGES,
  type DateRange,
  type NormalizedActorInput,
} from "./contracts.js";

const MIN_QUERY_COUNT = 1;
const MAX_QUERY_COUNT = 20;
const DEFAULT_MAX_ITEMS_PER_QUERY = 20;
const MIN_ITEMS_PER_QUERY = 1;
const MAX_ITEMS_PER_QUERY = 100;
const DEFAULT_LANGUAGE = "en-US";
const DEFAULT_COUNTRY = "US";
const DEFAULT_DATE_RANGE: DateRange = "7d";
const DEFAULT_DEDUPE = true;

export class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasProperty(input: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new InputValidationError(`${field} must be a string`);
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new InputValidationError(`${field} must not be empty`);
  }

  return normalized;
}

function requireIntegerInRange(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new InputValidationError(`${field} must be an integer`);
  }

  if (value < minimum || value > maximum) {
    throw new InputValidationError(
      `${field} must be between ${minimum} and ${maximum}`,
    );
  }

  return value;
}

function requireDateRange(value: unknown): DateRange {
  if (typeof value !== "string" || !DATE_RANGES.includes(value as DateRange)) {
    throw new InputValidationError(
      `dateRange must be one of: ${DATE_RANGES.join(", ")}`,
    );
  }

  return value as DateRange;
}

/** Normalize and validate the public Actor input contract. */
export function normalizeActorInput(input: unknown): NormalizedActorInput {
  if (!isRecord(input)) {
    throw new InputValidationError("Actor input must be an object");
  }

  if (!hasProperty(input, "queries")) {
    throw new InputValidationError("queries is required");
  }

  if (!Array.isArray(input.queries)) {
    throw new InputValidationError("queries must be an array");
  }

  if (
    input.queries.length < MIN_QUERY_COUNT ||
    input.queries.length > MAX_QUERY_COUNT
  ) {
    throw new InputValidationError(
      `queries must contain between ${MIN_QUERY_COUNT} and ${MAX_QUERY_COUNT} items`,
    );
  }

  const queries = input.queries.map((query, index) =>
    requireNonEmptyString(query, `queries[${index}]`),
  );

  const maxItemsPerQuery = hasProperty(input, "maxItemsPerQuery")
    ? requireIntegerInRange(
        input.maxItemsPerQuery,
        "maxItemsPerQuery",
        MIN_ITEMS_PER_QUERY,
        MAX_ITEMS_PER_QUERY,
      )
    : DEFAULT_MAX_ITEMS_PER_QUERY;

  const language = hasProperty(input, "language")
    ? requireNonEmptyString(input.language, "language")
    : DEFAULT_LANGUAGE;

  const country = hasProperty(input, "country")
    ? requireNonEmptyString(input.country, "country")
    : DEFAULT_COUNTRY;

  const dateRange = hasProperty(input, "dateRange")
    ? requireDateRange(input.dateRange)
    : DEFAULT_DATE_RANGE;

  if (hasProperty(input, "dedupe") && typeof input.dedupe !== "boolean") {
    throw new InputValidationError("dedupe must be a boolean");
  }

  const dedupe = hasProperty(input, "dedupe") ? input.dedupe : DEFAULT_DEDUPE;

  return {
    queries,
    maxItemsPerQuery,
    language,
    country,
    dateRange,
    dedupe: dedupe as boolean,
  };
}
