# Architecture

TopoViewer is a schema-driven renderer. The core contract is that authored
topology facts and visual policy flow through validation and compilation before
React Flow ever receives renderable nodes and edges.

## Runtime Flow

| Step | Input | Responsible module | Output | Public contract |
|---|---|---|---|---|
| Author | `*.topo.tv.yaml`, `*.style.tv.yaml`, optional attention and mapper YAML | User, Studio, converter, or host app | YAML documents | Public authored contract |
| Parse | YAML text | Parser helpers | JavaScript objects plus parse diagnostics | Public diagnostics shape where documented |
| Validate | Parsed documents | JSON Schema and semantic lint | Validated document or actionable diagnostics | Public schema contract |
| Compile | Graph, stylesheet, defaults, theme variables, runtime state | TopoViewer compiler | Semantic render model | Advanced public helpers where exported |
| Resolve style | Stylesheet rules, labels, data, defaults, state overlays | Style metadata and selector resolver | Effective style per object | Public style key contract |
| Layout | Manual positions or layout directive | Layout helpers | Positioned graph objects | Public layout options where documented |
| Render | Compiled graph model | React runtime on top of React Flow | Interactive diagram | Public React component contract |
| Integrate | Docs embeds, Studio, Grafana, host apps | Surface adapters | Surface-specific UI and persistence | Per-surface support status |

## Component Boundaries

| Area | Owns | Must not own |
|---|---|---|
| Schema and validation | Document shape, accepted values, semantic diagnostics, renderer limits | Host authentication, inventory truth, telemetry collection |
| Compiler | Normalizing topology, stylesheet, defaults, attention, overlays, render model | DOM access, browser storage, Grafana APIs |
| Style metadata | Default values, style key types, accepted enums, docs/YAML assist alignment | Host theme decisions beyond exposed CSS variables |
| React runtime | Rendering, selection, pan/zoom, object events, visual diagnostics | Persisting source files, reading mounted bundles |
| Docs embeds | Loading static YAML assets, rendering live viewport examples | Editing source files or mutating diagrams |
| TopoViewer Studio | Authoring workflow, local persistence, bundle export, YAML assist | Production observability, source-of-truth inventory |
| Grafana plugin | Mounted bundle discovery, Prometheus data mapping, runtime overlays | Editing source YAML in place, production Grafana security policy |
| Labs | Reproducible local demos with disposable settings | Production deployment defaults |

## Repository Ownership And Dependency Direction

The repository coordinates one reusable runtime, two application adapters, one
Python adapter, and local deployment proof. Sharing a repository does not make
their private source trees shared APIs.

| Repository-local area | Distribution boundary | Allowed dependency |
|---|---|---|
| `packages/topoviewer` | Public npm package | React, React DOM, React Flow peers and renderer dependencies |
| `packages/topoviewer-studio` | Private Browser/VS Code authoring application | Documented `topoviewer` package entries and host-neutral Studio contracts |
| `packages/vscode-topoviewer` | Private/experimental application package | Public `topoviewer` exports and `topoviewer/integration` |
| `packages/grafana-topoviewer-panel` | Private/experimental Grafana plugin package | Public `topoviewer` exports plus Grafana SDK/runtime |
| `packages/mkdocs-topoviewer` | Public PyPI package | Vendored files produced by the TopoViewer embed build |
| `labs/grafana-topoviewer/containerlab` | Disposable lab | Built Grafana plugin, mounted YAML bundle, and pinned lab containers |

The allowed flow is one way:

```text
topoviewer public API ----------------> React hosts
        |-----------------------------> TopoViewer Studio
        |-----------------------------> Grafana panel
        +-- built embed assets --------> mkdocs-topoviewer

TopoViewer Studio app/host contracts -> VS Code host

built Grafana plugin + YAML bundle ---> Containerlab or external lab
```

Application packages must not import files under another package's `src/`
tree. Studio and its VS Code host resolve public package exports in normal
development and build workflows. An isolated packed-core lane proves those
consumers do not depend on workspace source resolution.

## Public And Internal Module Boundary

