# Release

TopoViewer is licensed under Apache-2.0. The monorepo root is marked `private` to prevent accidental workspace publication. The `packages/topoviewer` package is publish-shaped so release candidates can be inspected with `npm pack --dry-run` and published intentionally to an approved npm registry.

The release goal is package quality and intentional distribution: the core renderer should remain installable, testable, embeddable, and generic, with private/customer-specific material kept out of the public packages.

## Local Validation

```bash
npm ci
npm run docs:screenshots
npm run docs:screenshots:check
npm run sync:content
npm run sync:docs
npm run validate:schemas
npm run validate:semantics
npm run api:check
npm run build
npm test
npm run pack:check
npm run sync:mkdocs-assets
npm run wheel:mkdocs
npm run inspect:wheel
mkdocs build --strict
```

The gate captures every raster screenshot used by the documentation, builds the
library and embed bundle, validates YAML schemas, runs semantic lint, runs
Playwright tests against Studio and the MkDocs embed behavior, inspects npm
package contents, builds the MkDocs plugin wheel, and builds the documentation
site in strict mode.

Run `npm run docs:screenshots` only after setting the final release version. It
rebuilds Studio, MkDocs, Zensical, and the Grafana panel; starts an isolated,
pinned Grafana container; captures every surface from the canonical `st-clos`
bundle; generates the promotional collage; and verifies the result. Docker must
be running, but no manually supplied screenshot is accepted.

The generated `docs/assets/readme/manifest.json` binds all documentation raster
assets to the release version, canonical source hashes, deterministic capture
scenarios, dimensions, surfaces, and image digests. `npm run ci:generated`
rejects missing or unowned documentation images. The npm and PyPI publish
workflows additionally run `npm run release:screenshots:verify`; publication is
blocked when regenerated media differs from the reviewed files in Git, and the
workflow uploads the regenerated files for review.

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
- `content/examples/catalog.yaml`
- `content/examples/**/topology.yaml`
- `content/examples/**/stylesheet.yaml`
- `content/examples/**/README.md`
- `content/examples/**/expected.yaml`
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

## Manual npm Publishing

The public npm package name is `topoviewer`. The `0.x` line is installable
early-adopter software: useful, documented, and CI-gated, but not an API-freeze
claim. Reserve `1.0.0` for the later stable-core release.

The public npm install snippet is:

```bash
npm install topoviewer @xyflow/react react react-dom
```

For local release preflight, maintainers can validate the source tarball
workflow:

```bash
npm --workspace topoviewer pack --pack-destination /tmp/topoviewer-pack
npm install /tmp/topoviewer-pack/topoviewer-0.3.1.tgz @xyflow/react react react-dom
```

`npm run install:check` validates that same consumer contract by packing the
local workspace tarball, installing it into a temporary app with the documented
peer dependencies, and verifying ESM, CommonJS, CSS, and schema exports.

Normal pushes, pull requests, docs deployments, and scheduled workflows must not
publish to npm. Publication is manual through the `Manual npm Publish` GitHub
Actions workflow, authenticated by npm Trusted Publishing with GitHub OIDC.

1. Choose the exact version already committed in `packages/topoviewer/package.json`.
2. Choose the dist-tag. Prefer `next` for early-adopter `0.x` validation unless
   maintainers deliberately want `latest` with clear pre-1.0 wording. Reserve
   `latest` without caveats for the stable-core `1.0.0` release.
3. Keep `dry_run` enabled for the first run and review the npm publish output.
4. Confirm `npm run ci`, `npm run install:check`,
   `npm run api:check`, `npm run artifact:check:package`, and
   `npm run dependency:advisories` pass.
5. Confirm the release note or changelog entry exists and describes support
   status, known limitations, and upgrade notes.
6. Confirm package ownership, npm organization/user access, and maintainer
   approval.
7. Confirm npm Trusted Publishing is configured for the package with:
   - provider: GitHub Actions;
   - owner/repository: `asadarafat/topoviewer`;
   - workflow filename: `npm-publish.yml`;
   - environment: `npm-publish`;
   - allowed action: `npm publish`.
