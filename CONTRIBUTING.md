# Contributing

TopoViewer is a declarative graph renderer. Keep contributions aligned with that product boundary:

- Topology YAML describes graph facts.
- Stylesheet YAML describes presentation policy.
- Diagram primitives explain the graph; they should not replace semantic graph objects.
- The React renderer is an implementation detail behind the public model.

## Development Setup

Use Node.js `>=20.19` and Python `>=3.9`.

```bash
npm ci
npm run sync:docs
npm run validate:schemas
npm run validate:semantics
npm run build
npm test
```

Build and inspect release artifacts:

```bash
npm run pack:check
npm run sync:mkdocs-assets
npm run wheel:mkdocs
npm run inspect:wheel
```

Build documentation:

```bash
python3 -m pip install -e packages/mkdocs-topoviewer mkdocs-material
mkdocs build --strict
```

## Required Quality Bar

Changes that affect the model, renderer, or docs examples must include:

- JSON Schema updates when the YAML shape changes.
- Semantic linter updates when meaning changes.
- At least one canonical example under `packages/topoviewer/examples/test-cases`.
- Playwright coverage through the generated MkDocs examples or focused interaction tests.
- Documentation in `packages/topoviewer/docs`.

## Commit Style

Use Conventional Commits:

```text
feat: add callout leader styles
fix: reject unsafe remote image sources
docs: document parent link pipe behavior
test: cover nested draggable regions
chore: refresh mkdocs plugin assets
```

## Package Boundaries

Do not import MkDocs or Python concerns into `packages/topoviewer`.

Do not require Node/npm at MkDocs build time. The Python plugin must vendor the approved browser bundle from `packages/topoviewer/dist/embed`.

Do not commit local lab material, credentials, customer diagrams, generated videos, screenshots, or private icon sets into the public package.

## Pull Request Checklist

- `npm run validate:schemas`
- `npm run validate:semantics`
- `npm run build`
- `npm test`
- `npm run pack:check`
- `npm run sync:mkdocs-assets`
- `npm run wheel:mkdocs`
- `npm run inspect:wheel`
- `mkdocs build --strict`
