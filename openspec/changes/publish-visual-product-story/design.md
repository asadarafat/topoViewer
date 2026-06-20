## Design

### Source of truth

The implementation should keep existing documentation boundaries:

- `packages/topoviewer/examples/test-cases/**` remains the source of truth for
  demo YAML, stylesheets, internal expected assertions, and Playwright coverage.
- `packages/topoviewer/docs/**` remains the source of truth for authored docs.
- `docs/topoviewer/**` remains generated MkDocs output.
- Zensical content is synced from the shared docs subset where possible.

The README may include a short embedded YAML snippet and an image, but the
complete example should live in the normal example/docs structure.

### Visual asset strategy

README cannot run a live TopoViewer viewport. It needs a static visual asset
that is derived from a first-party example.

Preferred approach:

1. Build the before/after example as a normal TopoViewer example.
2. Use Playwright or an existing docs preview page to capture a deterministic
   screenshot of the rendered viewport.
3. Store the generated screenshot under a tracked docs asset path with a script
   or command documented in tasks.
4. Reference that screenshot from README and the demo page.

If screenshot generation is not worth adding yet, a temporary static Markdown
reference is acceptable only when the live demo page remains the canonical
visual proof.

### Demo shape

Use one coherent scenario with four inspectable views:

- **Underlay**: regions, PE/P routers, transport links, and link capacity/state.
- **BGP**: neighbor/session overlay with state styling and labels.
- **Service path**: selected customer or application path with attention focus.
- **Failure view**: degraded link/node state, muted context, and visible blast
  radius.

The scenario should be realistic but compact. It should show what matters in a
dense environment without requiring hundreds of nodes on the first page.

### First 30 seconds

The README opening should answer, in order:

1. What is TopoViewer?
2. What does YAML become?
3. Why is it useful for network/infrastructure diagrams?
4. Where can I try the live demo?

Package layout, dependency direction, build commands, and release gates stay in
the README, but they should no longer be the first impression.

### "Why TopoViewer?" content model

The section should make sharp claims that are already supported by the project:

- topology as data, not hand-drawn screenshots;
- selector stylesheets for repeatable visual rules;
- embeddable diagrams for docs;
- attention controls for large or dense networks;
- TypeScript runtime for product embedding;
- testable examples and exportable assets.

Avoid claims that require future integrations unless clearly marked as roadmap.

### Integration roadmap spec gate

The public integration roadmap must be derived from the standalone integration
roadmap changes:

- `openspec/changes/define-netbox-integration-roadmap/`
- `openspec/changes/define-opsmill-infrahub-integration-roadmap/`
- `openspec/changes/define-grafana-integration-roadmap/`
- `openspec/changes/define-vscode-integration-roadmap/`

Do not publish roadmap wording that claims support, timelines, or priority until
the corresponding standalone change states the likely integration shape, primary
use cases, risks, and wording constraints.

The standalone integration changes should cover:

- NetBox in-platform plugin for inventory-driven diagram views and optional
  YAML export.
- OpsMill/Infrahub in-platform extension or artifact workflow for graph-native
  intended-state views and branch/diff-driven diagrams.
- Grafana panel or embeddable runtime feasibility for operational dashboards.
- VS Code authoring preview, schema validation, semantic lint, and example
  workflow.

Use explicit public status labels:

- **Supported**: MkDocs fenced-block plugin and React/TypeScript package.
- **Feasibility**: NetBox and OpsMill/Infrahub in-platform integration
  until plugin, extension, or artifact prototypes exist.
- **Planned**: VS Code preview and authoring support after authoring contracts
  stabilize.
- **Exploratory**: any item that lacks a concrete implementation direction.

This prevents roadmap docs from reading like released functionality.

### Testing and acceptance

At minimum, implementation should verify:

- generated docs build strictly;
- README links resolve locally where possible;
- demo examples render in Playwright;
- demo page contains live viewport, topology YAML, and stylesheet YAML;
- public MkDocs and Zensical pages do not expose `expected.yaml`;
- generated screenshot, if added, can be refreshed or is documented as derived
  from a named example.

Visual quality should be reviewed through local MkDocs preview, not only through
Markdown diffs.
