# Style A Topology

TopoViewer styles are declarative rules. A rule has a selector and a style map.
Selectors match semantic facts in YAML, so the same topology can be rendered for
documentation, operations, or product UI without changing the graph.

## Select By Object Kind

```yaml
stylesheet:
  - selector: node
    style:
      shape: rectangle
      width: 96
      height: 56
  - selector: link
    style:
      curveStyle: straight
      lineWidth: 3
```

Use broad selectors for defaults. Put the common shape, label, icon, and line
contract there so every diagram starts from the same visual baseline.

## Select By Labels

```yaml
stylesheet:
  - selector: node[labels.role = "spine"]
    style:
      borderColor: "#9c27b0"
      outlineColor: "#ba68c8"
      outlineWidth: 4
  - selector: link[labels.protocol = "bgp"]
    style:
      lineStyle: dashed
      lineDashPattern: 7 7
      lineColor: "#9c27b0"
```

Use `labels` for classification. Labels should be stable words such as
`role`, `tier`, `protocol`, `tenant`, or `service`.

## Select By Data

```yaml
stylesheet:
  - selector: node[data.severity = "major"]
    style:
      statusColor: "#ff9800"
      outlineColor: "#ff9800"
      outlineWidth: 5
```

Use `data` for facts that tools may inspect: counters, severity, delay,
traffic, inventory IDs, or ownership. Avoid using data fields only as visual
class names.

## Keep Styles Reusable

- Put topology facts in `graph.*`.
- Put visual choices in `stylesheet`.
- Prefer labels over object IDs for reusable rules.
- Keep shape dimensions intentional: `rectangle` can be non-square, while
  `square` and `circle` require equal width and height.
- Use canonical camelCase keys everywhere.

## Next Steps

- [Stylesheet reference](stylesheet.md): all supported keys, accepted values, defaults, and examples.
- [Nodes reference](reference/nodes/index.md): node shapes, labels, badges, icons, and status markers.
- [Edges reference](reference/edges/index.md): link styling, labels, arrows, and directional lanes.
