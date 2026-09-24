# Learning Record

**Learning ID:** google-news-actor-poc--issue-2--bootstrap-formatting-gate

**Origin repository:** adunato/google-news-actor-poc

**Source:** GitHub Issue #2

**Lifecycle stage / skill:** Validation / capture-learning

**Date:** 2026-09-23

**Category:** Tooling/CI

**SideGig review:** Yes

**Disposition:** Captured

## Change context

Issue #2 established the repository foundation for an Apify Actor runtime,
including input and output contracts and native Actor schemas. The repository
requires `npm run validate` as its quality gate, including a formatter check
over repository documentation, templates, configuration, and source files.
The lesson arose when validating the change against that repository-wide gate.

## Observation

Canonical bootstrap, template, and configuration artifacts covered by a
repository formatter must be generated or installed in formatter-clean form.
Otherwise an unrelated first change inherits avoidable formatting work before
it can satisfy the repository quality gate.

## Evidence

The initial Issue #2 validation run failed its formatting check on 11
pre-existing artifacts: `README.md`, `AGENTS.md`, `docs/product.md`,
`docs/architecture.md`, `docs/changes/2/hld.md`,
`docs/changes/2/implementation-plan.md`, the two GitHub issue templates,
`.github/workflows/ci.yml`, `tsconfig.json`, and `eslint.config.js`.
Formatting-only cleanup made the complete `npm run validate` contract pass;
the affected documents' semantic content did not change.

## Impact

Unformatted bootstrap artifacts create unrelated-change CI noise, consume
implementation time on cleanup, and obscure whether the new change itself is
valid. The same failure mode can recur in other repositories created from or
updated by shared boilerplate.

## Local action

Issue #2 validation applied formatting-only cleanup to the affected files. No
product, architecture, or shared SideGig standard was changed by this record.

## Cross-project relevance

The observation may generalize to the canonical bootstrap/template package and
its installation or generation checks. SideGig review should consider whether
bootstrap artifacts are formatter-clean before delivery and whether the shared
formatting contract checks the right generated and installed surfaces. This
repository does not prescribe or apply that cross-project change.

## Stable local references

- [GitHub Issue #2](https://github.com/adunato/google-news-actor-poc/issues/2)
- `package.json` (`npm run validate`)
- `docs/product.md`
- `docs/architecture.md`
- `docs/changes/2/hld.md`
- `docs/changes/2/implementation-plan.md`
- `.github/ISSUE_TEMPLATE/bug.md`
- `.github/ISSUE_TEMPLATE/feature.md`
- `.github/workflows/ci.yml`
- `tsconfig.json`
- `eslint.config.js`
