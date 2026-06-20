# Implement Parallel Zensical Documentation

## Why

TopoViewer currently publishes one documentation experience through MkDocs and
the `mkdocs-topoviewer` plugin. The feasibility study showed that the browser
embed bundle is not inherently MkDocs-specific, so Zensical can be supported as
an additional static documentation target.

The goal is not to replace MkDocs. The goal is to build and publish a real
Zensical site in parallel so TopoViewer can validate the integration while
keeping the existing GitHub Pages URLs stable.

## What Changes

- Add a first-class Zensical documentation source tree and configuration.
- Keep `docs/topoviewer/` as the canonical TopoViewer docs source and generate
  mirrored Zensical pages from it.
- Rewrite MkDocs `topoviewer` fenced blocks into static `.topoviewer-embed`
  HTML containers during Zensical docs sync.
- Copy canonical `docs/topoviewer/examples/**` files into the Zensical assets
  tree so live embeds and displayed YAML use the same examples.
- Generate the Zensical nav from the MkDocs nav subset so both sites expose the
  same TopoViewer information architecture.
- Reuse the existing TopoViewer embed CSS and IIFE bundle through static assets.
- Add a Zensical adapter that mounts `.topoviewer-embed` elements on first load
  and after Zensical instant-navigation updates.
- Add local scripts for building and serving the Zensical site.
- Update CI and GitHub Pages deployment so MkDocs and Zensical are built in one
  workflow and uploaded as one Pages artifact.
- Keep MkDocs at the GitHub Pages root and publish Zensical under a stable
  subpath such as `/topoViewer/zensical/`.

## Non-Goals

- Do not replace MkDocs or remove `mkdocs-topoviewer`.
- Do not build a `zensical-topoviewer` Python package until Zensical has stable
  module or plugin hooks that cover fence rewriting and asset injection.
- Do not import TypeScript source or run Vite from inside Zensical itself.
- Do not duplicate every MkDocs page by hand.
- Do not maintain separate Zensical copies of TopoViewer reference pages.

## Success Criteria

- `npm run zensical:build` builds the Zensical site locally.
- `npm run zensical:serve` previews the Zensical site locally.
- GitHub Actions builds MkDocs and Zensical in the docs workflow.
- GitHub Pages publishes MkDocs at `/topoViewer/` and Zensical at
  `/topoViewer/zensical/`.
- At least one Zensical page renders a live TopoViewer embed using topology and
  stylesheet YAML from the repo.
- Mirrored Zensical TopoViewer pages render from `docs/topoviewer/` content,
  with snippets expanded and live examples rewritten to static embed HTML.
- CI verifies that the Zensical output contains the TopoViewer embed assets and
  the expected embed container.
