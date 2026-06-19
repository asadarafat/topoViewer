---
icon: lucide/share-2
---

# TopoViewer Embed

This page renders a TopoViewer diagram inside Zensical using the same static
browser embed bundle that powers the MkDocs integration.

<figure class="topoviewer-figure" style="--topoviewer-width: 100%;">
  <figcaption class="topoviewer-title">Zensical TopoViewer embed</figcaption>
  <div
    class="topoviewer-embed"
    data-topology="../../assets/topoviewer/examples/graph/basic/topology.yaml"
    data-stylesheet="../../assets/topoviewer/examples/graph/basic/stylesheet.yaml"
    data-controls="true"
    data-controls-open="false"
    style="height: 420px"
  ></div>
</figure>

The embed remains data-driven. Zensical only loads the CSS, JavaScript, and YAML
files; the TopoViewer bundle validates the diagram and mounts the React viewer.
