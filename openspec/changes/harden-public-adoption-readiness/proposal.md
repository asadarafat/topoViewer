## Why

TopoViewer has strong technical substance, but the public repository still reads
like an ambitious engineering workspace instead of a crisp open-source product.
That is a blocker for serious external adoption.

The target audience includes high-bar infrastructure, network, platform, and
observability engineers who will decide quickly whether the project is stable,
focused, embeddable, and worth depending on. They should not need to understand
OpenSpec history, experimental labs, generated projections, or every future
integration before they can render a useful topology.

The public promise should be simple:

```text
YAML topology -> beautiful interactive diagram -> embeddable anywhere.
```

## What Changes

Create a product-readiness plan for the repository, documentation, examples,
and public support boundaries:

- make `topoviewer` the obvious stable center of the project;
- make the README and docs homepage visual, short, and adoption-oriented;
- split public docs into a React Flow-style structure: Learn,
  API Reference, Examples, Showcase, Labs, Changelog, and Maintainer material;
- move internal maintainer details out of the primary public nav;
- clearly label supported, experimental, lab, and roadmap surfaces;
- define five polished examples that demonstrate the core value in the first
  few minutes;
- add a Playwright-recorded promotional walkthrough video for README and docs
  that shows YAML turning into a rendered topology across MkDocs, Zensical, the
  browser harness, and Grafana;
- document the difference from Mermaid.js and from directly using React Flow;
- define a public stability contract for YAML schemas, TypeScript APIs, and
  generated examples;
- make TopoViewer object attributes fully discoverable with per-object,
  per-attribute reference docs and small examples;
- make `*.mapper.tv.yaml` a first-class browser harness authoring surface,
  because Grafana adoption depends on users creating correct mapper YAML
  without reading source;
- define enterprise adoption trust gates: governance files, ownership signals,
  SemVer, compatibility matrix, security reporting, support boundaries,
  accessibility posture, performance envelope, API ownership, and threat model;
- define a manual npm publishing workflow for the public `topoviewer` package
  so users can install from npm only after deliberate maintainer release gates;
- integrate the brutal cross-surface adoption audit into this change, including
  docs ergonomics, integration workflows, lab security posture, dependency
  triage, release artifacts, mounted bundle abuse cases, and hostile input
  testing;
- require automated security monitoring, including Dependabot or equivalent
  update automation, static analysis, secret scanning, and container image
  scanning;
- add quality gates that protect docs structure, public links, package metadata,
  examples, cross-surface rendering, security posture, and artifact integrity.

## Capabilities

### New Capabilities

- `public-adoption-readiness`: repo and docs information architecture,
  first-run workflow, example strategy, support-status taxonomy, and quality
  gates for broad external adoption.

## Impact

- Public README.
- MkDocs and Zensical information architecture.
- Promotional media generation and GitHub-hosted asset workflow.
- Canonical content under `packages/topoviewer/content/**`.
- Generated docs/examples projections.
- Package README files where public support status is visible.
- npm package metadata, release docs, and manual publish workflow definition.
- Governance, security, support, compatibility, accessibility, performance,
  and threat-model documentation.
- Browser harness mapper authoring UX, schema assist, and examples for
  Grafana-bound `*.mapper.tv.yaml`.
- Docs lint, hostile-input tests, artifact autopsy, dependency triage, and CI
  checks.
- No renderer behavior changes are required by this plan.

## Non-Goals

- Rewriting core renderer behavior.
- Claiming experimental integrations are supported.
- Hiding roadmap work from the repo.
- Optimizing for marketing copy over accurate technical claims.
- Adding new product surfaces before the stable core path is clearer.
- Publishing npm packages automatically on every push.
- Treating lab credentials, anonymous Admin, or unsigned Grafana plugin loading
  as production guidance.
- Pretending enterprise adoption can be achieved without a maintenance,
  security, compatibility, and support story.
