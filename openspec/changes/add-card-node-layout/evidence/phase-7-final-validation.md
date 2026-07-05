# Phase 7 Final Validation

## Summary

Final validation passed for the card node layout implementation.

The implementation was committed locally as:

```text
5059683 feat(topoviewer): add card node layout
```

The first full CI attempt exposed two useful guardrail failures:

- `packages/vscode-topoviewer/src/webview/webviewYamlAuthoring.ts` exceeded
  the 1000-line code-health limit.
- `packages/topoviewer/src/index.ts` exceeded the public barrel export limit.

Fixes applied before final validation:

- moved nested `nodeLayout` YAML-assist helpers into
  `packages/vscode-topoviewer/src/webview/webviewNodeLayoutAssist.ts`;
- kept only `NodeLayoutCardStyle` in the root public API and removed
  implementation-only card-layout enum constants from the barrel;
- regenerated `packages/topoviewer/api-report.md`;
- synced generated docs from canonical content sources.

## Focused Gates

```bash
source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && npm run check:content
```

Result: passed. Content projections were in sync.

```bash
source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && npm run validate:schemas
```

Result: passed. The new `nodes-card-node-layout` example validates as topology
YAML, stylesheet YAML, expected YAML, composed TopoViewer document, and MkDocs
fenced block.

```bash
source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && npm --workspace topoviewer run test:unit -- tests/unit/node-shapes.test.ts
```

Result: passed. Vitest reported 18 test files and 127 tests passing.

```bash
source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && npm --workspace topoviewer exec -- playwright test tests/topoviewer-interactions.spec.js -g "card node layout"
```

Result: passed. The browser test confirms card node layout renders inside
round-rectangle node bodies.

```bash
source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && npm run render:parity
```

Result: passed. Renderer surface parity passed for Harness, MkDocs, and
Zensical.

```bash
source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && npm run docs:lint
```

Result: passed. Documentation contract lint passed after the TypeScript API
reference was updated.

## Full CI

```bash
source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && npm run ci
```

Result: passed.

Final timing summary:

```text
Total elapsed: 11m 43.2s
- env: success, 146ms
- generated: success, 1.7s
- quality: success, 25.9s
- schemas: success, 9.9s
- build: success, 55.4s
- docs: success, 1m 37.7s
- render-parity: success, 36.6s
- test:topoviewer: success, 45.1s
- test:harness: success, 3m 3.1s
- perf:smoke: success, 18.0s
- package: success, 1m 20.4s
- public-readiness: success, 2m 29.3s
```

## Gate

Final validation is complete. The OpenSpec change is implementation-complete and
can be archived in a separate archive step when requested.
