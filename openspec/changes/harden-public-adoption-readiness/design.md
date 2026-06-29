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

## Public Information Architecture

Recommended public docs structure:

```text
Home
Start
  First topology
  Browser harness
  Local preview
Author
  Topology YAML
  Stylesheet YAML
  Attention YAML
  Layout
  Validation
Embed
  React
  MkDocs
  Zensical
  Grafana experimental
Examples
  Basic graph
  CLOS fabric
  Real network
  Node styling
  Edge styling
  Attention
Reference
  YAML model
  Stylesheet keys
  Schemas
  TypeScript API
Labs
  Grafana
  Containerlab
Maintainers
  Monorepo
  Release
  Documentation standard
  Production hardening
```

Maintainer and lab material can stay public, but it should not sit beside the
first topology path as if it is equally important to new users.

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
- record to `.artifacts/promo/topoviewer-yaml-to-graph-demo.webm`;
- capture a poster image to `.artifacts/promo/topoviewer-yaml-to-graph-demo.png`;
- avoid local filesystem paths, debug panels, failed diagnostics, or personal
  data in the frame.

Optional post-processing can produce MP4 when `ffmpeg` is available:

```text
.artifacts/promo/topoviewer-yaml-to-graph-demo.mp4
```

### Asset Hosting

The repo should not depend on large committed binary video files as the primary
README playback path. The preferred flow is:

1. Generate the video locally with Playwright.
2. Review the artifact.
3. Upload the final video to a dedicated GitHub issue or discussion used only
   for README media assets.
4. Copy the resulting GitHub-hosted `user-attachments` URL into the README.
5. Keep the poster image either committed under `docs/assets/` or uploaded to
   the same asset host.

The README should use the GitHub-hosted asset URL for playback. If GitHub
renders video differently in a context, the poster image should link to a
published demo page where the video is also embedded.

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

## Quality Gates

Add or tighten checks for:

- public nav structure;
- stale support-status wording;
- broken public links;
- root README and docs homepage drift;
- examples that are not in the curated docs or reference index;
- generated docs/example projection drift;
- representative screenshot/render parity across harness, MkDocs, and Zensical;
- package metadata and install command correctness.

## Sequencing

Do the work in this order:

1. Define support-status taxonomy and public IA.
2. Refactor nav and public landing pages.
3. Split oversized guides into task pages and reference pages.
4. Promote curated examples.
5. Move maintainer/lab material out of the main adoption path.
6. Add docs lint/CI checks.
7. Run docs build, preview smoke, and representative visual checks.
