# Contributing

TopoViewer is a declarative graph renderer. Keep contributions aligned with
that product boundary:

- Topology YAML describes graph facts.
- Stylesheet YAML describes presentation policy.
- Diagram primitives explain the graph; they should not replace semantic graph objects.
- The React renderer is an implementation detail behind the public model.

## Development Setup

Use Node.js `>=24 <25` and Python `>=3.10`. The canonical local quality gate is
the same command used by GitHub CI:

```bash
npm ci
npm run ci
```

Run the focused static gates while iterating:

```bash
npm run lint                         # full local static gate
npm run lint -- --only code-health   # max 1000 lines per source/test/script file
npm run lint -- --only ts            # oxlint correctness checks
npm run lint -- --only deps          # dependency-cruiser cycle/boundary checks
npm run lint -- --only cpd           # jscpd duplicate-code threshold
npm run lint -- --only cpd-report    # inspect duplicate blocks when needed
```

Move a local dirty worktree to another machine without pushing:

```bash
node scripts/create-manual-transfer.mjs
```

The bundle is written under `.artifacts/manual-transfer/` by default and includes
tracked edits, deletions, and untracked git-visible files. Pass ignored or
external files explicitly with `--extra /path/to/file`.

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
- At least one canonical example under `packages/topoviewer/content/examples`.
- Playwright coverage through the generated MkDocs examples or focused interaction tests.
- Documentation in `packages/topoviewer/content/pages`.

Public-readiness changes must also consider:

- support status and user-facing wording;
- README/docs URL correctness;
- local path and private artifact leakage;
- package and plugin artifact contents;
- dependency and security automation coverage;
- accessibility, performance, and compatibility evidence when the public
  contract changes.

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

Lab defaults under `labs/**/.env` are disposable local development defaults
only. They must be clearly labeled as unsafe for production.

## Studio Boundaries

TopoViewer Studio is a YAML-first workbench. Preserve these ownership rules:

- project source is exposed through one project-source navigator and one shared
  Monaco workspace;
- `CanvasSurface` is the only topology preview;
- Add, Properties, canvas settings, and Mapper Visual share one preview-local
  contextual drawer;
- source drafts, stylesheet candidates, selection, history, recovery, and
  persistence remain in their established session or host owners;
- visual mutations use capabilities and transactional commands rather than
  parsing or rewriting YAML in UI components;
- browser and Wails frontends mount the same Studio application through
  `StudioHost`.

Do not add a second editor, preview model, workspace rail, parser, selector
engine, renderer, document buffer, or host-specific feature UI. Update
`packages/topoviewer-studio/ARCHITECTURE.md`, focused browser evidence, and
canonical Studio documentation when the workbench hierarchy changes.

## Review Expectations

- Keep PRs focused enough to review.
- Use conventional commits for commit messages.
- Update OpenSpec tasks when implementing an active OpenSpec change.
- Do not publish npm packages, Grafana plugin zips, docs, or release artifacts
  from ordinary push/PR workflows.
- Add a security note when touching YAML parsing, SVG/HTML rendering, mapper
  templates, Grafana mounted bundles, local storage, telemetry labels, or
  package artifact contents.

## Pull Request Checklist

- `npm run validate:schemas`
- `npm run validate:semantics`
- `npm run lint`
- `npm run build`
- `npm test`
- `npm run pack:check`
- `npm run sync:mkdocs-assets`
- `npm run wheel:mkdocs`
- `npm run inspect:wheel`
- `mkdocs build --strict`
