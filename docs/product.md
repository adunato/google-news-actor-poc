# Product Definition: Google News Actor POC

> Canonical durable product artifact. This document translates the approved Apify POC definition into durable product context for the development repository.

**Artifact ID:** `google-news-actor-poc-product`  
**Status:** `Approved`  
**Owner:** `SideGig product owner`  
**Created / updated:** `2026-09-21`  
**Upstream context:** `SideGig implementation/apify/poc.md — Step 7, Step 8 and Gateway 3`  
**Traceability:** `Gateway 3 Pass; Step 9 repository establishment`

## 1. Product Summary

Google News Actor POC is a small, public-paid Apify experiment that lets users submit Google News search expressions and receive structured article metadata through an Apify Actor and its default dataset/API. It tests whether a low-cost, reliable, lightweight metadata-search product can attract measurable usage without expanding into publisher-page extraction or a broader news platform.

## 2. Users and Primary Use Cases

### Users

- Developers, automation builders and researchers consuming current Google News results programmatically.
- PR, marketing, content and AI/data workflows that need structured news-search metadata.

### Primary Use Cases

1. Submit one or more Google News queries and retrieve normalized result metadata.
2. Select a language, country/edition and bounded recency window for the search.
3. Consume results from the Apify default dataset/API with an optional per-query limit and cross-query deduplication.

## 3. Product Scope

### In Scope

- Query-driven Google News metadata search, with up to 20 non-empty queries per run.
- `maxItemsPerQuery` from 1 to 100, default 20.
- Language (default `en-US`), country (default `US`), and date range (`any`, `1h`, `6h`, `1d`, `7d`, `30d`; default `7d`).
- Optional deduplication, default enabled.
- Apify-native input/output schemas, default dataset delivery, API/export access and a concise user README.
- A temporary POC pay-per-event price of $0.001 per dataset result, plus the applicable Apify Actor-start event.

### Out of Scope

- Canonical publisher URL resolution, full article-body extraction, images/media extraction, or browser-based scraping.
- Residential-proxy dependence, paid external data/API dependencies, stateful monitoring/alerting, sentiment/clustering/AI enrichment, and multi-source aggregation.
- Production hardening, final pricing, or a production launch commitment.

## 4. Product Capabilities

| Capability           | Description                                                                                                                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google News search   | Execute bounded user-supplied search expressions against Google News and return structured metadata.                                                                                                                       |
| Query controls       | Support multiple queries, locale, country/edition, recency and per-query result limits within the POC bounds.                                                                                                              |
| Result normalization | Return stable required metadata: `query`, `title`, `sourceName`, `googleNewsUrl`, `publishedAt`, `position`, `language`, `country` and `scrapedAt`, with optional source URL, description and GUID fields where available. |
| Dataset/API delivery | Store records in the default Apify dataset and expose them through normal Apify API/export/integration mechanisms.                                                                                                         |
| POC observability    | Rely on Apify-native run, dataset, analytics, monitoring and charging evidence for the later observation window.                                                                                                           |

## 5. Product Requirements and Behaviour

| ID       | Requirement                                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `PR-001` | Accept 1–20 non-empty query strings and reject inputs outside that bound.                                                                     |
| `PR-002` | Apply the supported locale, country and bounded date-range controls without claiming deterministic ranking or exhaustive historical coverage. |
| `PR-003` | Bound each query to 1–100 results and default to 20.                                                                                          |
| `PR-004` | Emit normalized records with the required core fields; optional metadata may be absent when the source does not provide it.                   |
| `PR-005` | Optionally deduplicate records across queries while retaining the first matching query context.                                               |
| `PR-006` | Use lightweight direct HTTP/feed access and Apify-native storage/delivery; source failures must remain observable.                            |

## 6. External Interaction and Contract

The future Apify Actor accepts native Actor input containing `queries` plus optional `maxItemsPerQuery`, `language`, `country`, `dateRange` and `dedupe`. It writes normalized records to the default Apify dataset. Google News URLs and source metadata are returned; canonical publisher URLs and article bodies are not promised. The public Store README and native schemas are part of the POC contract and must be completed before paid observation.

## 7. Constraints and Non-Goals

- Google News controls, result ranking, feed shape and availability are upstream-controlled and may vary.
- A single query is bounded to the feed results Google exposes; the POC does not promise exhaustive coverage.
- Apify supplies execution, storage, Store publication, charging and usage evidence.
- The 30-day public paid observation window begins only after implementation, validation, Store and billing configuration, temporary PPE verification and launch-baseline capture are complete.

## 8. Open Product Questions

No outstanding product-definition questions block architecture or change design. Store publication, billing, PPE and launch baseline are implementation/operation completion dependencies, not unresolved product scope.

## 9. Product Definition Summary

- This is a bounded one-source Google News metadata-search experiment on Apify.
- The POC tests user demand, reliability, completeness, control semantics and economics before any production commitment.
- Deferred enrichment and platform capabilities remain explicit non-goals.
