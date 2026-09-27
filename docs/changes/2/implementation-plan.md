# Implementation Plan: Apify Actor runtime and contracts

> Canonical change-specific implementation artifact for Issue #2.

**Artifact ID:** `issue-2-apify-actor-runtime-plan`  
**Status:** `Approved`  
**Owner:** `SideGig product owner`  
**Created / updated:** `2026-09-21`  
**GitHub Issue:** `#2 — Establish Apify Actor runtime and input/output contracts`  
**HLD reference:** `docs/changes/2/hld.md — issue-2-apify-actor-runtime-hld`  
**Context references:** `docs/product.md; docs/architecture.md; AGENTS.md`

## 1. Implementation Summary

Replace the bootstrap placeholder with the minimum working Apify Actor foundation while keeping retrieval explicitly out of scope. The implementation will add the Apify runtime dependency, native Actor configuration/schema artifacts, typed input/result contracts, input normalization/validation, a minimal lifecycle entrypoint, and focused tests.

The implementation should leave the repository in a state where Issue #3 can add Google News requests against a stable normalized input boundary and Issue #4 can produce records against a stable result contract.

## 2. HLD Reference

The approved HLD is `docs/changes/2/hld.md` (`issue-2-apify-actor-runtime-hld`).

It constrains implementation to:

- a minimal Apify Actor lifecycle;
- explicit native schema metadata;
- runtime input validation and defaulting;
- a typed normalized input/result boundary;
- no Google News retrieval, parsing, dataset-result production, browser automation, paid external API, proxy, or external database work.

## 3. Repository Assessment

The current repository is a small TypeScript/ESM bootstrap:

- `src/index.ts` is a placeholder and does not run an Actor lifecycle;
- `src/index.test.ts` only verifies the bootstrap status marker;
- `package.json` has development tooling but no runtime dependency;
- `npm run validate` already provides formatting, lint, typecheck, unit-test, and build gates;
- there is currently no `.actor` configuration area or Actor schema metadata;
- `docs/product.md` and `docs/architecture.md` already define the external PoC contract and architecture boundary;
- Issue #3 depends on this Issue and should be able to reuse the normalized input contract without redefining it.

The implementation should extend the existing scaffold rather than restructure the repository more broadly.

## 4. Implementation Approach

### 4.1 Actor runtime foundation

Add the Apify JavaScript SDK as the production runtime dependency and convert the application entrypoint into a minimal Actor lifecycle.

The entrypoint should initialize the Actor runtime, read the input, invoke the contract boundary, and complete cleanly. Lifecycle orchestration should remain thin so validation and defaults can be tested independently of Actor startup.

No network request to Google News is permitted in this Issue.

### 4.2 Input contract and validation

Introduce a typed user-input shape and a normalized internal input shape.

Implement one normalization/validation boundary that:

- requires 1–20 non-empty queries;
- enforces `maxItemsPerQuery` 1–100 with default 20;
- defaults `language` to `en-US`;
- defaults `country` to `US`;
- restricts `dateRange` to `any | 1h | 6h | 1d | 7d | 30d` with default `7d`;
- defaults `dedupe` to `true`;
- rejects explicitly invalid types/values rather than coercing them silently.

Keep error messages deterministic enough for tests and useful enough for Actor run logs.

### 4.3 Result contract

Introduce the normalized result type required by the Product Definition:

Required:
`query`, `title`, `sourceName`, `googleNewsUrl`, `publishedAt`, `position`, `language`, `country`, `scrapedAt`.

Optional:
`sourceUrl`, `descriptionText`, `guid`.

Do not add parser behaviour or instantiate result records in this Issue.

### 4.4 Native Apify configuration and schemas

Create the Actor configuration area and explicitly reference the schema artifacts from the Actor definition.

The input schema must mirror the runtime input contract, including required queries, bounds, supported date ranges, defaults, titles/descriptions, and useful editor metadata.

Define dataset/result schema metadata for the normalized news-result contract and an Actor output surface that points consumers to the default dataset. Keep the schema focused on contract/documentation; actual dataset writes arrive in Issue #5.

Do not introduce Store pricing/PPE configuration or final Store documentation here.

