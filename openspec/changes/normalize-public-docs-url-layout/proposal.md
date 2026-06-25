# Normalize Public Docs URL Layout

## Why

TopoViewer's public URLs drifted between mixed-case repository/page paths and
multiple local preview roots. That makes README links brittle and makes local
preview less representative of GitHub Pages.

The project should use one canonical lowercase public identity:

- Repository links use `https://github.com/asadarafat/topoviewer`.
- GitHub Pages links use `https://asadarafat.github.io/topoviewer/`.
- MkDocs, Zensical, and the browser harness are sibling surfaces under the same
  Pages base.

## What Changes

Publish and preview the combined documentation artifact as:

```text
/topoviewer/docs/mkdocs/
/topoviewer/docs/zensical/
/topoviewer/harness/
```

`npm run docs:preview` becomes a production-like static preview of the combined
artifact on one port instead of starting separate MkDocs and Zensical servers.

## Capabilities

- `lowercase-public-identity`: all public repository and Pages links use
  lowercase `topoviewer`.
- `combined-pages-layout`: MkDocs, Zensical, and harness are published as
  sibling routes under one Pages base.
- `single-port-local-preview`: `npm run docs:preview` serves the built Pages
  artifact on one local port and exposes the same route shape as production.

## Non-Goals

- Do not rename the npm package; it already remains `topoviewer`.
- Do not change internal documentation content routes such as
  `topoviewer/why-topoviewer/`.
- Do not remove focused MkDocs or Zensical build commands; keep them available
  for targeted validation.
