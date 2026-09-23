# Learning Record

**Source:** GitHub Issue #2

**Lifecycle stage / skill:** Workspace setup / capture-learning

**Date:** 2026-09-23

**Category:** Methodology

**SideGig review:** Yes

**Disposition:** Captured

## Observation

The change-workspace convention should explicitly define a repository-local worktree location, such as `.worktrees/<issue-slug>`, instead of leaving the location ambiguous or creating a sibling directory outside the project root.

## Evidence

Issue #2's feature worktree was initially created at `C:\Users\danie\projects\google-news-actor-poc-issue-2`. The user requested that it be located under the main project at `C:\Users\danie\projects\google-news-actor-poc\.worktrees\issue-2`; the clean feature branch was subsequently adopted at that exact project-local path.

## Impact

An unspecified worktree location can make related workspaces harder to discover, complicate repository-scoped access and cleanup, and create an avoidable mismatch between the project root and its active change workspace.

## Local action

The Issue #2 worktree was relocated/adopted at `.worktrees/issue-2`. This record does not modify shared workspace standards.

## SideGig review note

The `setup-change-workspace` guidance and related repository bootstrap conventions may need an explicit, cross-project repository-local worktree location.
