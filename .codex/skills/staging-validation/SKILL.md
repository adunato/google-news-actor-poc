---
name: staging-validation
description: Validate a deployed release candidate in staging or the closest available pre-production environment and produce explicit promotion evidence without patching the environment ad hoc.
---

# Staging Validation

Validate the deployed release candidate after promotion to the staging/pre-production environment.

Use the exact release candidate identity, Architecture Definition, relevant release/change context, repository workflows, platform runtime evidence, and Chapter 7 staging-validation expectations.

Select only the staging checks that are material to the product and release. These may include:

- deployment smoke tests;
- critical end-to-end execution paths;
- external integrations;
- environment/runtime configuration;
- persistence/data flow;
- authentication/permissions/secrets integration;
- logging and operational visibility;
- platform-specific execution behaviour;
- charging, billing, metering, or commercial mechanics.

Automate where reliable and proportionate. Record required manual evidence explicitly where automation would add disproportionate complexity.

Do not patch application code directly in staging. If a software or version-controlled configuration correction is required, create or identify a Bug Issue and route it through the release-fix lifecycle from the active release branch.

Use the CI Diagnostics skill when a failed automated staging/deployment check needs diagnosis.

A candidate is promotion-ready only when every required staging check is passed or explicitly not applicable and no known release blocker remains.

## Completion contract

Report the release candidate/version, deployed staging identity, checks executed, automated/manual evidence, failures and their classification, Bug Issues created or referenced, retest results, remaining blockers, and the explicit staging validation result: `Pass` or `Hold`.
