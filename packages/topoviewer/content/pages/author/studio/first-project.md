# First Project

**Support status:** Beta Preview

Run Studio with `npm run studio:dev`, then use this short workflow to create a
portable two-node topology.

## Create The Graph

1. Open **Object drawer** in project source and drag **Router** from the
   **Nodes** family onto the preview twice.
2. Select the first node, then add the second node to the selection with
   `Ctrl+click` or `Cmd+click`.
3. Press `L`, or activate **Link** and connect the two endpoints.
4. Select a node. Studio opens preview-local **Properties**; change its
   **Visible label** under Topology.
5. Under Appearance, change Shape to `roundRectangle` for that selected node.

The header reports persistence and validation state. Choose **Save project**
when it reports **Modified**.

## Confirm The Source

Keep **Split** active and select `topology.yaml` in project source. The shared
editor contains two stable node IDs and one link ID. Select `stylesheet.yaml`
and inspect the exact-ID selector created by Properties. Choose **Apply** in
the source footer to commit the candidate stylesheet.

The YAML is authoritative. Properties and the shared source editor modify one
candidate stylesheet; preview renders its latest valid projection, and Apply
commits it as one undoable source change. Topology, stylesheet, and optional
mapper YAML all use the same source workspace rather than separate Code panels.

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