| Module family | Status | Rule |
|---|---|---|
| `topoviewer` package exports from `src/index.ts` | Public | Changes require API report review and SemVer/migration notes. |
| JSON Schemas under `packages/topoviewer/schemas` | Public | Schema changes require docs, examples, and compatibility review. |
| Style defaults and style metadata | Public contract source | Runtime, docs, schema, and YAML assist must stay aligned. |
| Example YAML under `packages/topoviewer/content/examples` | Public examples | Examples are documentation and regression inputs. |
| Docs projections under `docs/**` | Generated public output | Edit canonical content, not projections. |
| Browser Studio product | Beta Preview | Use the deployed browser application and portable project bundles; do not import its internal React feature modules. |
| Studio feature internals | Internal | Import only the documented Studio app and host contracts inside repository-owned hosts. Use core package APIs and portable bundles for consumers. |
| Grafana plugin backend resource API | Experimental | Dashboard migration notes are required when options change. |
| Lab scripts and Containerlab files | Lab | Local demo automation only; not a production API. |

## Data Flow By Surface

| Surface | Source loading | Runtime state | Persistence expectation |
|---|---|---|---|
| React | Host passes parsed or loaded document data to `TopoViewer`. | Selection, viewport, attention, and host callbacks. | Host-owned. |
| MkDocs | Static YAML assets are referenced from fenced `topoviewer` blocks. | Viewport controls and local page state. | Documentation page only. |
| Zensical | Synced docs content is adapted into static TopoViewer embeds. | Same renderer contract as MkDocs. | Documentation page only. |
| TopoViewer Studio | User edits topology, stylesheet, and mapper YAML as one project. | Draft/applied documents, diagnostics, visual canvas, IndexedDB projects, and exports. | Browser storage or VS Code workspace plus exported files. |
| Grafana | Backend discovers mounted bundle files and frontend receives YAML through plugin resources. | Prometheus data frames map into runtime overlays. | Grafana dashboard options plus mounted files; source YAML is not mutated by telemetry. |

## Deployment And External Repository Boundary

TopoViewer does not read sibling repositories at runtime. An external
Containerlab or telemetry repository consumes a built Grafana plugin artifact
and copied/mounted TopoViewer YAML files. Repository-relative development paths
may exist inside this repository's local lab, but they must not appear in an
upstream contribution or production deployment.

The local Containerlab profile is intentionally disposable. It may enable an
unsigned plugin, anonymous Grafana access, demo credentials, and directly
published host ports. Those defaults prove integration; they are not production
configuration. Production operators own authenticated Grafana access, ingress,
TLS, secret delivery, plugin signing and provenance, telemetry retention, and
network isolation.

## Security Ownership

| Boundary | Security owner |
|---|---|
| Parsed topology, stylesheet, and mapper inputs | TopoViewer schema, semantic validation, sanitization, and renderer limits |
| React application data loading and persistence | Host application |
| TopoViewer Studio local drafts | Browser Studio host and IndexedDB; no multi-user trust boundary |
| VS Code file access | VS Code extension host and workspace permissions |
| MkDocs static assets | MkDocs build and hosting pipeline |
| Grafana mounted files | Grafana plugin backend root allowlist and deployment filesystem policy |
| Grafana users, organizations, and data sources | Grafana deployment operator |
| Container images, ports, credentials, and traffic | Lab or production deployment operator |

## Failure Boundaries

| Failure | Expected behavior |
|---|---|
| YAML parse error | Keep the last valid applied render where the surface supports drafts; show line-aware diagnostics where possible. |
| Schema or semantic error | Block rendering or overlays for the invalid document and show actionable diagnostics. |
| Unsupported style key | Warn or fail according to schema/lint surface; do not silently invent behavior. |
| Unsafe SVG or HTML-like content | Sanitize, strip, or reject according to the threat model. |
| Renderer limit exceeded | Fail before freezing the browser or Grafana panel. |
| Missing telemetry | Render topology without overlays and show mapper/no-data diagnostics. |
| Ambiguous mapper target | Do not apply a guessed overlay; report coverage diagnostics. |

## Review Links
