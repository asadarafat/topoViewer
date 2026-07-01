## Overview

This change is about public adoption readiness. It should make TopoViewer feel
like a focused, dependable open-source product without losing the durable
engineering plans and experimental work that exist in the repo.

The design principle is separation:

- public first-run path;
- public guides;
- public reference;
- curated examples;
- experimental labs;
- maintainer/project internals.

The stable core must be visible before the roadmap.

## Release Target

The first public package target for this change is `0.1.0`: an installable
early-adopter release. That is the right SemVer signal because TopoViewer is
ready to be tried from npm, but the package API, docs story, harness, Grafana
mapper, and integration boundaries are still evolving.

The release decision is:

- use `0.1.0` for the first public npm release after package dry-run, public
  install check, changelog, release notes, and maintainer approval pass;
- frame `0.1.0` as early-adopter/pre-1.0 software, with migration notes for
  breaking changes rather than a full API-freeze promise;
- prefer the npm `next` dist-tag for the first release unless maintainers
  deliberately choose `latest` with clear pre-1.0 wording;
- reserve `1.0.0` for the later stable-core release after real public feedback,
  API ownership review, compatibility fixtures, and SemVer boundary hardening;
- keep Grafana, VS Code, Zensical adapter internals, labs, and roadmap
  integrations as Experimental, Supported Adapter, Lab, or Roadmap surfaces
  without blocking either the `0.1.0` early-adopter package or future `1.0.0`
  stable-core package.

This is the practical SemVer interpretation for this repository: `0.1.0` means
"installable and useful for early adopters"; `1.0.0` means the stable core is
supportable under normal SemVer expectations.

## Brutal Audit Contract

`audit.md` is the canonical cross-surface adoption audit for this change. It
intentionally covers more than docs polish:

- first-run ergonomics;
- integration-surface status and workflow gaps;
- npm and Grafana artifact readiness;
- checked-in lab defaults that can be misused;
- dependency and release risk;
- SVG/YAML/HTML/mapper attack surfaces;
- backend mounted-bundle abuse cases;
- uncommon hardening methods that go beyond ordinary lint and tests.

Grafana-specific roadmaps and phase specs may reference this audit, but they
should not fork it into a separate copy. Public adoption readiness is a
repo-wide gate, not a Grafana-only concern.

## Public Information Architecture

Recommended public docs structure:

```text
Home
Start
  Why TopoViewer
  First Topology
  Style Your First Topology
Author
  Authoring Model
  Layout
  Attention YAML
  Validate YAML
  Debug Rendering
Embed
  React
  MkDocs
  Static HTML / Zensical Adapter
Examples
  Examples Gallery
  YAML to Network Diagram
  Real Network Demo
  Object Family Examples
  Generated Reference Catalog
Reference
  Topology Model
  Object Attributes
  Stylesheet Reference
  YAML Schemas
  TypeScript API
  Compatibility
  Glossary
Tools
  Browser Harness
Labs
  Grafana
Evaluate
  Build Or Adopt
  Architecture
  Performance, Reliability, Accessibility
  Threat Model
  Integration Roadmap
Maintainers
  Monorepo
  Production Hardening
  Design Review Checklist
  Release
  Documentation Standard
  Decision Log
```

The Grafana lab may include synthetic telemetry and Containerlab-backed
telemetry modes, but Containerlab should not appear as a separate top-level
public lab. Maintainer and lab material can stay public, but it should not sit
beside the first topology path as if it is equally important to new users.

The docs homepage should follow the same story as the nav:

1. install;
2. render the first topology;
3. explore curated examples;
4. embed in React or MkDocs.

Only after that should it route users to telemetry, architecture, threat model,
release, and maintainer material.

The existing "Choose A Path" task router can remain, because it is useful. It
must, however, become a secondary router that reinforces the same user journey
instead of competing with it. Keep its intent-based routing, but order and group
the choices so first-time users see the shortest path to value before advanced
operation, evaluation, roadmap, or maintainer paths.

