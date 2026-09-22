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

Reusable SideGig skills are installed under `.codex/skills/` and canonical project-local templates are installed under `.codex/templates/`. Use the relevant skill instead of recreating lifecycle behaviour ad hoc.

## Project commands

### Install

```text
npm ci
```

### Run locally

The Actor runtime is not implemented yet.

### Validate

```text
npm run validate
```

The validation command is the repository-wide local quality contract and is also invoked by CI.

## Project-specific constraints

- Preserve the Step 7 Google News metadata-search boundary: one source, lightweight HTTP/feed access, structured metadata, and Apify-native dataset/API delivery.
- Do not add canonical publisher URL resolution, full article extraction, browser scraping, residential proxies, paid external data APIs, stateful monitoring, AI enrichment, or multi-source aggregation without a new approved decision.
- Do not start implementation work without an Issue and the proportional SideGig design/planning path.

## Learning capture

Every lifecycle skill performs a lightweight learning checkpoint. Record only reusable lessons, not ordinary defects or one-off execution problems. When a learning exists, use `capture-learning` and store it under `docs/learnings/`; otherwise report `Learnings: None`.

Product-specific lessons may be resolved through normal local artifacts and changes. Lessons marked for SideGig review are evidence for a separate cross-project review; do not recreate or modify SideGig standards inside this repository.

## Git and integration

Normal change branches are based on `dev`; do not push normal changes directly to `dev`, `staging` or `main`. Prepare pull requests with Issue, design and validation traceability. Do not bypass required CI or branch protection, and do not merge or promote your own change.