### 4.5 Tests and bootstrap replacement

Replace the bootstrap-only status test with tests around the real foundation behaviour.

Tests should focus on pure contract logic wherever possible. A small lifecycle smoke test may mock the Actor boundary rather than requiring live Apify infrastructure. The implementation must remain compatible with the existing Vitest/TypeScript/ESLint/Prettier toolchain.

## 5. Implementation Sequence

1. Add the Apify runtime dependency and establish the typed input/result contracts.
2. Implement input normalization/validation and unit tests for defaults, boundaries, and invalid cases.
3. Add explicit Actor configuration plus input, output, and dataset schema metadata matching the runtime contracts.
4. Replace the placeholder entrypoint with the thin Actor lifecycle that consumes the normalized input.
5. Replace/remove bootstrap-only tests and add the minimal Actor-foundation smoke coverage.
6. Run all repository integrity checks and verify that no Google News request path or other out-of-scope dependency was introduced.

The contract comes before lifecycle integration so the entrypoint and subsequent Issues depend on a tested boundary rather than embedding validation directly in orchestration.

## 6. Development Integrity Checks

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run validate`
- Validate native Apify schema syntax using the project-compatible Apify CLI/schema validation path if available in the selected SDK/tooling setup.

## 7. Validation Requirements

### Unit Validation

- Normalize minimum valid input and all default values.
- Accept 1 and 20 queries; reject 0 and 21.
- Reject non-string and whitespace-only query items.
- Accept `maxItemsPerQuery` 1 and 100; reject values outside the range and non-integers.
- Accept every supported `dateRange`; reject unsupported values.
- Validate supplied primitive types for language, country, and dedupe.
- Confirm explicitly invalid values are not replaced silently by defaults.

### End-to-End Validation

- Run the built Actor foundation with representative valid input and confirm the Actor lifecycle completes successfully without a Google News request.
- Run with representative invalid input and confirm the run fails at the input boundary with an actionable validation error.
- Confirm the Actor exposes the intended native input and result/output schema metadata.

### Other Relevant Validation

- Compare native schema defaults/enumerations/field names with the runtime types and `docs/product.md`.
- Confirm no browser, proxy, paid external API, database, or unrelated runtime dependency is added.
- Confirm the Issue #3 request adapter can consume the normalized input contract without requiring a breaking contract redesign.

## 8. Open Implementation Questions

No outstanding implementation questions.

The implementing agent may choose exact internal symbol/file names and test organization as long as the responsibilities and contracts above remain clear and repository conventions are preserved.

## 9. Low-Level Design Decision

**LLD required:** `No`

### Rationale

The change spans several repository concerns, but their responsibilities and dependency order are already explicit in the Issue, approved HLD, and this plan: contract types/validation, native schema metadata, a thin Actor lifecycle, and focused tests. There is no sufficiently complex file-level coupling, migration, algorithm, or compatibility problem that requires a separate LLD before implementation.

Codex can therefore proceed directly from this approved plan to development, choosing proportionate file organization while preserving the defined boundaries.

## 10. Implementation Checklist

- [ ] Add the Apify runtime dependency without unrelated production dependencies.
- [ ] Establish typed raw/normalized input and result contracts.
- [ ] Implement input validation/defaulting.
- [ ] Add native Actor configuration and input/output/dataset schema metadata.
- [ ] Replace the placeholder with the minimal Actor lifecycle.
- [ ] Replace bootstrap-only tests with contract and lifecycle-foundation coverage.
- [ ] Complete relevant integrity and schema checks.
- [ ] Confirm no Google News retrieval or other downstream scope has been implemented.
- [ ] Prepare implementation hand-off for validation.

### Approval

**Decision:** `Approve implementation`  
**Rationale:** The implementation sequence is bounded by the approved HLD, maps directly to Issue #2 acceptance criteria, and contains no unresolved material planning decision.  
**Required follow-up:** `Codex may proceed with Issue #2 development on feature/2-apify-actor-runtime-contracts.`

### Completion contract

The repository assessment, implementation approach and sequence, integrity checks, validation requirements, explicit LLD decision, open questions, and traceability are resolved. Implementation can proceed without an unresolved material planning decision.
