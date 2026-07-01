# TopoViewer

[![CI](https://github.com/asadarafat/topoviewer/actions/workflows/ci.yml/badge.svg)](https://github.com/asadarafat/topoviewer/actions/workflows/ci.yml)
[![Docs](https://github.com/asadarafat/topoviewer/actions/workflows/docs.yml/badge.svg)](https://github.com/asadarafat/topoviewer/actions/workflows/docs.yml)
[![npm](https://img.shields.io/npm/v/topoviewer?label=npm)](https://www.npmjs.com/package/topoviewer)

## Hi, I'm TopoViewer.

I turn infrastructure topology into interactive diagrams.

Give me a topology model, a stylesheet, and optionally a telemetry mapper. I will give you a diagram that can live in docs, React apps, and Grafana dashboards without being redrawn every time reality changes.

```text
topology.yaml      what exists
stylesheet.yaml    how it should look
mapper.yaml        how runtime data attaches

        ↓

interactive topology view
```

One model. Multiple surfaces. No screenshot archaeology.

<p align="center">
  <a href="https://asadarafat.github.io/topoviewer/harness/"><strong>Open the Harness</strong></a>
  ·
  <a href="https://asadarafat.github.io/topoviewer/docs/mkdocs/"><strong>Read the Docs</strong></a>
  ·
  <a href="https://www.npmjs.com/package/topoviewer"><strong>npm</strong></a>
</p>

![Same TopoViewer YAML rendered as an interactive topology diagram](docs/assets/topoviewer-yaml-to-graph-collage.png)

---

## Try Me

### 1. Open the Harness

The Harness is the fastest way to poke me without pretending setup work is the fun part.

Load topology YAML. Test stylesheets. Break examples. Fix them. See the diagram render. That is the loop.

```text
https://asadarafat.github.io/topoviewer/harness/
```

### 2. Use me in React

```bash
npm install topoviewer @xyflow/react react react-dom
```

```tsx
import { TopoViewer, type TopoDocument } from 'topoviewer';
import 'topoviewer/style.css';

export function Diagram({ document }: { document: TopoDocument }) {
  return (
    <TopoViewer
      document={document}
      selectedLayerIds={['physical']}
      style={{ height: 420 }}
    />
  );
}
```

### 3. One model, multiple surfaces

When I say one model can render in multiple places, I am not decorating the README.

The same topology idea can live in documentation too:

```text
https://asadarafat.github.io/topoviewer/docs/mkdocs/
```

The Zensical view shows the same direction pushed into another documentation/runtime surface:

```text
https://asadarafat.github.io/topoviewer/docs/zensical/
```

The point is simple:

```text
do not redraw the diagram
reuse the topology model
render it where engineers are already working
```

### 4. Make Grafana topology less boring

This is where I stop being only a diagram renderer and start becoming operationally interesting.

The bar is intentionally high: a Grafana topology panel should be beautiful, useful, inspectable, and less like a table wearing a network costume.

```text
stable topology model
  + Grafana data frames
  + telemetry mapper
  = runtime topology overlay
```

The telemetry mapper lets the Grafana panel react to runtime data without rewriting the topology model. Links can change color. Nodes can show state. Paths can expose health. A dashboard can stop being a pile of disconnected numbers and start showing where those numbers live.

Want to see whether I am telling the truth? Use a disposable Linux lab machine and run the bootstrap script:

```bash
curl -fsSL https://raw.githubusercontent.com/asadarafat/topoviewer/development/scripts/bootstrap-grafana-containerlab-lab.sh | bash
```

The bootstrap downloads the self-contained lab bundle, then starts the Grafana + Containerlab proof of concept. If Containerlab is missing, it prints the install command and stops:

```bash
curl -sL https://containerlab.dev/setup | sudo -E bash -s "all"
```

That command runs an external install script with `sudo`. For a serious machine, read the script first. For a disposable lab box, welcome to the fun part.

Containerlab is only demo plumbing here. It creates realistic telemetry for the Grafana proof of concept. I do not require Containerlab.

---

## Why I Exist

Infrastructure diagrams usually rot.

They start as useful pictures. Then the network changes, services move, names drift, links get added, dashboards evolve, and the diagram becomes a historical artifact with nice colors.

I exist because topology diagrams should behave more like code:

- object IDs instead of anonymous shapes
- layers instead of duplicated pictures
- regions instead of visual guesswork
- paths instead of hand-drawn arrows
- metadata instead of random labels
- validation instead of screenshot archaeology
- telemetry overlays instead of disconnected dashboard numbers

If a diagram explains production infrastructure, it should be possible to review it, test it, diff it, reuse it, and eventually generate it from source data.

---

## Minimal Model

Give me a topology:

```yaml
# topology.yaml
graph:
  layers:
    - id: physical
      name: Physical

  nodes:
    - id: PE1
      name: PE1
      labels:
        role: pe
      layers: [physical]
      position: [160, 160]

    - id: P1
      name: P1
      labels:
        role: p
      layers: [physical]
      position: [420, 160]

  links:
    - id: PE1-P1
      source: PE1
      target: P1
      layers: [physical]
```

Give me a style:

```yaml
# stylesheet.yaml
stylesheet:
  - selector: node
    style:
      shape: rectangle
      width: 84
      height: 60
      borderWidth: 3

  - selector: 'node[labels.role = "pe"]'
    style:
      backgroundColor: '#1565c0'
      color: '#ffffff'

  - selector: link
    style:
      curveStyle: straight
      lineColor: '#42a5f5'
      lineWidth: 3
```

I turn that into a diagram.

```text
model + style = diagram
```

Runtime overlays are optional:

```text
model + style + telemetry mapper = operational topology view
```

---

## What Makes Me Interesting

I am not trying to be a prettier box-and-line drawer.

I care about topology objects that have identity.

```text
node is not just a rectangle
link is not just a line
path is not just an arrow
region is not just a background color
layer is not just a duplicated screenshot
metadata is not just random text
telemetry is not just a number in a table
```

My job is to keep those things connected.

```text
boring topology data in
useful interactive diagram out
```

That is the whole trick.

---

## Roadmap Vision

I am aiming to become a practical topology visualization layer for infrastructure teams.

The vision:

```text
define topology once
validate it in CI
render it where engineers work
overlay runtime state when telemetry exists
```

Important directions:

### Better authoring

- clearer schema errors
- better semantic linting
- better Harness UX
- better examples
- import/export helpers
- schema-aware editor workflows
- eventually: installable editor extensions

There is early editor-extension work in the tree, but no polished VSIX/package yet. Treat that as future direction, not a supported product.

### Better documentation embedding

- cleaner Markdown syntax
- better docs-build errors
- better dark/light theme behavior
- stronger examples gallery
- easier copy-paste snippets
- stronger CI examples for documentation teams

### Better Grafana integration

- simpler local demo
- better mapper recipes
- better unresolved/ambiguous telemetry diagnostics
- cleaner Prometheus examples
- signed/releasable plugin workflow
- stronger production guidance
- better fault-injection scenarios

### Source-of-truth imports

I should not require every team to hand-write topology forever.

Possible future import paths:

- NetBox
- Infrahub
- Containerlab topology files
- inventory systems
- service catalogs
- custom JSON/YAML sources
- internal platform APIs

The goal is not to replace source-of-truth systems.

The goal is to render them well.

### Hardening

Pretty diagrams are not enough.

Serious use needs:

- stricter schemas
- safer SVG/image handling
- stronger renderer limits
- accessibility work
- performance work for large graphs
- clearer security boundaries
- better package release process
- more boring tests
- clearer compatibility promises

---

## Local Development

Prerequisites:

```text
Node.js >=24 <25
Python 3.9+
```

Clone and install:

```bash
git clone https://github.com/asadarafat/topoviewer.git
cd topoviewer
npm ci
```

Run the full local quality gate:

```bash
npm run ci
```

Useful focused checks:

```bash
npm run validate:schemas
npm run validate:semantics
npm run lint
npm run build
npm test
npm run pack:check
```

Preview the docs and Harness locally:

```bash
npm run docs:preview
```

Open:

```text
Docs:    http://127.0.0.1:8001/topoviewer/docs/mkdocs/
Harness: http://127.0.0.1:8001/topoviewer/harness/
```

Build documentation:

```bash
npm run docs:build
```

Build and test the Grafana panel work:

```bash
npm run grafana:panel:build
npm run grafana:panel:test
```

Build the self-contained Grafana Containerlab lab bundle:

```bash
npm run grafana:clab:bundle
```

---

## Quality Bar

I am early, but I am not intended to be a throwaway demo.

The repository has guardrails for:

- JSON Schema validation
- semantic topology linting
- broken object references
- unsafe image references
- renderer limit violations
- generated docs/example freshness
- package artifact inspection
- renderer parity checks
- Playwright interaction coverage
- dependency boundary checks
- duplicate-code checks
- public-readiness checks
- security checks for untrusted YAML, Markdown, SVG, mapper, and telemetry inputs

The goal is boring reliability around an ambitious idea.

---

## Security Model

I render user-authored topology data. Treat diagram inputs as untrusted unless your host application controls the source.

Inputs that deserve suspicion:

- topology YAML
- stylesheet YAML
- mapper YAML
- labels
- Markdown
- SVG icons
- image references
- telemetry labels
- mounted bundle files

Expected boundaries:

- labels and Markdown should render as inert content unless a host explicitly opts into trusted HTML.
- unsafe SVG and image references should be rejected where supported.
- oversized documents and embedded assets should be constrained.
- mounted bundles should stay inside configured roots.
- I am not a sandbox for arbitrary hostile HTML or JavaScript.
- host applications remain responsible for authentication, authorization, tenancy, and business policy.

Report suspected vulnerabilities privately when possible. Do not paste exploit details into a public issue.

---

## Project Reality

I am early.

The idea is serious: topology-as-code for infrastructure teams.

The implementation is still becoming boring enough to trust everywhere.

Some parts are clean. Some parts are prototypes. Some parts are actively being rebuilt. Some parts moved fast because this project started heavily AI-assisted. That helped explore the product shape quickly across renderer, schemas, docs, Grafana, labs, and tooling.

The tradeoff is obvious: seasoned developers may find awkward code, overbuilt paths, underbuilt paths, weird names, or suspicious seams.

That feedback is useful, but the project is not yet in a polished outside-contribution phase. Large parts of the tree may be renamed, deleted, split, or flattened without much ceremony.

The goal:

```text
keep the product idea ambitious
make the implementation boring
earn trust through validation, tests, examples, and hardening
```

No fake enterprise theater here. If something is prototype-quality, call it prototype-quality.

---

## Current Construction Zone

I am being actively reshaped.

That means:

- APIs may move
- packages may be reorganized
- examples may be rewritten
- docs may be merged, deleted, or renamed
- prototypes may disappear
- old abstractions may be replaced instead of preserved
- compatibility may intentionally break before the project stabilizes

This is not churn for the sake of churn.

It is the stage where the useful idea gets separated from the accidental scaffolding.

For now, the most useful outside signal is sharp feedback from trying the public paths:

```text
"I tried the quickstart and got stuck here."
"This concept is unclear."
"This example does not match how real networks look."
"This Grafana PoC step failed."
"This error message is useless."
"This page made me want to close the tab."
```

That kind of feedback is valuable while the product shape is still being hardened.

---

## Repository Layout

```text
topoviewer/
  packages/
    topoviewer/                 # React/TypeScript renderer, schemas, examples
    mkdocs-topoviewer/          # MkDocs integration
    grafana-topoviewer-panel/   # Grafana panel work

  labs/
    grafana-topoviewer/         # Grafana telemetry PoC and Containerlab scaffolding

  docs/                         # Published documentation assets
  scripts/                      # Build, validation, sync, security, and release helpers
```

Some prototype work may live in the tree before it has a packaged user path. That does not automatically make it a supported product surface.

---

## License

Apache-2.0.

See [LICENSE](LICENSE).

---

## Legacy History

The historical pre-refresh repository is preserved at [topoViewer-legacy](https://github.com/asadarafat/topoViewer-legacy).