Zensical should remain documented as a static-site adapter, but it should not
be a front-door product surface. Browser Harness belongs under Tools. Build Or
Adopt belongs under Evaluate. The first tutorial stays named First Topology so
the nav label, page title, and `topoviewer/start/first-topology.md` path are
literal and predictable.

The canonical content tree must mirror the public IA. `mkdocs.yml` is the
navigation source of truth, and normal public pages follow this rule:

```text
<Nav Section> > <Page Label> -> topoviewer/<section-slug>/<page-slug>.md
```

For example, `Start > First Topology` maps to
`topoviewer/start/first-topology.md` and the canonical source at
`packages/topoviewer/content/pages/start/first-topology.md`. Generated catalog
pages may keep their generated `reference/*/index.md` locations, but they must
stay grouped below a catalog node instead of becoming top-level examples.

If implementation chooses a simpler top-level `Use` section instead of separate
`Author` and `Embed` sections, the same separation rules still apply: Start is
beginner-only, Use contains normal user workflows, Reference contains complete
API/schema material, Integrations/Labs are clearly labeled, and Maintainers
contains architecture/release/docs-standard material.

## Public Navigation Contract

Public docs must not end with `Next Steps` sections. The left nav, page table
of contents, search, and contextual inline links are the intended wayfinding
system. This keeps pages focused on their own task and avoids stale link dumps
at the end of guides.

## README Contract

The README should optimize for the first screen and first result:

- one-sentence product identity;
- one public visual collage proving the same YAML renders across adoption
  surfaces;
- smallest useful topology YAML snippet;
- smallest useful stylesheet YAML snippet;
- install/run/embed commands;
- links to published MkDocs, Zensical, harness, and package docs;
- explicit support-status table.

The README should avoid turning into the monorepo manual.

## Status Taxonomy

Every public surface should use one of these labels:

| Status | Meaning |
|---|---|
| Supported | Intended for normal users; covered by CI and docs. |
| Experimental | Implemented, but API or UX can change. |
| Lab | Local validation/demo environment, not a packaged product surface. |
| Roadmap | Planned or being specified, not supported. |
| Maintainer | Internal development/release documentation. |

This taxonomy should appear in the docs and be enforced by wording lint where
practical.

## Example Strategy

Generated examples remain valuable test fixtures, but the adoption path needs a
small curated set:

1. Basic two-node graph.
2. CLOS 2-spine/4-leaf fabric.
3. Real network underlay and service path.
4. Attention/focus in a dense graph.
5. Grafana mounted-bundle telemetry overlay, once status allows.

Each curated example should answer:

- what to copy;
- what it renders;
- why this is better than a static image;
- which YAML fields matter;
- where to go for the full reference.

## Promotional Collage And Local Demo Capture

The README should favor one durable checked-in collage that proves the core
workflow visually:

```text
Topology YAML + Stylesheet YAML
  -> browser harness live graph
  -> MkDocs live viewport
  -> Zensical live viewport
  -> Grafana mounted-bundle telemetry overlay
```

The collage should be captured with Playwright so it is repeatable and can be
regenerated when the UI changes. This is the public artifact because it loads
reliably on GitHub, survives repository checkout, and lets users inspect all
surfaces at once.

Generated video, MP4, WebM, or GIF output may still exist as optional local
review material, but it is not the preferred README artifact and must not be a
release gate.

### Collage Story

The collage should include whole-window captures, not only cropped graph
content:

1. Browser harness in dark mode with YAML authoring visible.
2. MkDocs in dark mode showing the same live viewport and YAML tabs.
3. Zensical in dark mode showing the same generated content.
4. Grafana showing the same mounted-bundle topology with telemetry overlay.
5. A concise caption-level message:
   "YAML topology. Reusable stylesheet. Interactive diagram."

### Recording Pipeline