8. Confirm the workflow has GitHub `id-token: write`, runs on a GitHub-hosted
   runner, and uses npm `>=11.5.1`. The workflow must not reference
   `NPM_TOKEN`, `NODE_AUTH_TOKEN`, or repository secrets for publishing.
   Trusted Publishing generates provenance automatically.
9. Run the workflow with `dry_run: false` only after the dry-run artifact and
   validation logs are reviewed.

When the requested version is already published, npm rejects
`npm publish --dry-run` because package versions are immutable even in dry-run
mode. In that case the workflow still runs all release gates, verifies the
registry state, and uses `npm pack --dry-run` for artifact validation. A real
publish for an already-published version fails before upload and requires a
version bump.

Maintainers can create or verify the npm-side trust relationship from npmjs.com
or with the npm CLI:

```bash
npm trust github topoviewer \
  --repo asadarafat/topoviewer \
  --file npm-publish.yml \
  --env npm-publish \
  --allow-publish
```

## Manual PyPI Publishing

The public MkDocs package name is `mkdocs-topoviewer`. It is separate from the
npm package:

| Surface | Package | Release workflow |
|---|---|---|
| React/browser renderer | `topoviewer` on npm | `npm-publish.yml` |
| MkDocs plugin | `mkdocs-topoviewer` on PyPI | `pypi-publish.yml` |

The Python import module is `mkdocs_topoviewer`, and the MkDocs plugin key is
`topoviewer`.

Normal pushes, pull requests, docs deployments, and scheduled workflows must not
publish to PyPI. Publication is manual through the `Manual PyPI Publish` GitHub
Actions workflow, authenticated by PyPI Trusted Publishing with GitHub OIDC.

Before a real PyPI publish:

1. Choose the exact version already committed in
   `packages/mkdocs-topoviewer/pyproject.toml`.
2. Run the workflow with `dry_run: true` and review the built wheel and sdist.
3. Confirm the PyPI trusted publisher is configured for:
   - project: `mkdocs-topoviewer`;
   - owner/repository: `asadarafat/topoviewer`;
   - workflow filename: `pypi-publish.yml`;
   - environment: `pypi-publish`.
4. Confirm the workflow has GitHub `id-token: write` and does not reference
   `PYPI_TOKEN` or repository secrets for publishing.
5. Run the workflow with `dry_run: false` only after the dry-run artifact and
   validation logs are reviewed.
6. Verify the published package from a clean environment:

```bash
pip install mkdocs-topoviewer
npm run install:check:mkdocs
```

PyPI package versions are immutable. A real publish for an already-published
version fails before upload and requires a version bump.

## 0.3.1 Patch Release Plan

`0.3.1` is a release-hardening patch after the published `0.3.0` line. Its
purpose is to make Studio the single maintained authoring product, make every
documentation screenshot a reviewed release artifact, and ship the focused
Studio selection correction already present in the candidate. It must not add
a deliberate breaking change to the supported renderer API or YAML schemas.

### In Scope

- Remove the duplicate legacy authoring runtime, tests, dependencies, CI lane,
  and maintained documentation while preserving a tested compatibility
  redirect to Studio.
- Keep Studio, MkDocs, Zensical, and Grafana documentation media on the same
  canonical `st-clos` bundle and dark presentation.
- Generate and catalog all six documentation raster assets, including Studio
  Visual, Studio Code, MkDocs, Zensical, Grafana, and the promotional collage.
- Bind generated media to the release version, canonical source hashes,
  scenarios, dimensions, surfaces, and image digests.
- Block npm and PyPI publication when regenerated media differs from the
  committed review artifact.
- Fix Studio mixed-object selection deduplication and callback-order feedback
  without changing the public topology contract.

The patch does not promote Studio or Grafana from Experimental, introduce a new
integration surface, or expand the supported YAML contract. Unrelated feature
work belongs in a later minor release.

