# First Project

**Support status:** Beta Preview

Run Studio with `npm run studio:dev`, then use this short workflow to create a
portable two-node topology.

## Create The Graph

1. Open **Topo** and drag **Router** from the **Nodes** palette family onto the
   canvas twice.
2. Select the first node, then add the second node to the selection with
   `Ctrl+click` or `Cmd+click`.
3. Press `L`, or activate **Link** and connect the two endpoints.
4. Select a node. Studio opens **Edit > Visual**; change its **Name** under
   Topology.
5. Under Appearance, change Shape to `roundRectangle` for that selected node.

The header status reports persistence and validation state while Studio
autosaves the browser project.

## Confirm The Source

Open **Edit**, switch from **Visual** to **Code**, and inspect `topology.yaml`.
It contains two stable node IDs and one link ID. Choose `stylesheet.yaml` and
inspect the exact-ID selector created by Visual. Choose **Apply** in the footer
to commit the candidate stylesheet.

The YAML is authoritative. Visual controls and Code edit one candidate
stylesheet; the canvas previews its latest valid projection, and Apply commits
it as one undoable source change. Topology and stylesheet YAML belong to
**Edit > Code**; mapper YAML belongs to **Mapper > Code**.

## Export The Project

Open **Project menu**, open the current project's action menu, and choose
**Export archive**. The `.tvstudio` archive contains the canonical source
documents, project metadata, and local assets. It can be imported into another
browser Studio project without changing graph identity.

Use **Open export panel** for destination artifacts:

- PNG or SVG for reports;
- a MkDocs or static HTML snippet referencing canonical files;
- a Grafana mounted bundle after its first mapper rule creates `mapper.yaml`.

Do not treat an image export as the source. Keep the YAML project in version
control and regenerate images from it.
