A compact **2-spine, 4-leaf CLOS** fixture using `layout.mode: clos`.

- 2 spine nodes
- 4 leaf nodes
- 8 full-mesh fabric links (each leaf to both spines)
- no manual node positions
- no `stageKey` or `inferLabelRole`
- stages are inferred from directed `source` -> `target` fabric links
- `labels.node` only drives styling, icons, and outlines

Use this fixture as the smallest practical automatic-layout example. If a real
topology uses undirected or mixed-direction links, add a dedicated stage field
and reference it with `layout.clos.stageKey`.
