---
name: architecture-definition
description: Create or reconcile the durable current-state Architecture Definition from the approved Product Definition and implemented technical reality.
---

# Architecture Definition

Create or update `docs/architecture.md` using `.codex/templates/architecture-definition.md`.

Use the current approved Product Definition, relevant approved change design, repository implementation, deployment/runtime configuration, and material integration constraints.

Describe only durable architecture: system boundary, major components and responsibilities, principal flows, material interfaces/integrations, data/state ownership and movement, deployment/runtime shape, cross-cutting concerns, and durable technical principles or constraints.

Do not turn the artifact into a file/class inventory, change HLD, implementation plan, historical decision log, or aspirational architecture that does not match the approved product and intended implementation.

For an existing product, reconcile the document to the current approved architecture. When invoked from an individual Issue, update only the durable architectural characteristics intentionally changed by that Issue.

The skill prepares the artifact and identifies unresolved architecture decisions. It must not infer owner approval. Set or retain `Approved` only when the project owner has explicitly approved the architecture and no material unresolved decision blocks safe change design or implementation.

## Completion contract

Report the Architecture Definition path/status, Product Definition and change context used, durable architecture sections created or changed, implementation/configuration evidence inspected, unresolved architecture questions, originating Issue when applicable, and any explicit approval still required.
