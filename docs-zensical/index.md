---
icon: lucide/network
---

# TopoViewer Zensical Preview

This site is the parallel Zensical documentation target for TopoViewer. The
MkDocs documentation remains the canonical source, and this build mirrors the
same TopoViewer pages through a generated Zensical adapter.

The first integration target is intentionally adapter-only:

- TopoViewer assets are loaded with Zensical `extra_css` and `extra_javascript`.
- MkDocs `topoviewer` fences are generated into `.topoviewer-embed` HTML containers.
- A small adapter remounts embeds after Zensical instant navigation events.
- Local Zensical preview runs at `http://127.0.0.1:8002/topoViewer/zensical/` by default.
- The published output is deployed beside MkDocs under `/topoViewer/zensical/`.

[Open the mirrored TopoViewer docs](topoviewer/index.md) or the
[Zensical adapter example](examples/topoviewer.md).
