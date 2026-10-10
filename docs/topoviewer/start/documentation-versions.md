# Documentation versions

The primary documentation is [MkDocs](https://asadarafat.github.io/topoviewer/docs/mkdocs/).
[Zensical](https://asadarafat.github.io/topoviewer/docs/zensical/) presents the same
content to verify the supported static adapter. It is an alternate host, with the
same support boundaries.

## Development And Released Packages

This site follows the **development branch**. Its renderer and reference may
include changes newer than the latest published package. The header identifies
this as development documentation; a repository release badge is not the docs
build version.

The pinned installation recipes use **TopoViewer 0.5.0**. Read the
[release notes](https://github.com/asadarafat/topoviewer/releases/tag/v0.5.0)
for that release's changes and limitations. The YAML model version `"0.2"` is a
separate document contract, not the npm or Python package version.

| You need | Use |
|---|---|
| Try a released package | Pinned React, MkDocs, and Zensical recipes; release notes |
| Evaluate the latest renderer or Studio | This development site and hosted Studio |
| Reproduce an older implementation | The tagged repository and its documentation sources |
| Decide whether a host is supported | [Compatibility](../reference/compatibility.md) |

Before adopting a newly documented option, check the package version that
introduced it. Development-only limit keys include `maxRegions` and `maxPins`;
these are absent from the 0.5.0 schema. Use the [upgrade guide](upgrade.md) when
changing package or document versions.
