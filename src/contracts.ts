export const DATE_RANGES = ["any", "1h", "6h", "1d", "7d", "30d"] as const;

export type DateRange = (typeof DATE_RANGES)[number];

/** The input object accepted by the Actor before defaults are applied. */
export interface ActorInput {
  queries: unknown;
  maxItemsPerQuery?: unknown;
  language?: unknown;
  country?: unknown;
  dateRange?: unknown;
  dedupe?: unknown;
}

/** The validated input boundary consumed by later retrieval issues. */
export interface NormalizedActorInput {
  queries: string[];
  maxItemsPerQuery: number;
  language: string;
  country: string;
  dateRange: DateRange;
  dedupe: boolean;
}

/** The normalized Google News metadata record produced by later issues. */
export interface NewsResult {
  query: string;
  title: string;
  sourceName: string;
  googleNewsUrl: string;
  publishedAt: string;
  position: number;
  language: string;
  country: string;
  scrapedAt: string;
  sourceUrl?: string;
  descriptionText?: string;
  guid?: string;
}
