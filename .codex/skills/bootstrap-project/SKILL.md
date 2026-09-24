---
name: bootstrap-project
description: Establish a new SideGig product repository from the canonical operating model, templates and project context without inventing product scope.
---

# Bootstrap Project

Establish the initial repository baseline defined by Chapter 1 of the SideGig Development Operating Model.

Use the approved upstream product/POC context and the canonical project-local templates under `.codex/templates/`. Bootstrap is repository setup, not a product change: do not create an artificial implementation Issue or pull request solely to initialize the repository.

Create or populate, as applicable:

- `README.md` from `.codex/templates/README-template.md`;
- `AGENTS.md` from `.codex/templates/AGENTS-template.md`;
- `docs/product.md` from `.codex/templates/product-definition.md`;
- `docs/architecture.md` from `.codex/templates/architecture-definition.md`;
- `.github/ISSUE_TEMPLATE/feature.md` and `bug.md`;
- `.github/workflows/sidegig-learning-dispatch.yml` from `.codex/templates/learning-collection-dispatch.yml`;
- the project source/test/configuration baseline;
- the canonical local validation command and required language/tool configuration;
- the project-appropriate CI validation workflow and any deployment workflow already required by the known architecture.

The learning-dispatch workflow is standard SideGig repository infrastructure. It runs when a pull request is merged to `dev` and immediately dispatches the central SideGig learning collector. Configure repository secret `SIDEGIG_COLLECTOR_DISPATCH_TOKEN` with a fine-grained credential restricted to the SideGig repository and `Actions: write`. If the agent cannot configure that secret, report it as an explicit bootstrap action; do not silently omit the workflow.

Preserve the operating-model branch model: create `dev`, `staging`, and `main` from the same bootstrap baseline, set `dev` as the default branch, and apply the required repository controls after the branches and CI checks exist.

Do not invent unresolved product or architecture decisions merely to finish bootstrap. Durable documents may remain `Draft` where the operating model permits it, with unresolved decisions made explicit.

Do not bypass GitHub permissions or silently weaken branch protection, CI, or secret handling because an automated setup step is inconvenient.

## Completion contract

Report the repository, baseline commit, permanent branches/default branch, durable-document status, installed Issue templates, validation command, installed CI/deployment workflows, learning-dispatch workflow and credential status, lifecycle package version, repository controls applied, unresolved bootstrap blockers, and any explicit human action still required. Bootstrap is complete only when the repository can enter the normal Issue-centred Development Lifecycle safely.

## Learning checkpoint

Before completing this skill, consider whether execution exposed a reusable lesson about the product, Development Operating Model, a skill/template, tooling/CI, or the implementation methodology. A normal defect or one-off execution problem is not automatically a learning. When a reusable lesson exists, use `capture-learning` to record it under `docs/learnings/`; otherwise report `Learnings: None`. A learning that requires SideGig-level change must be recorded for later SideGig review rather than changing cross-project standards from the product repository.
