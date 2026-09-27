# Implementation Plan: Bounded Google News Request Adapter

**Artifact ID:** `issue-3-google-news-request-adapter-plan`  
**Status:** `Approved`  
**Owner:** `Development team (plan author: Codex)`  
**Created / updated:** `2026-09-26`  
**GitHub Issue:** [#3 — Implement bounded Google News request adapter](https://github.com/adunato/google-news-actor-poc/issues/3)  
**HLD reference:** `docs/changes/3/high-level-design.md` — `issue-3-google-news-request-adapter-hld`  
**Context references:** `docs/product.md` — PR-002, PR-006; `docs/architecture.md` — Query/request adapter, Google News integration, Reliability, Architecture Principles and Constraints

## 1. Implementation Summary

Add a small request-adapter module for one already-validated query and its language, country, and date range. It will construct the Google News RSS search URL, issue direct bounded HTTP requests, and return raw response text plus status, content type, and a safe source identifier. It will return typed terminal errors for HTTP, network, timeout, cancellation, and response-size failures. The existing Actor entrypoint remains outside this Issue's implementation surface; later orchestration can consume the adapter contract.

Implementation limits selected from the HLD's planning decisions are: at most 3 attempts, 10 seconds per attempt, 25 seconds overall per adapter call, a 2 MiB streamed response-body cap, and 250 ms / 500 ms backoff between attempts. A parseable `Retry-After` delay for 429/503 is honored up to 1 second and the remaining overall deadline. The overall deadline takes precedence over all timers and waits. Retries cover transient network errors, timeouts, HTTP 408, 429, and 5xx only. Other 4xx responses, cancellation, and oversize bodies fail without retry.

## 2. HLD Reference

The approved HLD establishes the adapter boundary, URL parameter semantics, raw-response output, privacy-safe diagnostics, and retryable failure classes. Preserve its `q`, `hl`, `gl`, and `ceid` mapping; append `when:<range>` for bounded date ranges and omit it for `any`. Use URL APIs and encode the user's query only as parameter data. Do not parse XML, normalize records, orchestrate multiple queries, deduplicate, or write dataset records in this Issue.

The numeric limits above make the HLD's deferred operational decisions concrete. The `ceid` and `when:` mappings remain observed Google News behaviour, not a stable upstream guarantee.

## 3. Repository Assessment

The current Actor package has no request adapter or runtime deadline to reconcile with these limits. `src/index.ts` only normalizes and logs input, and `.actor/actor.json` supplies package/runtime configuration; the entrypoint can remain untouched until orchestration work. The repository quality contract is `npm run validate`. Keep adapter behavior independently testable by injecting the HTTP fetch/transport and any timing seam needed for deterministic retry/deadline tests.

## 4. Implementation Approach

### 4.1 Adapter contract and URL construction

Define the adapter input, success response, options, and typed error contract in a focused source module. Build the URL with `URL` and `URLSearchParams`; map `hl`, `gl`, `ceid`, and the supported `dateRange` values exactly as the HLD specifies. Reject an unsupported date range defensively if it reaches this already-validated boundary. Do not introduce new language or country allowlists.

### 4.2 Bounded HTTP exchange

Use a direct GET with cancellation-aware per-attempt timeout and one overall deadline. Stream and count response bytes so the 2 MiB maximum is enforced before accepting the complete body. Classify retryable status/network/timeout failures, apply at most two bounded waits, and constrain `Retry-After` to 1 second and the remaining deadline. Never retry caller cancellation, oversize bodies, or other 4xx statuses. Return successful bodies unchanged with status and content type, including empty bodies or unexpected content types, for Issue #4 to interpret.

### 4.3 Safe diagnostics and deterministic validation

Keep query text, full request URL, and response body out of routine logs and terminal error fields. Include only stable error category, optional HTTP status, attempts used, safe source identifier, and elapsed time where available. Exercise all upstream-dependent behaviour with an injected fake transport and controlled timing; a live-feed request is optional supplemental evidence.

### 4.4 Durable context and learning checkpoint

Do not update durable product or architecture definitions for this scoped adapter implementation. At completion, check for a reusable lesson; capture one only if supported by evidence and otherwise report `Learnings: None`.

## 5. Implementation Sequence

1. Define the adapter's input/output/error types and a focused transport/timing seam; keep the contract aligned with the HLD and Issue #4 raw-response handoff.
2. Implement URL construction and locale/date-range mapping, including safe encoding and the unsupported-range defensive failure.
3. Implement streamed body limiting, per-attempt timeout, overall deadline, cancellation propagation, retry classification, bounded delays, and safe error construction.
4. Add deterministic focused tests for mapping, raw success output, all retry/terminal categories, attempts/deadline/size bounds, cancellation, `Retry-After`, and diagnostic privacy.
5. Run `npm run validate`, resolve in-scope failures, review the final diff against Issue #3/HLD boundaries, and prepare the implementation hand-off for validation.

The transport and timing seams should be designed before retry implementation because they enable reliable tests for every bound without live upstream dependence. Actor orchestration and parser integration are downstream responsibilities and are not dependencies for this adapter.

## 6. Development Integrity Checks

- Run `npm run validate`, the repository-wide local quality contract used by CI.
- Run focused adapter tests during development for the URL, HTTP, timing, retry, size, cancellation, and privacy behaviours in §7.
- Review that the adapter uses only direct HTTP/feed access and that logs/errors do not expose query text, full URL, or response body.

## 7. Validation Requirements

### Unit Validation

- `any` omits `when:`; each of `1h`, `6h`, `1d`, `7d`, and `30d` adds its matching operator.
- `hl`, `gl`, and `ceid` map representative locales correctly, including `en-US`/`US` and a locale with a different primary language.
- Spaces, reserved characters, and Unicode remain safely encoded as query parameter data and cannot add or replace parameters.
- Successful HTTP responses preserve raw body, status, content type, and safe source identity without parsing, including empty or unexpected-content-type responses.
- Network errors, attempt timeouts, HTTP 408, 429, and 5xx retry only within the three-attempt and 25-second overall limits; per-attempt work is bounded by 10 seconds and backoff by the configured delays.
- Valid `Retry-After` on 429/503 is capped at 1 second and the remaining deadline; invalid values use bounded backoff.
- Other 4xx responses, caller cancellation, and bodies over 2 MiB fail observably without retry. The size limit is enforced while streaming.
- Terminal errors expose category, optional status, attempts, and safe source identity without query text, full URL, or response body.

### End-to-End Validation

Not applicable to this Issue: the current Actor entrypoint does not orchestrate adapter requests. Verify the module contract with deterministic transport-level tests; integration into a run belongs to the orchestration Issue.

### Other Relevant Validation

No live upstream call is required for correctness. If used as a smoke check, record it as supplemental evidence because Google News feed semantics are undocumented and may change.

## 8. Open Implementation Questions

No outstanding implementation questions. The numeric bounds and retry categories are selected above; type, cancellation, streaming, scheduling, and test-seam details are assigned to the LLD.

## 9. Low-Level Design Decision

**LLD required:** `Yes`

### Rationale

The adapter crosses several coupled file-level concerns that the Issue, HLD, and plan do not specify safely enough for direct coding: the exact typed contract, transport injection, cancellation and timer ownership, streamed byte counting, deadline-aware retry scheduling, and deterministic test seams. The LLD should map these responsibilities to concrete files and types while preserving the limits and behaviour selected here. It must not reopen the agreed request semantics or expand the adapter into parsing or orchestration.

## 10. Implementation Checklist

- [ ] Create the LLD for the adapter contract, module boundaries, timeout/cancellation/deadline mechanics, streamed size enforcement, and test seams.
- [ ] Implement safe request URL construction and supported locale/date-range mappings.
- [ ] Implement bounded direct HTTP, structured failures, and privacy-safe diagnostics.
- [ ] Add deterministic focused tests covering the validation requirements.
- [ ] Complete `npm run validate` and review the Issue/HLD boundary.
- [ ] Record the learning checkpoint and prepare implementation hand-off for validation.

### Approval

**Decision:** `Approve implementation`  
**Rationale:** The approved HLD is complete, operational limits are selected, implementation areas and sequence are resolved, and the required LLD scope is explicit. This records plan readiness only; it does not claim separate project-owner sign-off.  
**Required follow-up:** `Create and approve the LLD before implementation, as required by the lifecycle.`

### Completion contract

The plan is ready for its required LLD follow-up. The LLD is a lifecycle prerequisite to implementation because this plan explicitly selects `LLD required: Yes`.