Maintain a Playwright capture script, for example:

```text
scripts/record-promo-demo.mjs
```

The script should:

- require Node 24;
- fail with actionable messages if required local surfaces are not running;
- use deterministic viewport size, dark mode, and seed data;
- copy the accepted README/docs collage to
  `docs/assets/topoviewer-yaml-to-graph-collage.png` or another checked-in
  `docs/assets/` path;
- optionally record temporary local video/GIF/MP4 review output under
  `.artifacts/promo/`;
- avoid local filesystem paths, debug panels, failed diagnostics, or personal
  data in the frame.

Optional local review artifacts can include:

```text
.artifacts/promo/topoviewer-yaml-to-graph-demo.webm
.artifacts/promo/topoviewer-yaml-to-graph-demo.mp4
.artifacts/promo/topoviewer-yaml-to-graph-demo.gif
```

`.artifacts/promo/` is only a local review/staging directory. It is not checked
in and must not be referenced from README, MkDocs, Zensical, or GitHub Pages.

### Asset Policy

The repo should not depend on large committed binary video files or hosted video
URLs as the primary README path. The preferred flow is:

1. Generate the collage locally with Playwright.
2. Review the whole-window captures for polish, parity, dark mode, and absence
   of local-only noise.
3. Commit the accepted collage under `docs/assets/`.
4. Keep generated GIF/MP4/WebM review artifacts out of git.

Any asset referenced by README or docs must be checked in under `docs/assets/`
or intentionally hosted by a durable public URL for a separate reason. The
promo media release gate is satisfied by the checked-in collage, not by hosted
animated playback.

### Acceptance Bar

The collage is acceptable only if:

- it renders from the GitHub README without external media hosting;
- it demonstrates YAML to graph across real product surfaces;
- it includes MkDocs, Zensical, harness, and Grafana;
- each panel is readable at README scale;
- it is regenerated through a documented command;
- it does not expose local paths, secrets, or lab-only noise.

## Differentiation Pages

TopoViewer should explicitly compare itself to:

- Mermaid.js: broad text-to-diagram syntax versus semantic topology runtime.
- React Flow directly: low-level canvas toolkit versus topology schema,
  stylesheet, examples, docs embeds, validation, and authoring workflow.
- Static images/SVG workflows: image editing versus versioned topology facts and
  reusable presentation policy.

The comparison must be factual and respectful. Do not name competing projects
unnecessarily when a generic category is enough.

## Stability Contract

The public docs should distinguish:

- stable YAML fields;
- experimental YAML fields;
- stable style keys;
- experimental style keys;
- stable React exports;
- internal-only helpers;
- generated examples used as regression fixtures.

Schema files, TypeScript API docs, YAML assist metadata, and reference tables
should stay aligned.

## Developer Experience Contract

Public adoption fails if developers cannot discover the exact YAML object
attributes and mapper behavior from docs and the harness. TopoViewer's
ergonomics depend on two non-negotiable pieces:

1. The browser harness must author a full Grafana bundle:

```text
*.topo.tv.yaml
*.style.tv.yaml
*.mapper.tv.yaml
```

The harness should not merely display mapper YAML. It must help create it:
schema-aware Monaco suggestions, topology-aware object suggestions,
target-kind-aware style overlay suggestions, diagnostics, coverage preview, and
bundle export.

2. The documentation must explain every public TopoViewer object attribute:

```text
graph, layer, node, link, path, region, callout, labels, data,
layout, icon, stylesheet rule, style object, attention, mapper rule
```

Each attribute needs purpose, type, accepted values, default, validation,
selector impact, mapper impact where relevant, minimal YAML, and a small
rendered example or diagnostic example. This is not reference polish; it is the
developer experience that lets someone adopt TopoViewer without reading source.

## Enterprise Trust Contract

