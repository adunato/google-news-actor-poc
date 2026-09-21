# High-Level Design: Apify Actor runtime and contracts

> Canonical change-specific design artifact for Issue #2.

**Artifact ID:** `issue-2-apify-actor-runtime-hld`  
**Status:** `Approved`  
**Owner:** `SideGig product owner`  
**Created / updated:** `2026-09-21`  
**GitHub Issue:** `#2 — Establish Apify Actor runtime and input/output contracts`  
**Product Definition:** `docs/product.md — PR-001, PR-003, PR-004; External Interaction and Contract`  
**Architecture Definition:** `docs/architecture.md — Apify Actor entrypoint; default dataset interface; Deployment and Runtime`  
**Traceability:** `Milestone v0.1.0; Issue #2 Development Lifecycle Assessment`

## 1. Summary

Issue #2 replaces the repository-establishment placeholder with the minimum executable Apify Actor foundation needed by the remaining PoC work. The change establishes the Actor lifecycle, the approved input contract, the normalized result contract, and native Apify schema metadata, while deliberately stopping before any Google News retrieval or result production.

The design creates one authoritative runtime boundary: user input is read from the Apify Actor environment, normalized to the approved defaults, validated before downstream use, and represented by typed application contracts that later Issues can consume.

## 2. Current State

The repository is a TypeScript/ESM scaffold. `src/index.ts` currently exports only a repository-establishment marker and there is no Apify runtime dependency, Actor lifecycle, Actor configuration, input schema, output schema, dataset schema, or runtime input validation.

The existing repository-wide quality contract is `npm run validate`, covering formatting, linting, type checking, tests, and build.

## 3. Requirements

### Functional Requirements

- Run as an Apify JavaScript/TypeScript Actor rather than as a placeholder library module.
- Accept 1–20 non-empty query strings.
- Accept `maxItemsPerQuery` from 1–100, defaulting to 20.
- Support `language` default `en-US`, `country` default `US`, `dateRange` values `any`, `1h`, `6h`, `1d`, `7d`, `30d` with default `7d`, and `dedupe` default `true`.
- Reject invalid input before any downstream query execution can occur.
- Define the approved normalized result contract with required fields `query`, `title`, `sourceName`, `googleNewsUrl`, `publishedAt`, `position`, `language`, `country`, and `scrapedAt`.
- Allow optional `sourceUrl`, `descriptionText`, and `guid`.
- Expose native Apify schema metadata for the Actor input and result/output contract.

### Constraints and Important Conditions

- Google News retrieval is not implemented by this Issue.
- The Actor must not introduce browser automation, residential proxies, paid external data APIs, an external database, stateful monitoring, or other out-of-scope infrastructure.
- Apify-native schemas and runtime behaviour must describe the same contract; schema metadata must not become a second, contradictory product definition.
- Store publication, pricing configuration, final public README work, deployment automation, and release-candidate smoke validation remain downstream work, principally Issue #6.
- The existing `npm run validate` command remains the repository-wide local and CI quality contract.

## 4. Expected Outcome

### Before

The project compiles and tests only as a bootstrap TypeScript repository and cannot be executed meaningfully as an Apify Actor.

### After

The project has a minimal Actor lifecycle and an explicit, validated PoC contract. A valid input can be read, normalized, and accepted by the Actor foundation; invalid input is rejected with an actionable failure. Native Apify schemas describe the supported input and normalized result shape. The Actor intentionally performs no Google News request and writes no news records yet.

## 5. Proposed Design

The change introduces four responsibilities without adding the later search capability.

### Actor lifecycle boundary

The application entrypoint initializes the Apify Actor runtime, obtains the run input, delegates normalization/validation to the input-contract boundary, and exits cleanly when the foundation step is complete. Actor lifecycle concerns stay at the entrypoint rather than leaking into later request or parsing components.

### Input contract and normalization

The application maintains a typed internal input model representing the fully normalized configuration consumed by later Issues. Optional user fields are resolved to the approved defaults before downstream use. Validation enforces query count, non-empty query content, result bounds, supported date-range values, and valid primitive types.

Apify's native input schema represents the same public contract so Console/API users receive platform-native validation and generated configuration UI. Runtime validation remains present as a defensive application boundary and for deterministic local/unit testing.

### Result contract and Apify schema metadata

