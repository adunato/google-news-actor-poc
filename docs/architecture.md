# Architecture Definition: Google News Actor POC

> Canonical durable architecture artifact. This document records the architecture known at project establishment for the approved Google News metadata-search POC.

**Artifact ID:** `google-news-actor-poc-architecture`  
**Status:** `Approved`  
**Owner:** `SideGig product owner`  
**Created / updated:** `2026-09-21`  
**Product Definition:** `docs/product.md — google-news-actor-poc-product`  
**Traceability:** `Step 7 functional scope; Step 8 operational requirements; Gateway 3 Pass`

## 1. Architecture Summary

The product is a single Apify Actor that receives native Actor input, constructs bounded Google News search/feed requests, parses and normalizes returned metadata, optionally deduplicates results, and pushes records to the default Apify dataset. Apify provides the runtime, dataset/API delivery, Store surface, pay-per-event charging and native operational evidence.

The architecture intentionally uses lightweight direct HTTP/feed access. It has no browser automation, publisher-page crawler, external database, paid data API, proxy service or separate monitoring system. Implementation detail and source-specific parsing choices remain for the Issue-driven development work that follows project establishment.

## 2. System Context and Boundaries

Inside the product boundary are Actor input validation, Google News request construction, response parsing, metadata normalization, bounded result selection, optional cross-query deduplication and dataset output. Outside the boundary are Apify execution/storage/analytics/charging services and Google's public News search/feed behaviour.

Users invoke the Actor through Apify Console/API/Store integrations. Google News is an uncontrolled upstream dependency; the POC records source failures rather than masking them with heavier infrastructure.

## 3. Components and Responsibilities

| Component                  | Responsibility                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Apify Actor entrypoint     | Receive and validate native Actor input, orchestrate one run and report run errors/status.                 |
| Query/request adapter      | Apply query, locale, country and bounded recency controls to lightweight Google News requests.             |
| Feed parser and normalizer | Convert source items into the stable POC output fields and preserve optional metadata where available.     |
| Deduplication/limit stage  | Enforce per-query limits and optional cross-query deduplication without changing source semantics.         |
| Apify default dataset      | Persist normalized output records and expose standard API/export/integration access.                       |
| Apify platform services    | Provide runtime, Store publication, PPE events, run logs, monitoring, analytics and cost/revenue evidence. |

## 4. Principal Flows

### Query run

1. A user submits Actor input through Apify.
2. The Actor validates query count, result bounds and supported controls.
3. The request adapter obtains Google News feed/search responses for each query.
4. The parser normalizes stable metadata, applies limits and optional deduplication.
5. The Actor writes records to the default dataset and exposes the run result through Apify APIs.

### Operational evidence

1. Apify records run status, logs, resource usage and charged events.
2. Dataset field statistics and samples provide completeness evidence.
3. Actor Analytics and public run statistics provide usage, revenue, cost and repeat-use evidence during the later observation window.

## 5. Interfaces and Integrations

| Interface / integration                  | Purpose                                       | Direction / contract                                                                |
| ---------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| Apify Actor input schema                 | Accept queries and bounded optional controls. | User/API → Actor; native schema, with validation.                                   |
| Google News public search/feed behaviour | Source of article metadata.                   | Actor → Google; lightweight HTTP/feed access, upstream-controlled response.         |
| Apify default dataset/API                | Deliver normalized records.                   | Actor → Apify dataset; stable required and optional output fields.                  |
| Apify Store/PPE                          | Public paid experiment and charging.          | Apify platform ↔ users/creator; temporary POC pricing and native charging evidence. |

## 6. Data and State

The principal data object is a normalized result record containing `query`, `title`, `sourceName`, `googleNewsUrl`, `publishedAt`, `position`, `language`, `country` and `scrapedAt`, plus optional `sourceUrl`, `descriptionText` and `guid`. The default Apify dataset is the durable POC output store. No separate persistent application state or user database is required.

## 7. Deployment and Runtime

The target runtime is an Apify Actor deployed through the Apify platform and ultimately published in the Apify Store. The repository is the source of the Actor build and release candidate. Public paid observation starts only after Store publication configuration, billing/PPE verification and launch-baseline capture are complete. No deployment workflow is required at bootstrap because the release mechanism and credentials are not yet established.

## 8. Cross-Cutting Architecture

- **Security:** Keep Apify credentials and billing/deployment secrets in managed secret stores; never commit them. Treat Google responses and user input as untrusted data.
- **Reliability:** Bound query count/results and surface source failures. Retry/backoff behaviour must remain bounded and in scope when designed.
- **Observability:** Use Apify-native logs, run status, dataset evidence, monitoring and analytics; no separate stateful monitoring product is part of this POC.
- **Performance / scale:** Optimize for small, bounded POC runs, not a general crawling platform or exhaustive search.
- **Cost:** Avoid mandatory paid data/proxy dependencies and keep Apify platform cost within the Step 7 economics criterion.

## 9. Architecture Principles and Constraints

- Preserve the one-source, metadata-only Google News POC boundary.
- Prefer the simplest direct HTTP/feed implementation that can test the capability assumptions.
- Use native Apify Actor schemas, default dataset, API and PPE rather than external infrastructure.
- Do not introduce canonical-link/full-text enrichment, browser scraping, residential proxies, AI enrichment, monitoring state or multi-source aggregation without an explicit approved scope decision.

## 10. Open Architecture Questions

No outstanding architecture questions block the next Issue-driven design activity. Concrete parser, schema-library and deployment-automation choices are implementation-level decisions to be made through the normal lifecycle.

## 11. Architecture Summary

- One bounded Apify Actor obtains and normalizes Google News metadata through lightweight HTTP/feed access.
- Apify owns execution, output storage, public distribution, charging and native operational evidence.
- The architecture deliberately excludes publisher extraction, heavy scraping infrastructure and external state/services.
