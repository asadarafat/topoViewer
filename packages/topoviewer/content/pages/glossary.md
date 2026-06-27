# Glossary

| Term | Meaning |
|---|---|
| Topology | A declarative model of graph objects and diagram objects. |
| Topology as Code | Keeping diagram intent in reviewable YAML rather than static drawings. |
| Graph | Semantic nodes, links, paths, regions, and layers under `graph.*`. |
| Diagram | Visual-only shapes, callouts, pins, and connectors under `diagram.*`. |
| Node | A graph object with identity, labels, data, layers, and optional position. |
| Link | A direct graph edge between a source node and target node. |
| Path | A logical route or service path that may span multiple nodes and links. |
| Region | A hull around member nodes used for sites, domains, racks, pods, or groups. |
| Layer | A visibility group that lets one topology render multiple views. |
| Label | A selector-friendly classification field. |
| Data | Inspectable facts such as metrics, severity, inventory IDs, or ownership. |
| Stylesheet | Ordered selector rules that turn topology facts into visual presentation. |
| Attention | Focus, dimming, aggregation, and label-priority behavior for dense graphs. |
| Aggregate | A collapsed or summarized representation of many graph objects. |
| Harness | Browser-based authoring surface for editing, validating, rendering, and exporting YAML. |
| Adapter | Integration layer that embeds TopoViewer in another documentation or product surface. |
| Schema | Machine-readable contract for YAML shape and accepted values. |
| Diagnostic | Validation or lint issue with severity, code, document, and line information. |
| Render parity | The same YAML rendering consistently across harness, MkDocs, Zensical, and React. |
