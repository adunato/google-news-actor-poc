# Low-Level Design: Bounded Google News Request Adapter

**Artifact ID:** `issue-3-google-news-request-adapter-lld`  
**Status:** `Approved`  
**Owner:** `Development team (design author: Codex)`  
**Created / updated:** `2026-09-26`  
**GitHub Issue:** [#3 — Implement bounded Google News request adapter](https://github.com/adunato/google-news-actor-poc/issues/3)  
**Implementation Plan:** `docs/changes/3/implementation-plan.md` — `issue-3-google-news-request-adapter-plan`  
**HLD reference:** `docs/changes/3/high-level-design.md` — `issue-3-google-news-request-adapter-hld`

## 1. Change Overview

Add an independently callable TypeScript adapter that accepts one normalized query context, constructs the Google News RSS search URL, and returns bounded raw response text with response metadata. Keep request construction, retry/deadline handling, streaming size enforcement, and typed failures within the adapter module. Colocated tests exercise the adapter through injected fetch and timing dependencies. The Actor entrypoint and shared input contract remain unchanged.

## 2. File Changes

### `src/google-news-rss.ts`

**Action:** `Create`

Own the public request adapter and its local types. Export `requestGoogleNewsRss(request, deps?)`, where `request` contains one normalized `query`, `language`, `country`, and `dateRange: DateRange`, with an optional caller `AbortSignal`. The optional dependency object supplies `fetch` and clock/timer or wait functions for deterministic tests; production defaults use the platform fetch and timing APIs. Import the existing `DateRange` type from `contracts.ts` rather than duplicating the supported range union.

Export a response type containing the raw UTF-8-decoded body, HTTP status, content type (nullable when absent), and safe `sourceId` (`https://news.google.com/rss/search`, without query parameters). Export a typed adapter error with stable categories `network`, `timeout`, `http`, `oversize`, and `cancelled`; expose attempts used, safe source ID, and HTTP status only when applicable. Preserve a causal error internally for debugging, but do not copy its text into the public message or serialize it: fetch causes can contain request details. Error messages and any diagnostic fields must not include query text, the full URL, or response body.

Build a `URL` for the fixed `/rss/search` endpoint. Set `q` to the query, appending ` when:<range>` for `1h`, `6h`, `1d`, `7d`, or `30d`, and omit the operator for `any`. Set `hl` to the input language and `gl` to the country. Set `ceid` to `<country>:<primary-language-subtag>`, deriving the subtag from the portion before the first `-` in the supplied language and preserving its case. Let `URLSearchParams` encode all parameter values. The adapter requires a validated `DateRange` from the caller and maps the six declared values; input validation remains in `src/input.ts`. Do not add locale or country allowlists.

Perform a direct GET with at most 3 attempts. Bound each attempt to 10 seconds and the complete adapter call—including fetch, body reading, and retry waits—to 25 seconds. The overall deadline takes precedence over attempt timers and backoff. Propagate caller cancellation immediately and never retry it. Retry network failures, attempt timeouts, HTTP 408, HTTP 429, and HTTP 5xx only while attempts and the overall deadline remain. Do not retry other HTTP statuses, cancellation, or oversize responses. For HTTP 429/503, honor a parseable `Retry-After` delay only when it is at most 1 second and fits within the remaining overall deadline; otherwise use 250 ms before the second attempt and 500 ms before the third.

For a successful response, read the response stream incrementally and count bytes before retaining each chunk. Accept a body up to and including 2,097,152 bytes; cancel the reader and return `oversize` as soon as a further byte would exceed that cap. Decode the bounded byte sequence as UTF-8 after reading completes. An empty body or unexpected content type remains a successful raw response for Issue #4 to interpret. Ensure attempt and overall timers cover body reads as well as response-header arrival, and release/cancel stream resources on timeout, caller cancellation, or oversize failure.

### `src/google-news-rss.test.ts`

**Action:** `Create`

Use Vitest and injected fetch/timing dependencies to verify URL construction and parameter encoding; all supported date ranges and representative locale mapping; raw success output; exact inclusive body-size boundary and overflow cancellation; retryable versus terminal failures; attempt and overall time bounds; caller cancellation; `Retry-After` behavior; attempt counts; and safe public diagnostics. Avoid live upstream calls so checks remain deterministic. Tests must also prove that query text, the full URL, and body content do not appear in terminal error fields.

## 3. Cross-File Dependencies

1. `src/contracts.ts` supplies the existing `DateRange` type and its approved values; the adapter consumes this type without modifying the shared input contract.
2. `src/google-news-rss.ts` exposes the raw response and safe error contract for later orchestration and Issue #4 parsing. This Issue does not wire either consumer into `src/index.ts`.
3. `src/google-news-rss.test.ts` imports the adapter and uses its dependency seam to verify behavior without network access or real-time waits.

## 4. File Change Summary

| File                          | Action | Purpose                                                                                                                    |
| ----------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| `src/google-news-rss.ts`      | Create | Build one Google News RSS request and enforce bounded fetch, body, retry, deadline, cancellation, and safe error behavior. |
| `src/google-news-rss.test.ts` | Create | Deterministically validate URL mapping, response behavior, operational limits, retry rules, and diagnostic privacy.        |

### Approval

**Decision:** `Approve implementation`  
**Rationale:** The file ownership, public request/response/error contract, injected test seams, and timer/body handling are specified against the approved Issue #3 HLD and implementation plan. The plan requires an approved LLD before implementation; this status records readiness for that implementation step. Google News `when:` and `ceid` semantics remain observed compatibility assumptions, as documented in the HLD.

**Unresolved file-level decisions:** None.

**Learning checkpoint:** `Learnings: None` — this design work surfaced no reusable lesson beyond the approved change artifacts.
