# Architecture Overview

TopoViewer is a schema-driven renderer. The core contract is that authored
topology facts and visual policy flow through validation and compilation before
React Flow ever receives renderable nodes and edges.

## Runtime Flow

| Step | Input | Responsible module | Output | Public contract |
|---|---|---|---|---|
| Author | `*.topo.tv.yaml`, `*.style.tv.yaml`, optional attention and mapper YAML | User, harness, docs, host app | YAML documents | Public authored contract |
| Parse | YAML text | Parser helpers | JavaScript objects plus parse diagnostics | Public diagnostics shape where documented |
| Validate | Parsed documents | JSON Schema and semantic lint | Validated document or actionable diagnostics | Public schema contract |
| Compile | Graph, stylesheet, defaults, theme variables, runtime state | TopoViewer compiler | Semantic render model | Advanced public helpers where exported |
| Resolve style | Stylesheet rules, labels, data, defaults, state overlays | Style metadata and selector resolver | Effective style per object | Public style key contract |
| Layout | Manual positions or layout directive | Layout helpers | Positioned graph objects | Public layout options where documented |
| Render | Compiled graph model | React runtime on top of React Flow | Interactive diagram | Public React component contract |
| Integrate | Docs embeds, harness, Grafana, host apps | Surface adapters | Surface-specific UI and persistence | Per-surface support status |

## Component Boundaries

| Area | Owns | Must not own |
|---|---|---|
| Schema and validation | Document shape, accepted values, semantic diagnostics, renderer limits | Host authentication, inventory truth, telemetry collection |
| Compiler | Normalizing topology, stylesheet, defaults, attention, overlays, render model | DOM access, browser storage, Grafana APIs |
| Style metadata | Default values, style key types, accepted enums, docs/YAML assist alignment | Host theme decisions beyond exposed CSS variables |
| React runtime | Rendering, selection, pan/zoom, object events, visual diagnostics | Persisting source files, reading mounted bundles |
| Docs embeds | Loading static YAML assets, rendering live viewport examples | Editing source files or mutating diagrams |
| Browser harness | Authoring workflow, local persistence, bundle export, YAML assist | Production observability, source-of-truth inventory |
| Grafana plugin | Mounted bundle discovery, Prometheus data mapping, runtime overlays | Editing source YAML in place, production Grafana security policy |
| Labs | Reproducible local demos with disposable settings | Production deployment defaults |

## Public And Internal Module Boundary

| Module family | Status | Rule |
|---|---|---|
| `topoviewer` package exports from `src/index.ts` | Public | Changes require API report review and SemVer/migration notes. |
| JSON Schemas under `packages/topoviewer/schemas` | Public | Schema changes require docs, examples, and compatibility review. |
| Style defaults and style metadata | Public contract source | Runtime, docs, schema, and YAML assist must stay aligned. |
| Example YAML under `packages/topoviewer/content/examples` | Public examples | Examples are documentation and regression inputs. |
| Docs projections under `docs/**` and `packages/topoviewer/docs/**` | Generated public output | Edit canonical content, not projections. |
| Harness implementation files | Internal/experimental | Do not import from products. Use exported package APIs and generated bundles. |
| Grafana plugin backend resource API | Experimental | Dashboard migration notes are required when options change. |
| Lab scripts and Containerlab files | Lab | Local demo automation only; not a production API. |

## Data Flow By Surface

| Surface | Source loading | Runtime state | Persistence expectation |
|---|---|---|---|
| React | Host passes parsed or loaded document data to `TopoViewer`. | Selection, viewport, attention, and host callbacks. | Host-owned. |
| MkDocs | Static YAML assets are referenced from fenced `topoviewer` blocks. | Viewport controls and local page state. | Documentation page only. |
| Zensical | Synced docs content is adapted into static TopoViewer embeds. | Same renderer contract as MkDocs. | Documentation page only. |
| Browser harness | User edits topology, stylesheet, and mapper YAML as one bundle. | Draft/applied documents, diagnostics, local preview, local storage. | Browser local storage and exported files. |
| Grafana | Backend discovers mounted bundle files and frontend receives YAML through plugin resources. | Prometheus data frames map into runtime overlays. | Grafana dashboard options plus mounted files; source YAML is not mutated by telemetry. |

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

- [Object attributes](object-reference.md): authored YAML, style, attention, and mapper fields.
- [Compatibility](compatibility.md): public API and schema stability rules.
- [Threat model](threat-model.md): untrusted inputs and mitigations.
- [Design review checklist](design-review-checklist.md): required review before adding public surface.
