Directional link strokes model two operational directions on one physical link.
Use them when one adjacency has independent telemetry for each direction and
duplicate links would misrepresent the topology.

The parent link still owns the stable topology identity and any endpoint port
labels. Each `linkDirection` inherits the parent link style, then applies
direction-specific overrides such as line color, arrow marker, dash pattern,
and direction label.

Use direction labels for vector values such as bandwidth or packet rate. Use
`sourceLabel` and `targetLabel` for physical ports. TopoViewer keeps arrows as
marker geometry and places endpoint, center, and direction labels with a shared
label placement pass so dense operational diagrams remain inspectable.
