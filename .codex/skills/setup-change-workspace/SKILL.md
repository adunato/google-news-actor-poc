---
name: setup-change-workspace
description: Prepare or adopt an isolated Git workspace for one GitHub Issue while preserving repository conventions and unrelated work.
---

# Setup Change Workspace

Prepare a safe workspace for the originating GitHub Issue before change-specific design or implementation begins.

Read the repository instructions and the GitHub Delivery Model. Use the Issue type and repository branch conventions to create or adopt the correct change branch/worktree. Normal changes are based on `dev`; an approved release-fix change is based on the active release branch.

Adopt an existing suitable branch/worktree when present. Never reset, overwrite, or discard unrelated changes to force setup.

Inspect the Issue, Product Definition, Architecture Definition, `AGENTS.md`, and relevant repository state so the downstream lifecycle can determine proportionately whether HLD, implementation planning, or LLD are required. Workspace setup itself must not require those artifacts to exist.

## Completion contract

Report the Issue reference, branch, worktree, base branch, created/adopted state, conventions applied, unrelated-change safety, and any readiness blocker. The workspace is ready only when subsequent design or implementation work can proceed safely in isolation.