A high-scale engineering org will not adopt TopoViewer only because it renders
beautiful diagrams. It needs dependency trust. This change must therefore add
signals that make TopoViewer defensible in an internal design review:

- `SECURITY.md` with vulnerability reporting, expected response path, and
  supported security scope;
- `SUPPORT.md` with support boundaries, best-effort expectations, and what is
  explicitly not promised;
- `CONTRIBUTING.md`, issue templates, review expectations, and `CODEOWNERS` so
  the repo does not look like an ungoverned personal project;
- SemVer policy, changelog/release-note expectations, deprecation policy, and
  migration guidance;
- public/internal API boundaries for React exports, YAML schema, style keys,
  mapper schema, docs plugins, harness internals, and Grafana plugin APIs;
- compatibility matrix for Node, React, React Flow, Grafana, browsers, MkDocs,
  Zensical, and operating systems;
- performance envelope for small, curated, dense, and stress graphs;
- accessibility posture for keyboard interaction, focus, color contrast,
  reduced motion, and screen-reader expectations;
- architecture overview and threat model that explain trust boundaries and
  hostile input surfaces.

If these signals are missing, implementation quality is not enough. The repo
will still look risky to engineers who have to defend third-party dependencies
inside a large organization.

## Security And Abuse Resistance

The public adoption bar includes security posture. TopoViewer accepts
user-authored YAML, stylesheets, inline SVG, labels, callouts, mapper templates,
Prometheus labels, mounted bundle files, and docs embed blocks. Every one of
those inputs must have an explicit safety story before the project claims
production-grade readiness.

The hardening model should include:

- a hostile-content corpus for SVG, Markdown/callouts, labels, mapper
  templates, YAML bombs, Unicode controls, and malformed partial YAML;
- backend mounted-bundle abuse tests for root traversal, symlink escapes,
  manifest abuse, file size limits, duplicate bundle IDs, and role access;
- visual and DOM invariants proving theme CSS from MkDocs/Zensical may affect
  colors but not geometry, label placement, glyph alignment, edge attachment,
  or layout sizing;
- explicit lab security banners for anonymous Admin, broad port exposure,
  unsigned plugin loading, and checked-in disposable credentials;
- artifact autopsy checks for npm packs, Grafana plugin zips, docs builds,
  screenshots, and generated media;
- dependency triage for npm and Go advisories, with shipped/dev/tooling risk
  classification.
- automated security monitoring through Dependabot or equivalent update
  automation for npm, GitHub Actions, Go modules, and Docker/container images;
- static analysis, secret scanning, and container-image scanning gates that run
  without relying on a maintainer remembering to do manual checks.

Security findings should not be hidden behind green CI. A finding is resolved
only when it is fixed, tested, documented as lab-only, or recorded with a clear
temporary risk rationale.

## Harness Mapper Authoring

Grafana mounted bundles make `*.mapper.tv.yaml` part of the public workflow.
That means mapper authoring cannot stay as a hidden Grafana-only detail. The
browser harness should become the practical authoring surface for the full
bundle:

```text
topology YAML
stylesheet YAML
mapper YAML
  -> validate
  -> preview mapping coverage
  -> copy or save mounted bundle files
  -> Grafana panel consumes the same files
```

The harness should add a Mapper YAML mode when a Grafana-oriented workflow is
selected or when a `*.mapper.tv.yaml` file is loaded. The mode should provide:

- schema-backed Monaco suggestions for mapper keys, enums, thresholds, states,
  targets, resolver modes, style overlays, and query hints;
- topology-aware suggestions for node, link, path, region, layer, label, and
  data keys from the currently applied topology;
- examples for common mappings such as node health, link state, bidirectional
  utilization, path SLO, and region aggregate status;
- validation diagnostics that separate YAML parse errors, schema errors,
  topology binding errors, unsupported style overlay keys, and PromQL/query
  hints;
- a mapping coverage preview using synthetic sample frames or pasted sample
  labels so the user can see matched, unmatched, duplicate, stale, and
  ambiguous mappings before opening Grafana;
