// @ts-expect-error v3.0.0 exports EntityDecoder at runtime but omits it from index.d.ts.
import { ALL_ENTITIES, EntityDecoder } from "@nodable/entities";
import { XMLParser, XMLValidator } from "fast-xml-parser";

import type { NewsResult } from "./contracts.js";

const parser = new XMLParser({
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
  parseTagValue: false,
  trimValues: true,
});
const descriptionEntityDecoder = new EntityDecoder({
  namedEntities: ALL_ENTITIES,
  numericAllowed: true,
  limit: {
    maxTotalExpansions: 10_000,
    maxExpandedLength: 100_000,
    applyLimitsTo: "all",
  },
});

export interface GoogleNewsFeedContext {
  query: string;
  language: string;
  country: string;
  scrapedAt: string;
}

type XmlRecord = Record<string, unknown>;

function isRecord(value: unknown): value is XmlRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textValue(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    return text.length > 0 ? text : undefined;
  }
  if (isRecord(value)) {
    return textValue(value["#text"]);
  }
  return undefined;
}

function optionalText(value: unknown): string | undefined {
  const text = textValue(value);
  return text && text.length > 0 ? text : undefined;
}

function parsePublishedAt(value: unknown): string | undefined {
  const sourceDate = textValue(value);
  if (!sourceDate) return undefined;
  const parsed = new Date(sourceDate);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function stripHtml(value: string): string | undefined {
  const text = value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return undefined;

  descriptionEntityDecoder.reset();
  try {
    const decoded = descriptionEntityDecoder.decode(text).trim();
    return decoded.length > 0 ? decoded : undefined;
  } catch {
    return undefined;
  }
}

function getItems(xml: unknown): unknown[] {
  if (!isRecord(xml) || !isRecord(xml.rss) || !isRecord(xml.rss.channel)) {
    return [];
  }
  const items = xml.rss.channel.item;
  if (Array.isArray(items)) return items;
  return items === undefined ? [] : [items];
}

function parseItem(
  item: unknown,
  context: GoogleNewsFeedContext,
  position: number,
): NewsResult | undefined {
  if (!isRecord(item)) return undefined;

  let title = optionalText(item.title);
  const source = isRecord(item.source) ? item.source : undefined;
  let sourceName = optionalText(source);
  const sourceUrl = optionalText(source?.["@_url"]);
  const googleNewsUrl = optionalText(item.link);
  const publishedAt = parsePublishedAt(item.pubDate);

  if (!sourceName && title) {
    const separator = title.lastIndexOf(" - ");
    if (separator > 0) sourceName = title.slice(separator + 3).trim();
  }

  if (!title || !sourceName || !googleNewsUrl || !publishedAt) return undefined;

  const sourceSuffix = ` - ${sourceName}`;
  if (title.endsWith(sourceSuffix)) {
    title = title.slice(0, -sourceSuffix.length).trim();
    if (!title) return undefined;
  }

  const description = optionalText(item.description);
  const descriptionText = description ? stripHtml(description) : undefined;
  const guid = optionalText(item.guid);

  return {
    query: context.query,
    title,
    sourceName,
    googleNewsUrl,
    publishedAt,
    position,
    language: context.language,
    country: context.country,
    scrapedAt: context.scrapedAt,
    ...(sourceUrl ? { sourceUrl } : {}),
    ...(descriptionText ? { descriptionText } : {}),
    ...(guid ? { guid } : {}),
  };
}

/** Parse and normalize the metadata items in one Google News RSS response. */
export function parseGoogleNewsFeed(
  body: string,
  context: GoogleNewsFeedContext,
): NewsResult[] {
  if (XMLValidator.validate(body) !== true) return [];
  let document: unknown;
  try {
    document = parser.parse(body);
  } catch {
    return [];
  }

  return getItems(document).flatMap((item, index) => {
    const normalized = parseItem(item, context, index + 1);
    return normalized ? [normalized] : [];
  });
}