### Before And After Evidence

| Measure | `0.3.0` baseline | `0.3.1` release requirement |
|---|---|---|
| Documentation raster ownership | Images were not bound to release version and source hashes. | Six catalog-owned images pass `npm run docs:screenshots:check`. |
| Cross-surface source | README media could drift between surfaces. | Every capture records the same canonical `st-clos` topology and stylesheet hashes. |
| Grafana capture | No release gate regenerated the real panel image. | A pinned `grafana/grafana:13.1.0` container renders the actual plugin without a manual screenshot input. |
| Reproducibility | No pixel-drift proof was required. | A clean-tree `npm run release:screenshots:verify` regenerates identical reviewed files. |
| Authoring ownership | Studio and a duplicate legacy authoring application were both maintained. | Studio is the only authoring implementation; the historical route is redirect-only. |
| Selection regression | Mixed callback order could re-emit the same semantic selection. | Unit and browser tests prove order-independent, deduplicated selection without a maximum-update-depth error. |

### Sequential Release Gate

Complete each step and retain its evidence before starting the next one.

1. **Freeze scope.** Review the diff against `v0.3.0`; remove unrelated feature
   work or move it to a later release. Run `npm run api:check`,
   `npm run validate:schemas`, and `npm run validate:semantics` to prove the
   supported contracts remain compatible.
2. **Set one version.** Change the root, core, Studio, Grafana, VS Code, MkDocs,
   and lockfile versions to `0.3.1`. Confirm no release-owned package remains on
   `0.3.0`, and finalize the dated `0.3.1` changelog entry before generating
   artifacts.
3. **Regenerate projections.** Run `npm run sync:content`,
   `npm run sync:docs`, and `npm run docs:screenshots`. Review all six images at
   authored resolution and commit the manifest and generated media with their
   canonical sources.
4. **Prove reproducibility.** From that clean committed tree, run
   `npm run release:screenshots:verify`. The command must leave the screenshot
   paths unchanged. Docker must be available for the pinned Grafana capture.
5. **Pass local release gates.** Run `npm ci`, `npm run ci`,
   `npm run install:check`, `npm run api:check`,
   `npm run artifact:check:package`, `npm run dependency:advisories`,
   `npm run dist:mkdocs`, and `npm run inspect:mkdocs`. Record command results
   against the exact candidate commit.
6. **Pass remote dry runs.** Run the manual npm and PyPI Trusted Publishing
   workflows with version `0.3.1` and `dry_run: true`. Review package contents,
   provenance inputs, generated screenshot evidence, and uploaded drift
   artifacts before approving publication.
7. **Publish and verify packages.** Publish npm and PyPI from the unchanged
   candidate commit. Verify `topoviewer@0.3.1` and
   `mkdocs-topoviewer==0.3.1` from clean consumers; do not tag the release while
   either verification is outstanding.
8. **Close the release.** Create `v0.3.1` and the GitHub release, deploy Pages,
   and verify the Studio route, legacy compatibility redirect, MkDocs and
   Zensical embeds, and all published documentation images. Confirm the GitHub
   release notes match the dated changelog entry on the tagged commit.

If a published artifact is defective, deprecate it and prepare `0.3.2`; do not
unpublish or mutate an existing package version.

## 0.3.0 Early-Adopter Gate

`topoviewer@0.3.0` must not be published until these gates are satisfied:

- The package builds, type output, CSS, schemas, examples, and README are
  present in `npm pack --dry-run` output.
- `npm run ci`, `npm run install:check`, `npm run api:check`,
  `npm run artifact:check:package`, and `npm run dependency:advisories` pass.
- `npm run dist:mkdocs` and `npm run inspect:mkdocs` pass when
  `mkdocs-topoviewer==0.3.0` is part of the release train.
- The changelog has a `0.3.0` entry with support status, notable changes,
  known limitations, and migration notes.
- `npm run docs:screenshots` has captured every documentation surface from the
  final build and `npm run docs:screenshots:check` passes for version `0.3.0`.
