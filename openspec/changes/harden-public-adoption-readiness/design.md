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

Recommended public docs structure should follow the proven shape used by
developer tools with strong API adoption:

```text
Home
Learn
  Quick start
  Concepts
    Topology model
    Layers
    Nodes and links
    Styles and themes
    Layouts
  Guides
    Build your first topology
    Create a layered network map
    Render in Grafana
    Render in MkDocs
    Render in Zensical
    Export to SVG/PNG
  Advanced
    Custom node types
    Dynamic layer filtering
    Semantic annotations
    Large topology performance
    Plugin development
API Reference
  Schema
    Topology
    Node
    Link
    Layer
    Style
    Layout
    Mapper
  Components
    TopoViewer
    TopoViewerWorkbench
  Hooks
    useTopoViewerState
  CLI
    Validate
    Build docs
Examples
  Basic
  Provider network
  Datacenter
  Integrations
Showcase
  ISP backbone
  Mobile transport
  Datacenter interconnect
  AI workload transport
Labs
  Grafana
Changelog
Maintainers
  Monorepo
  Release
  Documentation standard
  Production hardening
```

The Grafana lab may include synthetic telemetry and Containerlab-backed
telemetry modes, but Containerlab should not appear as a separate top-level
public lab. Maintainer and lab material can stay public, but it should not sit
beside the first topology path as if it is equally important to new users.

The docs should not create placeholder pages that pretend unsupported surfaces
exist. When a React Flow-style slot maps to a roadmap or experimental surface,
the page must carry the support-status label and state the current working
path. For example, NetBox and OpsMill/Infrahub import guides stay roadmap until
real plugins exist; Grafana stays experimental/lab until package and plugin
release gates pass.

## README Contract

The README should optimize for the first screen and first result:

- one-sentence product identity;
- one short promotional video with a poster fallback;
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

## Promotional Demo Video

The README should include one short promotional walkthrough that proves the
core workflow visually:

```text
Topology YAML + Stylesheet YAML
  -> browser harness live graph
  -> MkDocs live viewport
  -> Zensical live viewport
  -> Grafana mounted-bundle telemetry overlay
```

The video should be captured with Playwright so it is repeatable and can be
regenerated when the UI changes.

### Storyboard

Target length: 45-75 seconds.

1. Open the browser harness in dark mode with the YAML panel visible.
2. Show topology/style YAML for a compact, polished example.
3. Click Apply or otherwise show the rendered graph responding to YAML.
4. Switch to MkDocs and show the same live viewport with YAML tabs.
5. Switch to Zensical and show parity with the same live viewport.
6. Switch to Grafana and show the same topology driven by a mounted bundle and
   telemetry overlay.
7. End on a clean rendered topology and a caption-level message:
   "YAML topology. Reusable stylesheet. Interactive diagram."

### Recording Pipeline

Add a Playwright recording script, for example:

```text
scripts/record-promo-demo.mjs
```

The script should:

- require Node 24;
- fail with actionable messages if required local surfaces are not running;
- use deterministic viewport size, dark mode, and seed data;
- record temporary local review output to
  `.artifacts/promo/topoviewer-yaml-to-graph-demo.webm`;
- capture temporary local poster output to
  `.artifacts/promo/topoviewer-yaml-to-graph-demo.png`;
- copy the accepted README/docs poster to
  `docs/assets/topoviewer-yaml-to-graph-demo.png` or another checked-in
  `docs/assets/` path;
- avoid local filesystem paths, debug panels, failed diagnostics, or personal
  data in the frame.

Optional post-processing can produce MP4 when `ffmpeg` is available:

```text
.artifacts/promo/topoviewer-yaml-to-graph-demo.mp4
```

`.artifacts/promo/` is only a local review/staging directory. It is not checked
in and must not be referenced from README, MkDocs, Zensical, or GitHub Pages.

### Asset Hosting

The repo should not depend on large committed binary video files as the primary
README playback path. The preferred flow is:

1. Generate the video locally with Playwright.
2. Review the artifact.
3. Upload the final video to a dedicated GitHub issue or discussion used only
   for README media assets.
4. Copy the resulting GitHub-hosted `user-attachments` URL into the README.
5. Commit the poster image under `docs/assets/` or upload it to the same asset
   host.

The README should use the GitHub-hosted asset URL for playback. If GitHub
renders video differently in a context, the poster image should link to a
published demo page where the video is also embedded. Any asset referenced by
README or docs must be either checked in under `docs/assets/` or hosted by a
durable public URL; never reference `.artifacts`.

### Acceptance Bar

The video is acceptable only if:

- it plays from the rendered GitHub README;
- it has a useful poster frame;
- it demonstrates YAML to graph, not only final screenshots;
- it includes MkDocs, Zensical, harness, and Grafana;
- it is short enough to watch without friction;
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

The release contract should be:

- normal push and pull-request CI can validate package metadata, build output,
  and `npm pack --dry-run`;
- normal push and pull-request CI must not publish to npm;
- publication requires an intentional manual action, either a documented local
  maintainer command or a GitHub Actions `workflow_dispatch` release workflow;
- the manual publish action must require a version/tag decision, a changelog or
  release note, successful `npm run ci`, and a package dry-run;
- the default npm dist-tag should be deliberate, for example `next` for early
  public validation and `latest` only when the stable docs and package contract
  are ready;
- npm provenance, 2FA/token requirements, package access, and rollback or
  deprecation steps should be documented before first public publish.

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
  promotional videos;
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
