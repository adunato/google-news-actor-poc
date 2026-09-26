# Implementation Plan: Deployable Apify PoC package and Store documentation

> Canonical change-specific implementation artifact for GitHub Issue #6.

**Artifact ID:** `issue-6-deployable-apify-poc-plan`<br>
**Status:** `Approved`<br>
**Owner:** `Implementation owner`<br>
**Created / updated:** `2026-09-26`<br>
**GitHub Issue:** [#6 — Prepare deployable Apify PoC package and public Store documentation](https://github.com/adunato/google-news-actor-poc/issues/6)<br>
**HLD reference:** `Not required`<br>
**Context references:** `docs/product.md — google-news-actor-poc-product; docs/architecture.md — google-news-actor-poc-architecture`

## 1. Implementation Summary

Complete the repository packaging and public user documentation needed to build and deploy the implemented Google News Actor on Apify and prepare it for later release-candidate validation. Reconcile the native Actor configuration and input/output/dataset schemas with the runtime input and result contracts; provide a reproducible deployment/build smoke path; and replace the bootstrap README with Store-facing instructions that accurately describe inputs, defaults, controls, dataset/API output, and PoC limitations.

Keep this change within the approved metadata-only Google News and Apify-native delivery boundary. Describe only the approved temporary PoC PPE configuration where relevant. Do not set or claim final production pricing, publish the Actor, configure billing in an external account, or start public paid observation as part of this repository packaging change.

## 2. HLD Reference

**Not required.** Issue #6 and the approved Product and Architecture Definitions already fix the deployment target, Actor input and output contract, default dataset/API delivery, Store/PPE boundary, and PoC limitations. This work packages and explains the implemented design; it does not introduce a new component or material architecture decision.

## 3. Repository Assessment

- The Issue #6 worktree is `feature/6-deployable-apify-poc-package-store-docs` at `.worktrees/issue-6/`, based on `dev` after fast-forwarding from `a1bb9bb` to `4008788` (which includes merged Issue #5).
- `package.json` defines a TypeScript ESM project with the Apify SDK and `npm run validate` for format, lint, typecheck, tests, and build. It does not currently define an Actor deployment/build smoke script or include an Apify CLI dependency.
- `.actor/actor.json` already references native input, output, and dataset schemas. The input schema describes query count, result limit, locale, country, date range, and deduplication; the dataset schema describes required and optional normalized metadata fields; and output points to the default dataset API URL. These existing files are the primary packaging and schema reconciliation points.
- `src/input.ts` defines defaults (`maxItemsPerQuery: 20`, `language: en-US`, `country: US`, `dateRange: 7d`, `dedupe: true`) and bounds (1–20 non-empty queries and 1–100 results per query). `src/contracts.ts` defines the normalized record, and `src/index.ts` now performs multi-query retrieval, parsing, deduplication, and default-dataset writes.
- `README.md` still describes the Actor implementation as deferred and has placeholder usage instructions. It must be replaced with public-facing instructions grounded in current runtime and schema behavior.
- The Issue requires a documented smoke path executable without undocumented machine state. The plan should use repository-declared prerequisites and setup, and identify required Apify account/authentication state separately from the local build check. Do not commit credentials.
- No new source, browser scraping, publisher-page extraction, proxies, paid external data services, persistent state, AI enrichment, or multi-source aggregation is approved.

## 4. Implementation Approach

### 4.1 Actor packaging and deployment smoke path

Review and complete the repository's Apify Actor packaging metadata so a clean checkout can be built and deployed through a documented, repeatable path. Keep commands and prerequisites in repository-owned configuration/documentation; use the existing TypeScript build and Actor metadata where sufficient, adding only the minimum packaging files or scripts needed. Keep Apify credentials in the user's managed environment and out of source control. Clearly distinguish a local build/package smoke check from an authenticated platform push or deployment.

### 4.2 Native schema and runtime contract alignment

Compare `.actor/actor.json`, `input_schema.json`, `output_schema.json`, and `dataset_schema.json` against `src/input.ts`, `src/contracts.ts`, and the approved Product Definition. Correct schema metadata or runtime-facing documentation only where needed so field names, required/optional status, defaults, bounds, allowed date ranges, and dataset delivery agree. Preserve the distinction between a Google News result URL and an optional source URL; do not imply that canonical publisher URLs or article bodies are available.

### 4.3 Public Store README

Replace the bootstrap README's deferred implementation claims with concise public usage and deployment guidance. Document prerequisites and installation/deployment steps, all input fields and defaults, supported controls and bounds, output fields and optional metadata, default dataset/API access, and explicit limitations around upstream availability, completeness, ranking, canonical URLs, and article bodies. Any PPE description must remain limited to the approved temporary PoC configuration and must not imply a production pricing decision.

### 4.4 Packaging and documentation verification

Extend existing checks only as needed to validate Actor metadata/schema consistency or the documented package smoke path. Run `npm run validate`, execute the documented local build/package smoke path from the issue worktree, and review README claims against the schemas, runtime contracts, Issue acceptance criteria, and durable definitions. Do not require a live Store publication or paid run for this implementation validation.

## 5. Implementation Sequence

1. Confirm the current Actor package layout, entrypoint/build output, native schema behavior, and available Apify deployment tooling; settle the minimum repository-declared local smoke path.
2. Complete the Apify package metadata and any required build/deployment commands or configuration, preserving the current runtime entrypoint and keeping credentials external.
3. Align native schemas with runtime defaults, constraints, and normalized dataset fields, adding focused checks for any discovered mismatch.
4. Rewrite the README with accurate Store-facing usage, input/output/API, deployment and smoke instructions, and PoC limitations.
5. Run `npm run validate` and the documented local packaging/build smoke path; review the resulting documentation and schema contract against Issue #6 and the Product/Architecture Definitions.
6. Prepare the implementation hand-off with check results, any authenticated deployment step still requiring operator credentials, and traceability to Issue #6.

The schema and README work depend on the completed Actor contract from Issues #2–#5. The local build smoke path should be established before it is documented so the instructions are executable and do not depend on undocumented machine state.

## 6. Development Integrity Checks

- Run `npm run validate` from `.worktrees/issue-6/`.
- Run the documented local build/package smoke path from a clean dependency install (`npm ci`) using repository-declared prerequisites.
- Verify native input schema defaults, bounds, and enumerations against `normalizeActorInput` and the Product Definition.
- Verify dataset required/optional fields and output link match `NewsResult`, default dataset writes, and the Product Definition.
- Verify no credentials, final pricing commitments, or out-of-scope data extraction/dependency are introduced.

## 7. Validation Requirements

### Unit Validation

- Native schema checks prove that field names, required fields, defaults, bounds, and date-range values match runtime behavior.
- Existing Actor behavior continues to validate inputs, emit the documented normalized record fields, and write through the default dataset.
- Any new packaging metadata or smoke helper has focused automated coverage only where its behavior is not adequately demonstrated by the repository build/package command.

### End-to-End Validation

- From the issue worktree, follow the README's clean-checkout prerequisites and commands to install dependencies and complete the local Actor build/package smoke path without hidden local state.
- Confirm the resulting package references the correct Actor entrypoint and native schemas.
- An authenticated Apify push/deployment can be performed when deployment credentials are available; it is not required to prove the local packaging acceptance criterion and must not publish the Store Actor as part of this Issue.

### Other Relevant Validation

- Review all public README claims against Issue #6, `docs/product.md`, `docs/architecture.md`, the native schemas, and the runtime implementation.
- Confirm limitations are explicit: Google News availability and result coverage are upstream-controlled; ranking is not deterministic; canonical publisher URLs and article bodies are not provided.
- Confirm any pricing reference describes only the approved temporary PoC configuration and does not make a production commitment.

## 8. Open Implementation Questions

No material product or architecture questions remain. During implementation, select the smallest compatible Apify packaging/build mechanism supported by the existing project layout and document any external account/authentication prerequisite separately from the local smoke path. If Apify tooling reveals a material new deployment architecture or the acceptance criteria cannot be met without new secrets or paid services, stop and report the conflict before expanding scope.

## 9. Low-Level Design Decision

**LLD required:** `No`

### Rationale

The work updates a small, identified set of existing package metadata, schemas, scripts/configuration, and README documentation. Issue #6, the approved durable definitions, and this plan provide sufficient file-level boundaries and acceptance expectations. No complex algorithm, cross-service contract, migration, or architectural coupling requires a separate LLD. Resolve the exact compatible packaging command during implementation as a local tooling choice; escalate only if evidence changes the architecture or scope.

## 10. Implementation Checklist

- [x] Establish a reproducible, repository-declared local Apify build/package smoke path.
- [x] Complete Actor packaging metadata for Apify build/deployment.
- [x] Reconcile native Actor schemas with runtime and Product Definition contracts.
- [x] Replace placeholder README content with public Store usage and deployment guidance.
- [x] Document inputs, defaults, controls, output fields, default dataset/API use, temporary PoC pricing boundary, and explicit limitations.
- [x] Run `npm run validate` and the documented local smoke path.
- [x] Prepare implementation hand-off with verification evidence and any credential-dependent operator step.

### Approval

**Decision:** `Approve implementation`<br>
**Rationale:** `The Issue is development-ready, its packaging and documentation scope is bounded by the approved Product and Architecture Definitions, and no material design question remains. The user asked to resume Issue #6.`<br>
**Required follow-up:** `Proceed with Issue #6 development on feature/6-deployable-apify-poc-package-store-docs. Keep authenticated platform deployment and Store publication separate from the local smoke validation; do not introduce a production pricing commitment.`

### Completion contract

This plan is Approved for implementation within Issue #6's acceptance criteria and the constraints recorded above. Report any packaging-tool incompatibility or scope/design conflict before changing the shared deployment contract.