- TopoViewer Studio remains labeled Experimental and is not represented as a
  separately published npm package.
- The npm and PyPI Trusted Publishing dry-run workflows pass against the exact
  commit selected for publication.
- The published npm and PyPI versions are verified from clean consumers before
  the GitHub release and `v0.3.0` tag are created.

## 0.2.0 Early-Adopter Gate

`topoviewer@0.2.0` must not be published until these gates are satisfied:

- The package builds, type output, CSS, schemas, examples, and README are
  present in `npm pack --dry-run` output.
- `npm run ci`, `npm run install:check`, `npm run api:check`,
  `npm run artifact:check:package`, and `npm run dependency:advisories` pass.
- `npm run wheel:mkdocs` and `npm run inspect:wheel` pass when
  `mkdocs-topoviewer==0.2.0` is part of the release train.
- The changelog has a `0.2.0` entry with support status, notable changes,
  known limitations, and migration notes.
- The README and docs keep React, MkDocs, TopoViewer Studio, Zensical, Grafana,
  VS Code, NetBox, and Infrahub support status accurate.
- Experimental integrations remain clearly labeled and do not expand the
  package compatibility promise.
- The npm and PyPI Trusted Publishing dry-run workflows are reviewed before
  any real publish.

## 0.1.0 Early-Adopter Gate

`topoviewer@0.1.0` was published only after these gates were satisfied:

- The package builds, type output, CSS, schemas, examples, and README are
  present in `npm pack --dry-run` output.
- `npm run ci`, `npm run install:check`, `npm run api:check`,
  `npm run artifact:check:package`, and `npm run dependency:advisories` pass.
- The changelog has a `0.1.0` entry with support status, known limitations,
  and migration notes.
- The README first run no longer points users at a missing npm package after
  the package is published.
- The README and docs clearly state that this is pre-1.0 early-adopter
  software and that APIs may change with migration notes.
- Experimental integrations remain clearly labeled and do not expand the
  package compatibility promise.

## 1.0.0 Stable-Core Gate

Do not publish `topoviewer@1.0.0` until these are true:

- `TopoViewer`, documented React props/events, validation/lint helpers,
  topology schemas, stylesheet schemas, style keys, curated examples, and the
  MkDocs embed path are treated as Supported.
- The public API report is intentionally frozen enough for SemVer.
- Compatibility fixtures cover previously documented public YAML.
- The changelog has a `1.0.0` entry with support status, known limitations,
  and migration notes from `0.x`.
- Experimental integrations remain clearly labeled and do not expand the
  stable-core SemVer promise.

Rollback and deprecation expectations:

- Prefer publishing a fixed patch version over unpublishing.
- If a bad version is already public, deprecate it with a clear message and
  publish a replacement version.
- Move a dist-tag only after the replacement artifact has passed the same gates.
- Record first-install feedback with the package release feedback issue template.

## Grafana Plugin Artifact Gate

The Grafana panel is Experimental. Local labs may load unsigned plugin builds,
but an installable shared artifact needs a separate review before distribution:

1. Build the plugin from a committed version.
2. Record the exact Grafana version or version range validated for the artifact.
3. Generate SHA-256 checksums for the plugin zip and backend binaries.
4. Generate an SBOM or equivalent dependency inventory.
5. Run `npm run grafana:panel:test`, `npm run grafana:panel:build`, and the
   relevant Grafana smoke for the intended source mode.
6. Document whether the artifact is unsigned or signed. Unsigned artifacts are
   local/lab-only unless the receiving Grafana instance has an explicit policy
   exception.
7. Include support status, known limitations, migration notes, and rollback
   instructions in the release notes.

## Public Readiness Rule

A generic feature should be included in a public release when it has:

- A stable YAML model and schema coverage.
- Documentation with at least one focused example.
- Playwright coverage for the important UI behavior.
- No customer-specific dependencies or private assets.
- A supportable migration path if the authored syntax changes.
