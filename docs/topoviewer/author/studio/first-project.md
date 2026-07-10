# First Project

**Support status:** Experimental

Run Studio with `npm run studio:dev`, then use this short workflow to create a
portable two-node topology.

## Create The Graph

1. Drag **Node** from the Object palette onto the canvas twice.
2. Select the first node, then add the second node to the selection with
   `Ctrl+click` or `Cmd+click`.
3. Choose **Connect selected nodes** from the canvas toolbar.
4. Select a node and change **Name** in the Inspector.
5. In the Basic style profile, change **Shape** to `roundRectangle`.
6. Select **Save project**.

The footer reports the current host and source document. The header status
moves from `Saved` to `Modified` after the first edit, then returns to `Saved`
after an explicit save.

## Confirm The Source

Open **Workspace drawer** and inspect `topology.yaml`. It contains two stable
node IDs and one link ID. Inspect `stylesheet.yaml` to see the scoped style
change created by the Inspector.

The YAML is authoritative. The canvas and Inspector are structured editing
views over that source, not a second private document format.

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