A typed result model represents the approved required and optional fields even though Issue #2 produces no results. Native dataset/output schema metadata describes that model for Apify consumers and establishes the contract that the parser and dataset-delivery Issues must later satisfy.

The Actor definition explicitly references its schema artifacts rather than relying on implicit legacy discovery behaviour.

### Scope boundary

No request adapter, feed parser, deduplication logic, dataset writes, Store monetization configuration, or Google News-specific runtime behaviour is introduced. Those remain traceable to Issues #3–#6.

### High-Level Flow

1. Apify starts the Actor and provides run input.
2. The entrypoint reads the input and passes it to the input-contract boundary.
3. The input boundary validates the supplied values and applies approved defaults.
4. Invalid input causes a clear run failure; valid input yields a normalized configuration.
5. Because retrieval is outside Issue #2, the foundation run completes without Google News requests or news-result dataset writes.
6. Later Issues consume the normalized input and result contracts without changing their approved external semantics.

## 6. Backend Changes

The repository gains the Apify JavaScript SDK as a runtime dependency and replaces the placeholder entrypoint with a minimal Actor lifecycle.

Application-level contract logic is separated from lifecycle orchestration so it can be unit-tested without starting an Actor run. Native Actor configuration and schema metadata are added under the conventional Actor configuration area and are explicitly referenced by the Actor definition.

There is no source integration, persistence logic beyond the native Actor environment, or business processing in this Issue.

## 7. UI and User Experience Changes

There is no custom UI. The Apify Console/API becomes the user-facing execution surface for this foundation. Native input schema metadata exposes field descriptions, allowed values, and defaults through Apify's generated Actor input experience.

Public Store documentation and final merchandising are not part of this Issue.

## 8. Data and State

Two logical data contracts are established:

- **Normalized Actor input:** queries plus the resolved `maxItemsPerQuery`, `language`, `country`, `dateRange`, and `dedupe` values.
- **Normalized news result:** the approved required and optional metadata fields defined by the Product Definition.

No application database or durable custom state is introduced. Issue #2 does not persist news-result records.

## 9. Interfaces and Integrations

- **Apify Actor runtime:** provides lifecycle and input access.
- **Apify input schema:** describes and platform-validates the external Actor input contract.
- **Apify Actor output/dataset schema metadata:** describes the result surface that later Issues will populate.
- **Internal typed contracts:** provide stable hand-off boundaries for request, parsing, orchestration, and dataset-delivery work.

There is intentionally no Google News interface in this change.

## 10. Error and Edge-Case Behaviour

The Actor foundation fails before downstream processing when:

- input is missing or not an object;
- `queries` is absent, contains fewer than 1 or more than 20 items, contains non-string values, or contains empty/whitespace-only strings;
- `maxItemsPerQuery` is outside 1–100 or is not an integer;
- `dateRange` is not one of the approved values;
- supplied locale/control fields have invalid primitive types.

Defaults apply only when optional values are absent; they must not silently repair explicitly invalid values. Error messages should identify the invalid field or bound without exposing secrets or internal stack details as the primary user message.

## 11. Validation Considerations

Validation must demonstrate:

- successful normalization of minimum valid input;
- all approved defaults;
- acceptance of boundary values for query count and result limit;
- rejection immediately outside those boundaries;
- rejection of empty/whitespace queries and unsupported `dateRange` values;
- agreement between the public schema defaults/enumerations and runtime contract;
- successful TypeScript build and repository-wide `npm run validate`;
- a minimal Actor smoke execution with valid input that performs no Google News request.

## 12. Open Questions

No outstanding design questions.

## 13. Design Summary

- Establish a minimal Apify Actor lifecycle without prematurely implementing Google News retrieval.
- Make native Apify schemas and typed runtime contracts express one approved input/result contract.
- Validate and normalize input at the application boundary so later Issues consume safe, fully resolved configuration.
- Preserve the approved lightweight, no-browser/no-paid-dependency PoC boundary.

### Approval

**Decision:** `Approve`  
**Rationale:** The project owner explicitly instructed creation of the HLD and downstream Implementation Plan for Issue #2, and the design introduces no unresolved product or architecture decision beyond the already approved PoC boundary.  
**Required follow-up before implementation planning/development:** `Create the Issue #2 Implementation Plan.`

### Completion contract

The material requirements, proposed design, validation considerations, durable Product/Architecture impacts, and open questions are resolved. This HLD is ready to constrain downstream implementation.
