---
name: merge-change
description: Prepare a validated change for integration through the repository's GitHub Delivery Model and safely conclude workspace state.
---

# Merge Change

Use this skill only after validation is complete.

Confirm the originating GitHub Issue, change branch/worktree, target branch, intended commits, required change artifacts, durable Product/Architecture updates, validation evidence, and unrelated local changes.

Follow the GitHub Delivery Model. Normal changes are integrated through a pull request to `dev`; release fixes target the active release branch. Ensure the pull request references the Issue and summarizes the implemented outcome, relevant design/planning artifacts, validation evidence, and any durable-document updates.

Do not bypass required CI, branch protection, or explicit human merge/promotion decisions. A coding agent may prepare or update the pull request but must not claim that an unmerged pull request is integrated.

After a human-approved merge is confirmed, verify the target state and remove the obsolete change worktree/branch only when safe. Preserve uncommitted or unintegrated work.

## Completion report contract

Report the Issue reference, source branch, target branch, pull request URL/ID, CI/validation state, integration state, durable-document updates, workspace cleanup, residual conditions, and required human action. The change is complete only when integration is confirmed according to the GitHub Delivery Model.
## Learning checkpoint

Before completing this skill, consider whether execution exposed a reusable lesson about the product, Development Operating Model, a skill/template, tooling/CI, or the implementation methodology. A normal defect or one-off execution problem is not automatically a learning. When a reusable lesson exists, use `capture-learning` to record it under `docs/learnings/`; otherwise report `Learnings: None`. A learning that requires SideGig-level change must be recorded for later SideGig review rather than changing cross-project standards from the product repository.
