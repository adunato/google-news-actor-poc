# Implementation Plan: Multi-query orchestration and dataset delivery

> Canonical change-specific implementation artifact for GitHub Issue #5.

**Artifact ID:** `issue-5-implementation-plan`  
**Status:** `Approved`  
**Owner:** `Implementation owner`  
**Created / updated:** `2026-09-26`  
**GitHub Issue:** [#5 — Orchestrate multi-query runs, deduplicate results, and deliver dataset output](https://github.com/adunato/google-news-actor-poc/issues/5)  
**HLD reference:** `Not required`  
**Context references:** `docs/product.md — google-news-actor-poc-product (PR-003–PR-006); docs/architecture.md — google-news-actor-poc-architecture`

## 1. Implementation Summary

Connect the existing normalized Actor input, Google News RSS request adapter, feed parser, and result contract into a bounded Actor run. Process queries in input order, apply the configured per-query result bound, optionally deduplicate across query results while preserving the first matching query context, and persist emitted records to the default Apify dataset. Keep source request failures observable as failures rather than reporting them as a successful query with zero results. Add focused orchestration tests using controlled request and dataset boundaries, then run the repository validation command.

The change is limited to completing Issue #5's Actor run flow. It preserves the one-source, metadata-only boundary and uses Apify-native dataset output. The user authorized design-closest implementation assumptions for deduplication and query failure handling; record both assumptions in the implementation and call them out in the pull request. Document-level feed failures (malformed XML, parser exceptions, or XML without an RSS channel) also stop and fail the run using a parser/feed error type distinct from request-only `GoogleNewsRssError`. Valid RSS with no items remains a successful empty result, and malformed individual entries continue to be skipped. A failed run may leave records already pushed to the default dataset because the Actor does not roll back dataset writes.

## 2. HLD Reference

**Not required.** Issue #5 and the approved Product and Architecture Definitions already establish the required behavior and boundaries: bounded multi-query Google News metadata search, optional cross-query deduplication with first-query context, observable source failures, and default Apify dataset delivery. The change completes the existing Actor entry point by composing established components and does not require a new component or material architectural decision.

## 3. Repository Assessment

- `src/input.ts` and `src/contracts.ts` define normalized Actor input, defaults, supported controls, and the `NewsResult` output shape.
- `src/google-news-rss.ts` provides bounded lightweight HTTP/feed retrieval and typed `GoogleNewsRssError` categories for network, timeout, HTTP, oversize, and cancellation failures.
- `src/google-news-parser.ts` normalizes feed items into `NewsResult[]` and currently returns an empty array for malformed XML or missing RSS channel structure. The approved refinement changes document-level malformed-feed handling to a distinct parser/feed error while retaining empty arrays for valid RSS with no items and skipping malformed individual entries. This is an explicit deviation from the Issue #4 parser test expectation for malformed/incomplete feed documents; update those tests with the API contract change.
- `src/index.ts` currently validates and logs input inside `Actor.main`; it does not yet request feeds, orchestrate query results, or write dataset records.
- Existing tests cover input/schema, parser and request behavior, and the basic Actor lifecycle. `src/index.test.ts` is the natural location for orchestration coverage. `package.json` defines `npm run validate` as the repository-wide format, lint, type, test, and build contract.
- Durable constraints require direct Google News metadata access and Apify-native delivery. No publisher URL resolution, article extraction, browser scraping, external data service, or additional state is in scope.

## 4. Implementation Approach

### 4.1 Actor query orchestration

Extend the Actor run flow in `src/index.ts` to invoke the existing request and parser components for each normalized query, in deterministic input order, passing the normalized locale and date controls and feed context. Keep the Actor lifecycle boundary around the full run. Make the request and dataset boundaries controllable in tests so orchestration can be exercised without live Google News or Apify services.

### 4.2 Result bounds and optional deduplication

For each query, retain no more than `maxItemsPerQuery` parsed records before cross-query deduplication. When deduplication is enabled, use exact equality of the parser-trimmed `NewsResult.googleNewsUrl` as the identity and preserve the first matching record and its query context. Do not apply extra URL canonicalization. When deduplication is disabled, preserve matching records from separate queries. This is an inferred, user-authorized choice based on `googleNewsUrl` being a required normalized field; query-specific URL variants may not deduplicate.

### 4.3 Dataset output and source failure reporting

Write emitted normalized records to the Actor's default dataset using the Apify runtime. Keep successful queries with no emitted records distinguishable from failed requests or malformed feeds in the run's logs/outcome. After the request adapter exhausts its retries, the first `GoogleNewsRssError` stops further queries and is rethrown through `Actor.main`, failing the run. Malformed XML, parser exceptions, and XML lacking an RSS channel must raise a distinct parser/feed error (for example, `GoogleNewsFeedError`); log and rethrow it through `Actor.main`, stopping further queries and failing the run. Keep `GoogleNewsRssError` request-only. Valid RSS with no items remains `[]`, and malformed individual entries continue to be skipped. Records already pushed to the dataset can remain after a request or parse failure; no rollback is planned. The request-failure policy is an inferred, user-authorized choice based on the existing adapter's typed throws and Actor error propagation.

### 4.4 Orchestration verification

Expand Actor lifecycle tests to cover query order, per-query bounds, deduplication enabled and disabled, first-query context, dataset writes, and stopping/rethrowing request and parse failures. Add parser tests for malformed XML, parser exceptions, missing RSS channel, valid RSS with zero items, and malformed individual entries. Update the Issue #4 malformed/incomplete document tests to expect the new typed parser/feed error; preserve tests proving malformed entries are skipped.

## 5. Implementation Sequence

1. Change the parser contract so malformed XML, parser exceptions, and XML lacking an RSS channel raise a distinct parser/feed error; preserve `[]` for valid RSS with no items and preserve malformed-entry skipping. Update the affected Issue #4 tests as an explicit API/test-contract deviation.
2. Extend the Actor orchestration flow to retrieve and parse queries in order, applying the per-query result bound before cross-query deduplication.
3. Add optional cross-query deduplication using exact equality of parser-trimmed `googleNewsUrl`, retaining the first matching query context; preserve duplicates when disabled.
4. Push records to the default dataset as results are processed. On the first unrecovered request or parser/feed error, stop further queries and rethrow through `Actor.main`; document that previously pushed records can remain.
5. Add focused parser and Actor integration tests for the Issue #5 acceptance criteria, run `npm run validate`, and prepare the implementation hand-off for validation.

The deduplication and request-failure assumptions above are implementation choices authorized by the user for this plan. The parser error refinement is an approved design change from the earlier Issue #4 malformed/incomplete document test contract. The pull request must highlight the dedupe and request-failure assumptions, the parser contract change, the possibility of query-specific URL variants not deduplicating, and that a failed run can leave a partial dataset.

## 6. Development Integrity Checks

- Run `npm run validate` from the issue worktree. This is the repository-wide quality contract and includes formatting, lint, TypeScript checking, tests, and build.
- Confirm the implementation uses the existing Actor input and `NewsResult` contracts and writes through the default Apify dataset.
- Confirm no new source, browser, proxy, persistence, or enrichment dependency is introduced.

## 7. Validation Requirements

### Unit Validation

- Queries are requested and processed in their input order.
- Each query contributes at most `maxItemsPerQuery` records before global deduplication.
- With deduplication enabled, records whose parser-trimmed `googleNewsUrl` values are exactly equal are emitted once and retain the first matching query context; URL variants are not canonicalized.
- With deduplication disabled, matching records from different queries remain separate.
- Emitted records are written to the default dataset with the existing normalized metadata shape.
- The first unrecovered source request failure or parser/feed failure is observable, stops remaining queries, and propagates through `Actor.main` to fail the run. It remains distinct from a successful query with zero records: request failures raise `GoogleNewsRssError`; malformed XML, parser exceptions, and XML lacking RSS channel raise the distinct parser/feed error; valid RSS with zero items returns `[]`. Malformed individual entries continue to be skipped. Any records already pushed to the dataset can remain.
- Parser unit tests cover each document-level failure and the valid empty-feed and malformed-entry cases. Actor integration tests prove parse errors are logged/rethrown and stop further queries, while earlier dataset writes can remain.
- Invalid input continues to fail through the existing Actor lifecycle validation path.

### End-to-End Validation

- Exercise a complete Actor run through test doubles for retrieval and dataset delivery, with multiple queries, repeated results, and a source failure. Verify request order, dataset contents, and the approved run outcome without depending on live Google News.

### Other Relevant Validation

- Run `npm run validate` and capture its result in the Issue implementation hand-off.
- No live Apify deployment or paid Store run is needed to validate this orchestration change.

## 8. Open Implementation Questions

No material implementation questions remain. The following user-authorized assumptions and approved refinement fill behavior not specified by the durable product or architecture definitions:

1. **Deduplication identity:** Exact equality of parser-trimmed `NewsResult.googleNewsUrl`; no additional URL canonicalization. This uses a required normalized field, with the tradeoff that query-specific URL variants may not deduplicate.
2. **Query failure policy:** After bounded retries, the first `GoogleNewsRssError` stops further query processing and is rethrown through `Actor.main`, failing the run. Records already pushed to the default dataset can remain, so the dataset may contain partial output.
3. **Parser/feed failures:** Malformed XML, parser exceptions, and XML lacking RSS channel raise a distinct parser/feed error that is logged and rethrown through `Actor.main`, stopping the run. Valid RSS with zero items remains an empty result, and malformed individual entries remain skipped. This changes the Issue #4 parser test/API expectation for malformed or incomplete feed documents.

The deduplication and request-failure choices are design-closest inferences from the required `googleNewsUrl` field, existing typed adapter errors, and Actor error propagation. The parser/feed behavior is an approved design refinement. The pull request must identify these assumptions/refinement, the Issue #4 test-contract deviation, and the partial-dataset behavior explicitly.

## 9. Low-Level Design Decision

**LLD required:** `No`

### Rationale

The change composes existing request, parsing, input, and result-contract components through the existing Actor entry point. The Issue, approved durable definitions, and this plan describe the responsibilities, ordering, limits, dataset boundary, and required verification sufficiently for implementation. The user authorized the deduplication and request-failure choices and approved the parser/feed error refinement recorded in Section 8. A separate file-level design is not warranted.

## 10. Implementation Checklist

- [x] Record the user-authorized deduplication identity and query failure policy.
- [ ] Implement ordered query orchestration and per-query result bounds.
- [ ] Implement approved optional deduplication semantics and preserve first-query context.
- [ ] Write normalized result records to the default Apify dataset and report source failures distinctly.
- [ ] Add focused orchestration coverage for Issue #5 acceptance criteria.
- [ ] Complete `npm run validate`.
- [ ] Prepare implementation hand-off for validation with Issue and decision traceability.

### Approval

**Decision:** `Approve implementation`  
**Rationale:** `The user authorized the design-closest choices for deduplication identity and query failure behavior and approved the parser/feed error refinement. The remaining implementation work is sufficiently bounded by this plan and Issue #5.`  
**Required follow-up:** `Update Issue #4 parser tests to reflect the document-level error contract while retaining malformed-entry skipping. The implementation pull request must highlight the assumptions/refinement, test-contract deviation, and possibility of partial dataset output after a failed run.`

### Completion contract

This plan is Approved for implementation under the assumptions and parser/feed refinement recorded in Section 8. The implementation pull request must make them, the Issue #4 test-contract deviation, and the partial-dataset behavior clear.
