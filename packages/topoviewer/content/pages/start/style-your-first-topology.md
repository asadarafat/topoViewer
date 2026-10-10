# Style Your First Topology

Continue with the `R01`/`R02` project from [First Topology](first-topology.md).
Keep `topology.yaml` unchanged. You will make the Cisco router purple and give
the Ethernet link a dashed stroke.

## Match Facts That Exist

The topology already contains the facts needed by these selectors:

| Selector | Matching object | Visible change |
|---|---|---|
| `node[labels.vendor = "cisco"]` | R02 | Purple rounded body and a thicker border. |
| `link[labels.protocol = "ethernet"]` | R01–R02 | Dashed purple link. |

In **docs/diagrams/stylesheet.yaml**, replace the existing Cisco rule with:

<!-- docs-check: style-edit styled-topology -->
```yaml
- selector: node[labels.vendor = "cisco"]
  style:
    shape: roundRectangle
    backgroundColor: "color-mix(in srgb, #8b78b8 12%, var(--topoviewer-panel-bg))"
    borderColor: "var(--topoviewer-accent)"
    borderWidth: 4
```

Append this rule to the same `stylesheet:` list:

<!-- docs-check: style-edit styled-topology -->
```yaml
- selector: link[labels.protocol = "ethernet"]
  style:
    lineStyle: dashed
    lineDashPattern: 7 7
    lineColor: "#8b78b8"
    lineWidth: 3
```

These two blocks are list fragments. Preserve the file's existing `layout`,
`icons`, `labelFields`, and broad `node`/`link` rules. The following complete
file is equivalent if you prefer to replace the whole stylesheet.

## Complete Styled File

The topology is the original [topology.yaml](../examples/graph/basic/topology.yaml).

<!-- docs-check: topology styled-topology -->
```yaml
--8<-- "docs/topoviewer/examples/graph/basic/topology.yaml"
```

**docs/diagrams/stylesheet.yaml**:

<!-- docs-check: stylesheet styled-topology -->
```yaml
--8<-- "docs/topoviewer/examples/graph/basic/stylesheet-tutorial.yaml"
```

With `mkdocs serve` still running, reload the page after saving the stylesheet.
R01 should retain its previous styling; R02 should be purple and rounded. The
link should use a dashed purple stroke. Its **R01 to R02 Ethernet** label still
comes from `labels.name`, selected by `labelFields`. The IDs, positions, and
connectivity have not changed.

<!-- docs-check: viewport styled-topology -->
```topoviewer
topology: examples/graph/basic/topology.yaml
stylesheet: examples/graph/basic/stylesheet-tutorial.yaml
height: 420px
controls: true
controlsOpen: false
title: Styled routers
```

## Explain Or Debug A Rule

A selector only matches facts present on an object. Changing `cisco` to `juniper`
in this example matches nothing. To create a reusable role-based style, first
add that role under the intended nodes' `labels` in topology YAML.

Broad object-kind rules provide defaults. More specific label/data rules
replace those values on matching objects; exact-ID rules take precedence over
both. Equal-specificity rules use source order. See
[Stylesheet recipes](../reference/topoviewer-stylesheet.md) for the cascade and
[Style keys](../reference/stylesheet-reference.md) for values and constraints.

[Validate your files](../author/validate-yaml.md) before
[exporting the site and source](export-your-first-topology.md).
