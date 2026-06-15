# Insiders Release Checklist

TopoViewer uses an Insiders-style release model during early development. The monorepo root is marked `private` to prevent accidental workspace publication. The `packages/topoviewer` package is publish-shaped so release candidates can be inspected with `npm pack --dry-run` and published intentionally to an approved npm registry.

The release goal for now is package quality and safe early access: the core renderer should remain installable, testable, and embeddable while preview capability is distributed only through approved insiders channels. Stable capabilities should graduate into the public/free channel after they are documented and supportable.

## Local Validation

```bash
npm ci
npm run sync:docs
npm run validate:schemas
npm run validate:semantics
npm run build
npm test
npm run pack:check
npm run sync:mkdocs-assets
npm run wheel:mkdocs
npm run inspect:wheel
mkdocs build --strict
```

The gate builds the library and embed bundle, validates YAML schemas, runs semantic lint, runs Playwright tests against the workbench and MkDocs embed behavior, inspects npm package contents, builds the MkDocs plugin wheel, and builds the documentation site in strict mode.

`npm run pack:check` runs `npm pack --dry-run`. Confirm the tarball includes:

- `dist/topoviewer.mjs`
- `dist/topoviewer.umd.js`
- `dist/topoviewer.css`
- `dist/types/index.d.ts`
- `dist/embed/topoviewer-embed.iife.js`
- `dist/embed/topoviewer-embed.css`
- `schemas/topoviewer.schema.json`
- `schemas/topoviewer-topology.schema.json`
- `schemas/topoviewer-stylesheet.schema.json`
- `schemas/topoviewer-mkdocs-block.schema.json`
- `schemas/topoviewer-examples-catalog.schema.json`
- `schemas/topoviewer-test-expected.schema.json`
- `examples/test-cases/catalog.yaml`
- `examples/test-cases/**/topology.yaml`
- `examples/test-cases/**/stylesheet.yaml`
- `examples/test-cases/**/README.md`
- `examples/test-cases/**/expected.yaml`
- `README.md`
- `LICENSE`
- `package.json`

## Dependency Boundary

Runtime dependencies should stay small:

- `d3-force`
- `html-to-image`
- `jspdf`
- `zod`

Peer dependencies:

- `react`
- `react-dom`
- `@xyflow/react`

The workbench dependencies, including MUI and Monaco, must remain development dependencies. Do not export `TopoViewerWorkbench` from `src/index.ts`; that would pull the demo/editor stack into the public library bundle.

## MkDocs Asset Validation

When the embed bundle changes:

```bash
npm run build
npm run sync:mkdocs
```

Then validate the MkDocs site from `DG_25_6_v2/rtfm`. The RTFM Makefile builds a wheel from the local `mkdocs-topoviewer` symlink and installs that wheel into the vanilla MkDocs container before running the build:

```bash
cd ../rtfm
make docs MKDOCS_BUILD_FLAGS=--clean
```

Run the root Playwright MkDocs embed test if the local server is available:

```bash
npx playwright test tests/mkdocs-embed.spec.js
```

## Release Channels

Do not publish directly from this development workspace.

Before any external distribution:

1. Confirm the channel: insiders preview, public/free release, or customer-specific private package.
2. Confirm package ownership, final npm package name, repository URL, issue tracker, and support channel.
3. Keep the public package generic. Do not mix customer-owned diagrams, proprietary icon sets, credentials, or lab-only data into the package.
4. Use `TopoViewerExtension` packages for private customer integrations, custom node/edge types, importers, policy checks, or enterprise-only workflows.
5. Bump `version` according to semver.
6. Run `npm run test:all`.
7. Run `npm run pack:check` and inspect tarball contents.
8. Publish only to the approved channel.

Recommended future distribution shape:

- `topoviewer`: public/free generic React renderer, schemas, compiler, and embed bundle.
- `mkdocs-topoviewer`: public/free Python MkDocs wrapper that vendors the approved browser bundle.
- `@topoviewer-insiders/*` or a private registry equivalent: preview builds for supporters and early adopters.
- Private customer packages: customer-owned templates, proprietary icon libraries, policy checks, and deployment-specific import/export workflows.

Do not publish generated test artifacts, local videos, screenshots, or MkDocs build output.

## Graduation Rule

A feature should move from insiders to public/free when it has:

- A stable YAML model and schema coverage.
- Documentation with at least one focused example.
- Playwright coverage for the important UI behavior.
- No customer-specific dependencies or private assets.
- A supportable migration path if the early-access syntax changes.
