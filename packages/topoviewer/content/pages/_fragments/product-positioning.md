TopoViewer turns `topology.yaml` + `stylesheet.yaml` into interactive,
embeddable, schema-validated topology diagrams for infrastructure docs,
internal portals, and ops dashboards.

It is a **Topology as Code** toolkit for teams that want network,
infrastructure, service, and other connected-system diagrams to stay close to
source data.

Topology here means a diagram or graph made of meaningful objects and
relationships: nodes, links, paths, regions, layers, labels, data, and attention
rules. TopoViewer keeps those facts in declarative YAML and keeps presentation
policy in selector-based stylesheets, then renders both through an embeddable
TypeScript/React runtime.

TopoViewer is not a generic Mermaid.js replacement. Mermaid is broad
text-to-diagram syntax for many diagram families. TopoViewer is narrower and
more semantic: it is built for inspectable, data-driven topology views where
layers, regions, paths, operational metadata, focus behavior, and reusable
runtime APIs matter.
