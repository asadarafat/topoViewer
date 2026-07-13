# First Project

**Support status:** Experimental

Run Studio with `npm run studio:dev`, then use this short workflow to create a
portable two-node topology.

## Create The Graph

1. Open **Topo** and drag **Router** from the **Nodes** palette family onto the
   canvas twice.
2. Select the first node, then add the second node to the selection with
   `Ctrl+click` or `Cmd+click`.
3. Press `L`, or activate **Link** and connect the two endpoints.
4. Select a node, open **Object**, and change **Name**.
5. Open **Style**, choose the **Bypass** Shape cell, and change Shape to
   `roundRectangle` for that selected node.

The footer reports the current host and source document. The header status
reports persistence and validation state while Studio autosaves the browser
project.

## Confirm The Source

Open **Workspace drawer** and inspect `topology.yaml`. It contains two stable
node IDs and one link ID. Inspect `stylesheet.yaml` to see the scoped style
change created by the Style workspace.

The YAML is authoritative. The canvas and workspaces are
structured editing views over that source, not a second private document
format.

## Export The Project

Open **Project menu** and choose **Export archive**. The `.tvstudio` archive
contains the canonical source documents, project metadata, and local assets.
It can be imported into another browser Studio project without changing graph
identity.

Use **Open export panel** for destination artifacts:

- PNG or SVG for reports;
- a MkDocs or static HTML snippet referencing canonical files;
- a Grafana mounted bundle after `mapper.yaml` is enabled.

Do not treat an image export as the source. Keep the YAML project in version
control and regenerate images from it.
