# 1. Content Source Migration

- [x] 1.1 Create `packages/topoviewer/content/pages/**` from the current package docs
- [x] 1.2 Create `packages/topoviewer/content/examples/**` from the current package examples
- [x] 1.3 Move the example catalog to `packages/topoviewer/content/examples/catalog.yaml`
- [x] 1.4 Keep `packages/topoviewer/docs/**` as a generated projection
- [x] 1.5 Keep `packages/topoviewer/examples/**` as a generated projection
- [x] 1.6 Add `packages/topoviewer/content/pages/_fragments/product-positioning.md`
- [x] 1.7 Add `packages/topoviewer/content/pages/_fragments/integration-surfaces.md` if integration wording needs a separate reusable fragment

# 2. Deduplicate Canonical Content

- [x] 2.1 Resolve `integration/yaml-to-network-diagram` versus `integration/real-network-underlay` as either alias or distinct examples
- [x] 2.2 Resolve duplicated `attention/region-collapse` and `attention/region-focus` stylesheet source through shared content or an explicit catalog exception
- [x] 2.3 Leave identical `expected.yaml` metadata alone unless it becomes misleading
- [x] 2.4 Add catalog metadata for aliases/shared sources where needed

# 3. Sync And Generation

- [x] 3.1 Add `npm run sync:content`
- [x] 3.2 Add `npm run check:content`
- [x] 3.3 Refactor `scripts/sync-docs-site.mjs` to read from `content/pages`
- [x] 3.4 Refactor `packages/topoviewer/scripts/sync-examples.mjs` to read from `content/examples`
- [x] 3.5 Ensure generated MkDocs pages still expose the same public URLs
- [x] 3.6 Ensure generated Zensical pages still mirror the MkDocs content
- [x] 3.7 Ensure npm package `docs` and `examples` content is generated from `content/**`
- [x] 3.8 Generate or compose root `README.md` from canonical content fragments
- [x] 3.9 Generate or compose root `docs/index.md` from canonical content fragments

# 4. Validation

- [x] 4.1 CI fails when generated package docs/examples are stale
- [x] 4.2 CI fails when generated MkDocs examples are stale
- [x] 4.3 CI validates alias/shared-source catalog entries
- [x] 4.4 Existing schema validation still covers all examples
- [x] 4.5 Existing Playwright docs/example tests still pass
- [x] 4.6 `npm run ci` passes under Node.js 24
- [x] 4.7 CI fails when generated `README.md` or `docs/index.md` drift from canonical product positioning

# 5. Documentation

- [x] 5.1 Update contributor/developer docs to state that content edits happen only in `packages/topoviewer/content/**`
- [x] 5.2 Mark generated projection directories clearly in README or local docs
- [x] 5.3 Update OpenSpec README with this active change
- [x] 5.4 Position TopoViewer consistently as "Topology as Code"
- [x] 5.5 Explain that topology means declarative diagrams/graphs for network, infrastructure, service, and related connected systems
- [x] 5.6 Explain how TopoViewer differs from Mermaid.js without positioning it as a generic Mermaid replacement
- [x] 5.7 Document supported and roadmap integration surfaces consistently: npm library, MkDocs, Zensical, browser harness, VS Code, NetBox, OpsMill/Infrahub, and Grafana if retained
- [x] 5.8 Ensure NetBox and OpsMill/Infrahub are described as plugin visualizers based on platform data, not external-only generators
