# Design

## URL Contract

The public identity is lowercase:

```text
https://github.com/asadarafat/topoviewer
https://asadarafat.github.io/topoviewer/
```

The Pages artifact is uploaded from `site/**`. GitHub Pages maps that artifact
root under the project base `/topoviewer/`, so physical paths inside `site/`
must not include an extra `topoviewer/` prefix.

Physical build output:

```text
site/
  index.html                  # redirect to docs/mkdocs/
  docs/
    index.html                # redirect to mkdocs/
    mkdocs/                   # MkDocs output
    zensical/                 # Zensical output
  harness/                    # browser harness output
```

Published routes:

```text
https://asadarafat.github.io/topoviewer/docs/mkdocs/
https://asadarafat.github.io/topoviewer/docs/zensical/
https://asadarafat.github.io/topoviewer/harness/
```

## Local Preview

`npm run docs:preview` should build the same combined static artifact and serve
it through a small local static server.

Local routes:

```text
http://127.0.0.1:8001/topoviewer/docs/mkdocs/
http://127.0.0.1:8001/topoviewer/docs/zensical/
http://127.0.0.1:8001/topoviewer/harness/
```

The local server strips `/topoviewer` before reading `site/**`, matching how
GitHub Pages serves a project site. It should fail when port 8001 is already in
use.

## Build Commands

Focused build commands remain available:

- `npm run docs:build:fast` builds MkDocs into `site/docs/mkdocs`.
- `npm run zensical:build` builds Zensical into `site/docs/zensical`.
- `npm run vscode:harness:build` builds the harness into `site/harness`.

Combined commands:

- `npm run docs:build:parallel` clears `site/**`, builds all three surfaces,
  writes redirect entry points, and validates the outputs.
- `npm run docs:preview` runs the combined build and serves the static artifact.

## README

The README should keep the first-result section short and route users to the
three review surfaces. Quick links should emphasize published MkDocs, published
Zensical, Why TopoViewer, the browser harness, and the integration roadmap.
