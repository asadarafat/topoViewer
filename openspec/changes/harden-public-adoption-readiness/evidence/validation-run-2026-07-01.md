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
- Full `npm run ci` is still intentionally carried as the committed-tree gate
  in task 27.2.
