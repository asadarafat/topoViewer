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
topology.yaml + stylesheet.yaml -> beautiful interactive diagram -> embeddable in apps and docs.
```

The public category should be narrower and sharper:

```text
Topology-as-Code renderer for infrastructure diagrams.
```

The first public release target is `0.1.0`: an installable early-adopter npm
package. The later `1.0.0` target is the stable-core/API-freeze milestone.

## What Changes

Create a product-readiness plan for the repository, documentation, examples,
and public support boundaries:

- make `topoviewer` the obvious stable center of the project;
- make the README and docs homepage visual, short, and adoption-oriented;
- split public docs into learner paths, embedding paths, examples, reference,
  labs, and maintainer material;
- move internal maintainer details out of the primary public nav;
- clearly label supported, experimental, lab, and roadmap surfaces;
- define five polished examples that demonstrate the core value in the first
  few minutes;
- add a 0.1 launch plan that makes `npm install topoviewer @xyflow/react react
  react-dom` work before any adoption push;
- keep the README first screen focused on install, render this YAML, and embed
  in React or MkDocs;
- reshape the docs homepage as a conversion path, not an encyclopedia: install,
  render first topology, explore examples, embed in React or MkDocs;
- make the existing "First Topology" tutorial satisfy the first-run path with
  install context, topology YAML, stylesheet YAML, expected output, and common
  blank-viewport troubleshooting;
- align `mkdocs.yml`, docs homepage, and canonical content organization around
  one user journey, with `mkdocs.yml` as the navigation source of truth;
- demote Zensical from front-door product surface to static adapter/integration
  documentation;
- remove public guide-level `Next Steps` sections; users navigate through the
  left nav, page table of contents, search, and contextual inline links;
- demote Zensical, VS Code, Grafana, Containerlab, NetBox, and Infrahub from
  the front-page core unless their support status changes;
- define a visual demo-gallery backlog for AWS VPC, Kubernetes service map,
  BGP/CLOS fabric, microservice dependency graph, incident blast-radius view,
  and Grafana live overlay;
- define API hardening tasks for the minimal public API, compiled graph types,
  extension hooks, events, node/edge data, style declarations, and toolbar
  actions;
- decide whether Node 24 remains a repo-only tooling requirement or becomes a
  justified package runtime requirement;
- keep the README first-screen media collage-first, using the checked-in
  Playwright-captured image that shows the same YAML across MkDocs, Zensical,
  the browser harness, and Grafana;
- keep any generated video/GIF/MP4 walkthrough output local-only for review,
  not as a release gate or preferred README artifact;
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
- Promotional collage generation and local-only optional video review workflow.
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
