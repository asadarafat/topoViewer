# TopoViewer Tests

TopoViewer is tested as a browser-rendered package because the important behavior is visual and interactive. The tests run against the real Vite workbench and, when the sibling MkDocs site has been built, the real MkDocs embed output.

## Commands

```bash
cd DG_25_6_v2/TopoViewer
npm install
npm run build
npm run sync:examples
npm run validate:schemas
npm run validate:semantics
npm test
npm run test:all
```

`npm run test:all` performs these gates:

- `build` type-checks the TypeScript package, emits declarations, and builds both the library bundle and embeddable IIFE bundle.
- `validate:schemas` first runs `check:examples`, then validates canonical test cases, generated docs example files, and MkDocs fenced blocks.
- `validate:semantics` runs the TopoViewer semantic linter against package examples and canonical feature test cases.
- `test` runs Playwright tests against the TypeScript workbench and the MkDocs embed integration.

## DRY Example Contract

Feature examples and test cases are authored once in:

```text
examples/test-cases/catalog.yaml
examples/test-cases/<feature>/<case>/
```

Each feature directory has:

```text
topology.yaml
stylesheet.yaml
README.md
expected.yaml
```

The catalog binds those files to generated MkDocs pages. `README.md` becomes the prose on the docs page. `expected.yaml` is the test contract: DOM counts, feature assertions, semantic lint expectations, and whether a visual snapshot is required.

Run `npm run sync:examples` after editing canonical examples. By default it materializes the generated copies under `../../../rtfm/docs/topoviewer/examples/` from this package and generates the matching docs pages. To target another MkDocs docs directory, use:

```bash
node scripts/sync-examples.mjs --docs-root /path/to/docs
```

Run `npm run check:examples` in CI to fail if the generated docs drift from the canonical package examples.

The MkDocs embed test is catalog-driven. It reads `examples/test-cases/catalog.yaml` and creates one browser test per renderable published example page. Non-renderable validation fixtures still get docs-page tests. Build the sibling docs first when validating the full integration:

```bash
cd ../../../rtfm
docker run --rm -v "$PWD:/docs" ghcr.io/asadarafat/mkdocs-material:v9.6.9 build --clean
```

## Current Regression Contract

The suite locks down these behaviors:

- The TypeScript `TopoViewer` workbench starts through Vite, renders the package component, and responds to core viewport and display controls.
- Every documented MkDocs example listed in `examples/test-cases/catalog.yaml` has matching generated docs files, fenced-block paths, schema-valid topology/style/expected YAML, semantic lint coverage, and a Playwright render or validation-page check.
- Every layer/display-knob permutation renders without a schema/runtime alert, invalid SVG path, or edge-anchor regression.
- Edges use floating anchoring by default and are painted through the visible TopoViewer edge path layer.
- Stylesheet YAML edits update the graph without a page reload.
- Child nodes can render inside their parent node and move with the parent.
- Parent regions visually contain child regions with additional margin.
- Overlapping regions such as `IS-IS L1`, `IS-IS L2`, and `AS 65000` recompute as membership-driven hulls when a region is dragged.
- The MkDocs embed renders external topology/style YAML, SVG icons, visible edges, theme variables, the controls overlay, and zoom above the earlier conservative cap.

The exhaustive permutation test currently covers 256 UI states: five layer checkboxes (`2^5`) multiplied by three display knobs (`2^3`).

## TDD Rule

Before changing renderer behavior, add or update a Playwright test that describes the intended behavior. Then change the package until `npm run test:all` passes.
