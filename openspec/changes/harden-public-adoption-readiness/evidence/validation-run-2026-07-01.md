# Validation Run

Date: 2026-07-01

## Targeted Checks

These checks were run while closing the public adoption readiness change after
the npm publication, docs conversion-path cleanup, curated Kubernetes example,
MkDocs resolver fix, and public API type hardening.

```bash
npm run validate:schemas
npm run validate:semantics
npm run api:check
npm --workspace topoviewer run build:types
npm run lint:ts
npm run docs:lint
npm run check:content
npm run check:examples
npm run check:public-readiness
npm run install:check
npm run docs:build:fast
TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD=1 npm run zensical:build
npm run docs:smoke
npm run render:parity
npm run ci
```

## Result

Pass.

Notes:

- `validate:semantics` initially failed because the new Kubernetes service map
  links had no `name`. The example was corrected instead of allowing warnings.
- The first visual probe found broken MkDocs live viewport asset URLs after the
  docs IA move. The MkDocs plugin now resolves `examples/...` through the
  canonical TopoViewer examples root, matching Zensical behavior.
- `install:check` built the package, created a local tarball, and verified the
  documented local install path with `@xyflow/react`, `react`, and `react-dom`.
- The first full `npm run ci` attempt exposed a renderer parity race in
  `attention-object-focus`: the parity script expected zero edge paths, so the
  harness screenshot could be captured before React Flow finished edge geometry.
  The parity fixture now waits for the canonical expected edge count.
- The final full `npm run ci` run passed locally on Node 24 after the renderer
  parity wait fix.
