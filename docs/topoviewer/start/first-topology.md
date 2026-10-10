# First Topology

Build a local documentation page with two routers, `R01` and `R02`, and one
Ethernet link. Then change its styling, validate the files, and export the site.
You need Python 3.9 or newer and a terminal; no TopoViewer repository checkout
or Node.js installation is needed for this first page.

For visual authoring instead, open the hosted
[Studio First Project walkthrough](../author/studio/first-project.md).
React application developers can use the [React integration](../examples/use-cases/react.md).

This is the result you will build. Toggle **Physical** to hide and show the two routers and their link:

<!-- docs-check: viewport first-topology -->
```topoviewer
topology: examples/graph/basic/topology.yaml
stylesheet: examples/graph/basic/stylesheet.yaml
height: 420px
controls: true
controlsOpen: false
title: Two routers
```


## Create A Documentation Project

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install mkdocs-topoviewer==0.5.0
mkdocs new router-docs
cd router-docs
mkdir docs/diagrams
```

On Windows, use `py -m venv .venv` and `.venv\Scripts\activate` in Command Prompt
instead of the first two commands.

Replace `mkdocs.yml` with:

```yaml
site_name: Router docs
plugins:
  - search
  - topoviewer
```

Your project will contain:

```text
router-docs/
  mkdocs.yml
  docs/
    index.md
    diagrams/
      topology.yaml
      stylesheet.yaml
```

## Save The Two Source Files

Save this as **docs/diagrams/topology.yaml**. The IDs identify objects; labels
classify them. Every object belongs to the `physical` layer so that it appears
when that layer is selected. The `showEdgeLabels` toggle starts enabled so the
link's label is visible.

<!-- docs-check: topology first-topology -->
```yaml
--8<-- "docs/topoviewer/examples/graph/basic/topology.yaml"
```

Save this as **docs/diagrams/stylesheet.yaml**. It supplies manual layout,
router icons, and styling rules. The final rule gives the Cisco router its own
body color without changing its topology facts.

<!-- docs-check: stylesheet first-topology -->
```yaml
--8<-- "docs/topoviewer/examples/graph/basic/stylesheet.yaml"
```

The [Authoring Model](../author/authoring-model.md) explains which fields belong
in each file. Keep the two files separate as you work through this tutorial.

## Render Your Page

Replace **docs/index.md** with:

````markdown
# My first topology

```topoviewer
topology: diagrams/topology.yaml
stylesheet: diagrams/stylesheet.yaml
height: 420px
controls: true
title: Two routers
```
````

Run from the directory containing `mkdocs.yml`:

```bash
mkdocs serve
```

Open the local address printed by MkDocs, normally `http://127.0.0.1:8000/`.
You should see **R01**, **R02**, and a link labeled **R01 to R02 Ethernet**, with router glyphs
and a different body color for R02. Toggle **Physical** off and on in the viewer
controls: both routers and the link should disappear and return together.


If the viewport is blank, first check the visible diagnostic, the relative file
paths, and whether **Physical** is selected. See [Debug Rendering](../author/debug-rendering.md)
for specific checks.

Continue with [Style Your First Topology](style-your-first-topology.md), using
these same files. After styling, [validate them](../author/validate-yaml.md),
then [export the site and source](export-your-first-topology.md).
