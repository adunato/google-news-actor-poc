# AGENTS.md

This repository follows the SideGig Development Operating Model. Use this file for repository-specific instructions that a coding agent must know before making changes.

## Authoritative context

For every software change, read:

1. the originating GitHub Issue — scope and acceptance criteria;
2. `docs/product.md` — current approved product definition;
3. `docs/architecture.md` — current approved technical architecture;
4. any change-specific artifacts under `docs/changes/<issue-number>/`;
5. the relevant source code and tests.

The GitHub Issue remains the root traceability object. Do not expand its scope silently.

## Agent package

Reusable SideGig skills are installed under:

`.codex/skills/`

Canonical project-local templates used by those skills are installed under:

`.codex/templates/`

Use the relevant skill instead of recreating lifecycle behaviour ad hoc. The installed package covers repository bootstrap, durable product/architecture definition, Issue refinement, proportional change assessment, workspace/design/planning, development, validation, CI diagnosis, integration, release preparation, staging validation and production promotion.

## Development lifecycle

Before implementation, ensure the Issue is development-ready. Use `refine-issue` when requirements or acceptance criteria need shaping, and `assess-change` to choose the minimum proportional design/planning path.

Create change-specific design artifacts only when required:

- `hld.md` for a material change-design decision;
- `implementation-plan.md` for meaningful repository-level implementation planning;
- `low-level-design.md` only when an approved implementation plan requires file-level design.

When required, store these under:

`docs/changes/<issue-number>/`

Use the canonical copies in `.codex/templates/` when creating those artifacts.

Update `docs/product.md` or `docs/architecture.md` in the same change when the implemented outcome materially changes the durable product or architecture.

## Git and integration

- Normal change branches are based on `dev`.
- Follow the repository branch naming defined by the SideGig GitHub Delivery Model.
- Do not push normal changes directly to `dev`, `staging` or `main`.
- Prepare pull requests with Issue, design and validation traceability.
- Use `ci-diagnostics` for failed automated gates rather than weakening checks.
- Do not bypass required CI or branch protection.
- Do not merge or promote your own change; those remain explicit human actions.
- Use the release skills for candidate preparation, staging validation and production promotion where applicable.

## Project commands

### Install

```text
<dependency-install command>
```

### Run locally

```text
<local-run command>
```

### Validate

```text
<canonical validation command>
```

The validation command is the repository-wide local quality contract and should match the checks used by CI.

## Project-specific constraints

- <platform, runtime, architecture or repository constraint>
- <constraint>

<Remove this section if there are no material repository-specific constraints beyond docs/product.md and docs/architecture.md.>
