# Build Or Adopt?

TopoViewer is worth adopting only if it removes work that would otherwise
compound across products, docs, authoring tools, and operational dashboards.
If all you need is one static diagram, use a simpler drawing or diagramming
tool. If topology data must stay semantic and reusable, TopoViewer becomes more
interesting.

## What You Would Need To Build Internally

| Capability | Hidden cost |
|---|---|
| YAML topology model | Schema versioning, validation, migrations, examples, and docs for every field. |
| Selector stylesheet | Style key defaults, accepted values, object matching, conflict behavior, docs, and editor assist. |
| React renderer | Node/edge geometry, labels, icons, paths, regions, attention, interaction, diagnostics, and host callbacks. |
| Docs embeds | Static asset loading, fenced-block syntax, MkDocs/Zensical build behavior, hydration, screenshots, and parity checks. |
| Authoring harness | Monaco editing, YAML assist, validation, local drafts, apply/revert, export, object picking, and mapper authoring. |
| Telemetry mapper | Prometheus query output mapping, object identity, ambiguous matches, runtime overlays, coverage diagnostics, and no-data behavior. |
| Security posture | SVG sanitization, hostile content tests, mounted file safety, dependency triage, artifact autopsy, and lab warnings. |
| Compatibility discipline | API reports, schema drift checks, generated references, SemVer policy, migration notes, and release gates. |

## Where TopoViewer Has Leverage

| Need | Leverage |
|---|---|
| One model, many surfaces | The same topology and stylesheet can render in React, MkDocs, Zensical, the harness, and Grafana. |
| Visual policy reuse | Stylesheets target labels, data, object kinds, state, and telemetry overlays instead of repeating styles per object. |
| Developer confidence | Schemas, generated object reference, example catalog, docs lint, and CI gates reduce silent drift. |
| Operational dashboards | Mapper YAML binds Prometheus data to topology objects without mutating source topology/style YAML. |
| Dense environments | Layers, regions, paths, labels, attention, and layout directives are graph concepts, not drawing afterthoughts. |

## When Not To Use TopoViewer

- You need a one-off illustration with no reusable data model.
- Your team does not want YAML, schemas, or code review for diagrams.
- You need a fully hosted SaaS diagram editor rather than an embeddable library.
- Your production requirement depends on a Roadmap or Lab surface today.
- You need accessibility guarantees beyond the documented current posture.

## Adoption Test

TopoViewer is a fit when all of these are true:

1. The diagram objects have stable identities.
2. The same topology should appear in more than one surface.
3. Visual policy should be reusable across objects or environments.
4. Validation and reviewability matter more than freeform drawing speed.
5. The team can accept the documented support status for the chosen surface.

## Next Steps

- [Why TopoViewer](why-topoviewer.md): product positioning and comparisons.
- [Getting started](getting-started.md): render the first topology.
- [Object attributes](object-reference.md): inspect the authored model.
- [Architecture overview](architecture.md): understand runtime boundaries.
