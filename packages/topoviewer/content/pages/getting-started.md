# First Topology

Start with one topology YAML file and one stylesheet YAML file. The topology
describes what exists; the stylesheet describes how it should look.

## Topology YAML

```yaml
graph:
  id: first-topology
  layers:
    - id: physical
      name: Physical
  nodes:
    - id: PE1
      name: PE1
      labels:
        role: pe
      layers: [physical]
      position: [160, 160]
    - id: P1
      name: P1
      labels:
        role: p
      layers: [physical]
      position: [420, 160]
  links:
    - id: PE1-P1
      source: PE1
      target: P1
      layers: [physical]
```

## Stylesheet YAML

```yaml
layout:
  mode: manual
  width: 600
  height: 320
labelFields:
  - name
stylesheet:
  - selector: node
    style:
      shape: rectangle
      width: 84
      height: 60
      borderWidth: 3
      labelFontWeight: 800
  - selector: link
    style:
      curveStyle: straight
      lineColor: "#42a5f5"
      lineWidth: 3
      targetArrowShape: none
```

## Live Output

```topoviewer
topology: examples/graph/basic/topology.yaml
stylesheet: examples/graph/basic/stylesheet.yaml
height: 420px
controls: true
controlsOpen: false
title: First topology
```

## Validate Locally

Run the same validation that CI uses:

```bash
npm run validate:schemas
npm run validate:semantics
```

When a viewport is blank, keep the last valid YAML, check diagnostics first, and
then verify file paths, selectors, and layer visibility.

Next: [Style a topology](style-a-topology.md) or open the
[browser harness](browser-harness.md).
