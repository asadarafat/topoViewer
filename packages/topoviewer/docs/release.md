# Release Checklist

TopoViewer is licensed under Apache-2.0. The monorepo root is marked `private` to prevent accidental workspace publication. The `packages/topoviewer` package is publish-shaped so release candidates can be inspected with `npm pack --dry-run` and published intentionally to an approved npm registry.

The release goal is package quality and intentional distribution: the core renderer should remain installable, testable, embeddable, and generic, with private/customer-specific material kept out of the public packages.

## Local Validation

```bash
npm ci
npm run sync:content
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
- `examples/test-cases/catalog.yaml` generated from `content/examples/catalog.yaml`
- `examples/test-cases/**/topology.yaml` generated from `content/examples/**`
- `examples/test-cases/**/stylesheet.yaml` generated from `content/examples/**`
- `examples/test-cases/**/README.md` generated from `content/examples/**`
- `examples/test-cases/**/expected.yaml` generated from `content/examples/**`
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

Then validate the MkDocs site from your MkDocs validation workspace. For example, if a validation site is checked out next to this repository and its Makefile builds a wheel from the local `mkdocs-topoviewer` package:

```bash
cd ../my-mkdocs-site
make docs MKDOCS_BUILD_FLAGS=--clean
```

Run the root Playwright MkDocs embed test if the local server is available:

```bash
npx playwright test tests/mkdocs-embed.spec.js
```

## Release Channels

Do not publish directly from this development workspace.

Before any external distribution:

1. Confirm the channel: public release, internal preview, or customer-specific private package.
2. Confirm package ownership, final npm package name, repository URL, issue tracker, and support channel.
3. Keep the public package generic. Do not mix customer-owned diagrams, proprietary icon sets, credentials, or lab-only data into the package.
4. Use `TopoViewerExtension` packages for private customer integrations, custom node/edge types, importers, policy checks, or enterprise-only workflows.
5. Bump `version` according to semver.
6. Run `npm run test:all`.
7. Run `npm run pack:check` and inspect tarball contents.
8. Publish only to the approved channel.

Recommended future distribution shape:

- `topoviewer`: public generic React renderer, schemas, compiler, and embed bundle.
- `mkdocs-topoviewer`: public Python MkDocs wrapper that vendors the approved browser bundle.
- Internal preview packages or a private registry equivalent: pre-release validation builds.
- Private customer packages: customer-owned templates, proprietary icon libraries, policy checks, and deployment-specific import/export workflows.

Do not publish generated test artifacts, local videos, screenshots, or MkDocs build output.

## Public Readiness Rule

A generic feature should be included in a public release when it has:

- A stable YAML model and schema coverage.
- Documentation with at least one focused example.
- Playwright coverage for the important UI behavior.
- No customer-specific dependencies or private assets.
- A supportable migration path if the authored syntax changes.
