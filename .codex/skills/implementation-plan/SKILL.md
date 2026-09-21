---
name: implementation-plan
description: Produce a practical change-specific implementation plan when the Development Lifecycle requires one, with an explicit LLD decision.
---

# Implementation Plan

Use the canonical `.codex/templates/implementation-plan.md` template when the Development Lifecycle requires an implementation plan.

Start from the GitHub Issue, repository inspection, and the approved HLD when one was required. An implementation plan may also be created without an HLD when the change needs repository-level sequencing or coordination but no material design decision; record `HLD reference: Not required` and explain why.

Define the practical implementation areas, sequencing, dependencies, integrity checks, validation requirements, and repository-specific constraints. Keep the plan proportional and avoid turning it into a line-by-line patch description.

The plan must explicitly state `LLD required: Yes | No`. Require an LLD only when file-level design, cross-file coupling, or repository-specific implementation risk cannot be represented clearly enough in the Issue, HLD (if present), and plan.

The skill prepares the plan and identifies unresolved implementation decisions; it must not infer project-owner approval where explicit approval is required.

## Completion contract

Report the plan path/ID, originating Issue, HLD reference or omission rationale, repository findings, implementation sequence, integrity/validation scope, explicit LLD decision and rationale, open questions, and approval state. Do not begin implementation while a material planning decision or required approval remains unresolved.
