---
name: assess-change
description: Select the proportional Development Lifecycle path for a ready GitHub Issue based on design uncertainty, architectural impact, implementation complexity and risk rather than Issue label.
---

# Assess Change

Determine the minimum change-design and planning path required for a development-ready GitHub Issue.

Inspect:

- the Issue and acceptance criteria;
- `docs/product.md`;
- `docs/architecture.md`;
- relevant source code, tests, configuration and repository patterns;
- material dependencies and integration boundaries.

Decide independently whether the change requires:

- an HLD;
- an Implementation Plan.

Do not create a separate assessment document. Record the concise decision and rationale in the Issue, an Issue comment, or the first required change artifact according to the repository workflow.

Require an HLD only when a material design decision must be resolved before implementation, such as significant product behaviour, durable architecture, interface/integration, data/state, cross-component, security, reliability, performance, cost, compatibility, or competing-design implications.

Require an Implementation Plan when repository-level sequencing, coordination, migration, validation complexity, or implementation risk warrants planning before editing. A Plan may be required without an HLD.

Do not infer required artifact depth from the `feature` or `bug` label. A small feature may need no design artifact; a difficult bug may need both HLD and Plan.

LLD remains a decision made by an approved Implementation Plan. The assessment may flag likely file-level complexity but must not bypass that decision point.

If the Issue itself is not ready, return to Issue refinement rather than compensating for missing requirements with design assumptions.

## Completion contract

Report the Issue, readiness state, HLD decision and rationale, Implementation Plan decision and rationale, likely durable Product/Architecture impact, material risks/dependencies, and the exact next lifecycle step.