- export/copy behavior that writes the canonical suffixes
  `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml`.

This keeps Grafana as the operational runtime and the harness as the authoring
tool. Grafana should validate and display mapper diagnostics, but it should not
be the main place where users discover the mapper language from scratch.

## Manual npm Publishing

Public adoption is blocked if install instructions point to an npm package that
does not exist or is published accidentally from an unreviewed push. Package
publication should be treated as an explicit release operation.

The first public package should be planned as `0.1.0` when the early-adopter
gates pass. `1.0.0` is a later stable-core milestone, not the first public
publish.

The release contract should be:

- normal push and pull-request CI can validate package metadata, build output,
  and `npm pack --dry-run`;
- normal push and pull-request CI must not publish to npm;
- publication requires an intentional manual action, either a documented local
  maintainer command or a GitHub Actions `workflow_dispatch` release workflow;
- the manual publish action must require a version/tag decision, a changelog or
  release note, successful `npm run ci`, and a package dry-run;
- the default npm dist-tag should be deliberate. Prefer `next` for the `0.1.0`
  early-adopter release; reserve uncaveated `latest` for the stable `1.0.0`
  contract, or use `latest` for `0.1.0` only with clear pre-1.0 wording;
- npm Trusted Publishing OIDC, automatic provenance, package access, and
  rollback or deprecation steps should be documented before first public
  publish. Long-lived npm tokens should not be part of the normal release path.

The first public package should be validated as if a new user will immediately
run:

```text
npm install topoviewer @xyflow/react react react-dom
```

If the package name or peer-dependency contract changes, README, MkDocs,
Zensical, package README, and schema/docs snippets must change in the same
patch.

## Quality Gates

Add or tighten checks for:

- public nav structure;
- stale support-status wording;
- broken public links;
- public docs leakage of local paths, `.donotpush`, `.artifacts`, private
  files, checked-in credentials, and outdated repo/GitHub Pages route casing;
- root README and docs homepage drift;
- examples that are not in the curated docs or reference index;
- generated docs/example projection drift;
- representative screenshot/render parity across harness, MkDocs, and Zensical;
- package metadata and install command correctness;
- package dry-run output, npm files allowlist, peer dependency correctness, and
  manual-publish workflow safety;
- npm and Go dependency advisory triage;
- Dependabot or equivalent automated security update coverage for package
  ecosystems used by the repo;
- CodeQL or equivalent static analysis, secret scanning, and container image
  scanning;
- hostile input corpus execution for YAML, SVG, Markdown/callout HTML, mapper
  templates, and telemetry labels;
- Grafana mounted-bundle backend abuse tests for path traversal, symlinks,
  manifest abuse, role access, and resource limits;
- artifact autopsy for npm packs, Grafana zips, docs builds, screenshots, and
  promotional media;
- mapper YAML schema/docs/harness assist alignment for Grafana mounted bundles.
- governance files, support boundaries, and security reporting are present;
- SemVer, compatibility matrix, API ownership, deprecation, and migration
  checks are present;
- performance, reliability, accessibility, architecture, and threat-model
  evidence is present.

## Sequencing

Do the work in this order:

1. Define support-status taxonomy and public IA.
2. Refactor nav and public landing pages.
3. Split oversized guides into task pages and reference pages.
4. Promote curated examples.
5. Move maintainer/lab material out of the main adoption path.
6. Add docs lint/CI checks.
7. Add harness mapper authoring for `*.mapper.tv.yaml`.
8. Add governance, support, security, and contribution ownership files.
9. Add SemVer, compatibility matrix, API ownership, deprecation, and migration
   gates.
10. Add performance, reliability, accessibility, architecture, and threat-model
   evidence.
11. Add manual npm publishing docs and dry-run validation.
12. Run docs build, preview smoke, package dry-run, and representative visual
   checks.
