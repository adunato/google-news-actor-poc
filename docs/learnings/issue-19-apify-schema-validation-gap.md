# Learning Record

**Learning ID:** google-news-actor-poc--issue-19--apify-schema-validation-gap

**Origin repository:** adunato/google-news-actor-poc

**Source:** GitHub Issue #19

**Lifecycle stage / skill:** Staging validation / capture-learning

**Date:** 2026-09-27

**Category:** Tooling/CI

**SideGig review:** Yes

**Disposition:** Captured

## Change context

The first Apify staging deployment of release `v0.1.0` failed before container build because Apify rejected the Actor input schema.

## Observation

Repository validation verified that Actor schema files existed, were valid JSON, and matched runtime defaults/bounds, but it did not validate them against Apify's platform-specific input-schema rules. As a result, missing required UI `editor` metadata passed local tests and CI but failed only during `apify push`.

## Evidence

Apify build `HoxblSRcwDj4ckDeA` for Actor `8mgE102SscNZa0U6f` failed with:

`Input schema is not valid (Field schema.properties.language.editor is required)`

Issue #19 adds the missing editor metadata and extends repository tests to assert the expected editor mapping.

## Impact

Platform-schema incompatibilities can escape repository CI and block release only after authenticated deployment, making the staging gate later and noisier than necessary.

## Local action

Issue #19 adds valid editors to all affected primitive fields and adds regression assertions for the repository's current input schema.

## Cross-project relevance

SideGig review should consider whether Apify product repositories should include the platform's own schema validation command (for example `apify validate-schema`) in release/package validation when the CLI is available, or otherwise provide an equivalent canonical validation step. This repository does not prescribe the shared change.

## Stable local references

- [GitHub Issue #19](https://github.com/adunato/google-news-actor-poc/issues/19)
- [Release-fix PR #20](https://github.com/adunato/google-news-actor-poc/pull/20)
- `.actor/input_schema.json`
- `src/schema.test.ts`
- Apify build `HoxblSRcwDj4ckDeA`
