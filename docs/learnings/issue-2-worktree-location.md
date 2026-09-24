# Learning Record

**Learning ID:** google-news-actor-poc--issue-2--worktree-location

**Origin repository:** adunato/google-news-actor-poc

**Source:** GitHub Issue #2

**Lifecycle stage / skill:** Workspace setup / capture-learning

**Date:** 2026-09-23

**Category:** Methodology

**SideGig review:** Yes

**Disposition:** Captured

## Change context

Issue #2 required an isolated feature workspace based on the repository's
normal development base so implementation and validation could proceed without
disturbing other work. The workspace setup guidance addressed branch and base
safety but did not specify where the worktree should live on the filesystem.
The lesson arose when adopting the clean Issue #2 workspace under the project
root.

## Observation

Change-workspace guidance should state an explicit repository-relative worktree
location policy. A location such as `.worktrees/<issue-slug>` makes the active
workspace discoverable and keeps its lifecycle visibly scoped to the repository.

## Evidence

Issue #2 initially used a sibling worktree outside the repository root. The
clean feature workspace was subsequently relocated and adopted at the
repository-relative path `.worktrees/issue-2`. This exposed that the existing
workspace guidance covered isolation and branch safety but left filesystem
placement ambiguous.

## Impact

Ambiguous worktree placement makes related workspaces harder to discover,
complicates repository-scoped access and cleanup, and can create inconsistent
operator expectations across projects. The concern is about the workspace
convention, not the Issue #2 runtime implementation.

## Local action

The Issue #2 workspace now adopts `.worktrees/issue-2`. No shared workspace
standard was changed by this record.

## Cross-project relevance

The observation may generalize to the `setup-change-workspace` skill and
repository bootstrap conventions. SideGig review should consider documenting
an explicit local worktree-location policy and its cleanup/access expectations.
This record does not prescribe a cross-project standard or apply one here.

## Stable local references

- [GitHub Issue #2](https://github.com/adunato/google-news-actor-poc/issues/2)
- `AGENTS.md`
- `.codex/skills/setup-change-workspace/SKILL.md`
- `.worktrees/issue-2`
