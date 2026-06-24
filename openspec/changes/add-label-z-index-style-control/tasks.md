## 1. Tests First

- [x] 1.1 Add compiler unit tests for `labelZIndex` on node, edge, region, shape, and callout styles
- [x] 1.2 Add compiler unit tests for `sourceLabelZIndex` and `targetLabelZIndex` edge fallbacks and overrides
- [x] 1.3 Add validation tests for invalid numeric values and non-canonical spellings such as `label-z-index` and `labelZindex`
- [x] 1.4 Add renderer tests proving a node label can render in an independent label layer without changing the node body `zIndex`
- [x] 1.5 Add renderer tests proving a region label can render in an independent label layer while the region hull remains behind nodes
- [x] 1.6 Add renderer tests for center/source/target edge label z-index styles
- [x] 1.7 Add package/export smoke coverage for diagrams that use label overlay rendering through the existing DOM-capture export path
- [x] 1.8 Add focused MkDocs/Zensical documented-example tests for label z-index examples

## 2. Style Contract

- [x] 2.1 Define `labelZIndex` as the canonical public style key
- [x] 2.2 Define `sourceLabelZIndex` and `targetLabelZIndex` for edge endpoint labels
- [x] 2.3 Keep `zIndex` as object/body/line ordering and prevent it from becoming a label-order alias
- [x] 2.4 Ensure unsupported casing and kebab-case aliases are rejected through existing canonical style-key validation
- [x] 2.5 Update style metadata so harness suggestions treat label z-index keys as numeric values

## 3. Renderer

- [x] 3.1 Compile label z-index values into renderer data for nodes, edges, regions, shapes, and callouts where labels render
- [x] 3.2 Design and implement graph-space overlay rendering for node and region labels when independent label layering is required
- [x] 3.3 Preserve existing in-object label rendering and behavior when `labelZIndex` is absent
- [x] 3.4 Apply center/source/target edge label z-index in `FloatingEdge`
- [x] 3.5 Preserve selection, hover, drag, attention, pointer-event, keyboard, and canvas interaction behavior
- [x] 3.6 Ensure label overlay rendering moves and zooms with the topology, not the viewport chrome
- [x] 3.7 Ensure export captures independently layered labels

## 4. Schemas, Docs, And Examples

- [x] 4.1 Update combined and stylesheet schemas with `labelZIndex`, `sourceLabelZIndex`, and `targetLabelZIndex` descriptions
- [x] 4.2 Update canonical stylesheet docs to explain `zIndex` versus `labelZIndex`
- [x] 4.3 Add compact label z-index examples with live viewport, topology YAML, stylesheet YAML, and expected assertions
- [x] 4.4 Sync canonical content projections into package docs, MkDocs docs, and Zensical docs
- [x] 4.5 Update README or public overview only if the examples affect product-level messaging

## 5. Validation

- [x] 5.1 Run `npm run lint`
- [x] 5.2 Run `npm run validate:schemas`
- [x] 5.3 Run focused compiler/style unit tests
- [x] 5.4 Run focused TopoViewer Playwright tests for label z-index examples
- [x] 5.5 Run focused harness YAML authoring intelligence tests
- [x] 5.6 Run `npm run docs:build:fast`
- [x] 5.7 Run `npm run ci`
