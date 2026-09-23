# Learning Record

**Source:** GitHub Issue #2

**Lifecycle stage / skill:** Validation / capture-learning

**Date:** 2026-09-23

**Category:** Tooling/CI

**SideGig review:** Yes

**Disposition:** Captured

## Observation

Repository boilerplate and template files that are covered by the mandatory formatter must be formatter-clean when the repository is bootstrapped. Otherwise an otherwise unrelated change can fail the repository-wide quality gate.

## Evidence

Issue #2 implementation checks initially failed the repository `npm run validate` formatting check on 11 pre-existing files, including `README.md`, `AGENTS.md`, product and architecture documents, Issue #2 change artifacts, GitHub templates, workflow/configuration files, and `tsconfig.json`. Applying formatting-only changes made the complete validation contract pass without changing the affected documents' meaning.

## Impact

New changes incur unrelated cleanup work and produce avoidable validation noise when canonical boilerplate is not aligned with the repository formatter from the outset.

## Local action

Formatting-only cleanup was applied during Issue #2 validation. No additional product or shared-standard change is made by this record.

## SideGig review note

The canonical bootstrap/template package and its formatting validation expectations may need review so generated or installed repository boilerplate is formatter-clean before the first change.
