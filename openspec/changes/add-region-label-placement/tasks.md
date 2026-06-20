## 1. Renderer Contract

- [x] 1.1 Add region label-position token normalization.
- [x] 1.2 Compile region `labelPosition` and `labelMargin` into renderer label CSS.
- [x] 1.3 Preserve default top-left behavior for existing diagrams.

## 2. Validation

- [x] 2.1 Add semantic lint for unsupported region label positions.
- [x] 2.2 Add semantic lint for invalid region label margins.
- [x] 2.3 Update schema hints for authored style keys.

## 3. Docs And Examples

- [x] 3.1 Document default region-label offset.
- [x] 3.2 Document supported placement tokens and margin behavior.
- [x] 3.3 Add a small public example for single-node region label placement.

## 4. Verification

- [x] 4.1 Add unit tests for compiled region label placement.
- [x] 4.2 Add unit tests for invalid placement/margin lint.
- [x] 4.3 Run schema, semantic, unit, and focused docs-example checks.
