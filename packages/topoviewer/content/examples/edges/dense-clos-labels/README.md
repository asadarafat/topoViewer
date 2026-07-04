Dense CLOS labels show the label-placement problem that appears in operational
fabric dashboards: region names, node names, node metadata, endpoint port
labels, and bidirectional bandwidth values all want space around the same small
set of links.

The topology keeps one parent link per fabric adjacency. Physical port names
live on `sourceLabel` and `targetLabel`; bandwidth values live on
`directions.sourceToTarget.label` and `directions.targetToSource.label`. The
stylesheet assigns independent label z-index values and uses the shared
collision policy so labels can move without changing node or link geometry.
