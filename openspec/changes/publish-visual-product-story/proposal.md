## Why

TopoViewer has become materially more capable: attention behavior, richer edge
styling, node shapes, node labels, MkDocs embedding, and parallel Zensical docs
are all present. The public first impression has not caught up. The README still
opens like a monorepo architecture note, and the docs expose many capabilities
before they explain why someone should care.

The next best move is to make TopoViewer immediately understandable and visually
credible in the first 30 seconds:

- show YAML turning into a rendered network diagram;
- explain why TopoViewer exists;
- show real network scenarios, not generic graph toys;
- make integration paths concrete enough for NetBox, OpsMill/Infrahub, MkDocs,
  Grafana, and VS Code users to understand where the project is going without
  overstating what is already supported.

This change is documentation and demo-product work. It should not introduce new
renderer primitives unless an existing capability is blocked by an implementation
bug found while building the demo.

## What Changes

### 1. Make the README visual first

Rewrite the top of `README.md` so the first screen is product-facing:

- a concise TopoViewer positioning sentence;
- a real rendered network screenshot or generated visual from first-party
  examples;
- a small YAML snippet paired with the rendered output;
- direct links to the live demo page and docs.

Architecture, package boundaries, quality gates, and monorepo details remain in
the README, but they move below the visual product explanation.

### 2. Add a beautiful before/after example

Create one polished "YAML -> rendered network diagram" example that is small
enough to understand quickly and rich enough to show TopoViewer's advantage.

The example should include:

- realistic provider or enterprise network naming;
- underlay links, BGP/session state, service path, and failure emphasis in one
  clear diagram or adjacent states;
- enough style to look intentional without becoming decorative;
- a source YAML block and a rendered viewport/screenshot side by side.

### 3. Add a clear "Why TopoViewer?" section

Add a public docs section that answers the product question directly:

- declarative topology as data;
- selector-style visual rules;
- embedded docs that stay close to source;
- large/dense network focus and attention controls;
- exportable, testable diagrams;
- TypeScript and MkDocs integration as first-class surfaces.

This section should be practical and specific. It should not be a generic graph
visualization pitch.

### 4. Consume standalone integration roadmap specs

Before publishing integration roadmap claims, review and incorporate the
standalone integration roadmap changes:

- `openspec/changes/define-netbox-integration-roadmap/`;
- `openspec/changes/define-opsmill-infrahub-integration-roadmap/`;
- `openspec/changes/define-grafana-integration-roadmap/`;
- `openspec/changes/define-vscode-integration-roadmap/`.

Each standalone change answers whether the integration is feasible, what the
realistic use cases are, and what integration shape should come first.

The public roadmap page or section should then explain integration direction:

- NetBox: in-platform plugin for inventory-driven diagram views and optional
  YAML export;
- OpsMill/Infrahub: in-platform extension or artifact workflow for graph-native
  intended-state views and branch/diff-driven diagrams;
- MkDocs: supported today as a plugin with live YAML examples;
- Grafana: planned panel or embeddable runtime integration for operational
  dashboards;
- VS Code: planned authoring preview, schema validation, and example workflow.

The roadmap must distinguish "supported now" from "planned" and avoid implying
shipping integration packages that do not exist yet.

### 5. Publish one demo page with real network examples

Create one public demo page that shows realistic network views:

- underlay;
- BGP;
- service path;
- failure view.

The page can be one multi-section demo or a compact set of linked examples, but
it must feel like one coherent product demo. Each scenario should use real
network concepts and be inspectable through the same live viewport / topology
YAML / stylesheet YAML pattern used by other examples.

## Capabilities

### New Capabilities

- `visual-product-story`: product-facing README and documentation that explain
  TopoViewer visually before explaining architecture.
- `real-network-demo`: one public demo surface with underlay, BGP, service path,
  and failure views.
- `integration-roadmap`: clear status and direction for NetBox,
  OpsMill/Infrahub, MkDocs, Grafana, and VS Code.

### Modified Capabilities

- `topoviewer-readme`: first 30 seconds become visual and user-facing.
- `topoviewer-docs`: docs navigation exposes the product story and demo page.
- `topoviewer-examples`: adds or refines realistic network examples that also
  serve as test fixtures.

## Impact

- `README.md` - reorganize top section around visual proof and a concise product
  story.
- `openspec/changes/define-*-integration-roadmap/` - upstream
  integration-specific feasibility, use-case, risk, and roadmap constraints.
- `packages/topoviewer/docs/**` - add product story, integration roadmap, and
  demo copy at the source-of-truth docs layer.
- `docs/topoviewer/**` - generated MkDocs output after sync.
- `docs-zensical/**` - generated Zensical output after sync if the selected docs
  are part of the shared documentation set.
- `packages/topoviewer/examples/test-cases/**` - add or refine real network
  demo examples.
- `packages/topoviewer/tests/**` - assert demo examples render and contain the
  expected visible states.
- `scripts/**` - optional screenshot capture or README asset generation if a
  repeatable visual asset is needed.

## Non-Goals

- Building NetBox, OpsMill/Infrahub, Grafana, or VS Code integrations in this
  change.
- Adding a marketing landing page that is detached from working examples.
- Replacing MkDocs/Zensical docs architecture.
- Using stock imagery, decorative abstract diagrams, or screenshots that cannot
  be regenerated from first-party examples.
- Changing public topology or stylesheet schema only to make the demo prettier.
