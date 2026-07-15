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
5. Open **Style**, keep **Basic** selected, and change Shape to
   `roundRectangle` for that selected node.

The footer reports the current host and source document. The header status
reports persistence and validation state while Studio autosaves the browser
project.

## Confirm The Source

Open **Workspace drawer** and inspect `topology.yaml`. It contains two stable
node IDs and one link ID. Return to **Style**, switch to **YAML**, and inspect
the exact-ID selector created by Basic. Choose **Apply** in the Style footer to
commit the candidate stylesheet.

The YAML is authoritative. Basic and YAML edit one candidate stylesheet; the
canvas previews its latest valid projection, and Apply commits it as one
undoable source change.

## Export The Project

Open **Project menu** and choose **Export archive**. The `.tvstudio` archive
contains the canonical source documents, project metadata, and local assets.
It can be imported into another browser Studio project without changing graph
identity.

Use **Open export panel** for destination artifacts:

- PNG or SVG for reports;
- a MkDocs or static HTML snippet referencing canonical files;
- a Grafana mounted bundle after its first mapper rule creates `mapper.yaml`.

Do not treat an image export as the source. Keep the YAML project in version
control and regenerate images from it.
