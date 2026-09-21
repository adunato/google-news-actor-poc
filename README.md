# Google News Actor POC

An Apify Actor proof of concept for discovering Google News results and returning structured article metadata for developer and research workflows.

## Status

Proof of concept — the development repository is established, but Actor implementation has not started.

## Getting started

### Prerequisites

- Node.js 20 or later
- npm 10 or later

An Apify account and Actor credentials are required only when the implementation is ready for hosted execution.

### Install

```text
npm ci
```

### Run locally

The Actor runtime is not implemented yet. Use the validation command to verify the repository baseline.

## Usage

The planned POC will accept Google News query expressions, locale and recency controls, and return normalized metadata through the Apify default dataset. Its implementation is intentionally deferred to the next Step 9 activity.

## Development

Run the complete repository validation suite with:

```text
npm run validate
```

Repository-specific agent instructions are in [AGENTS.md](AGENTS.md).

## Project documentation

- [Product Definition](docs/product.md) — current approved product intent, scope, capabilities and externally meaningful behaviour.
- [Architecture Definition](docs/architecture.md) — current approved technical architecture.

Change-specific HLD, Implementation Plan and LLD artifacts are stored under `docs/changes/<issue-number>/` only when the SideGig Development Lifecycle requires them.

## Deployment

The target deployment is an Apify Actor published through the Apify Store. Deployment and public paid observation remain later Step 9 activities; no deployment workflow is configured at bootstrap.
