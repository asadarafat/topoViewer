## Overview

The public style declaration object should have one casing rule: `camelCase`. This applies to TypeScript object APIs and Stylesheet YAML because YAML is a serialization of the same style object, not a separate CSS dialect.

This change does not rename topology model fields, object IDs, labels, `data.*` keys, file names, selector syntax, or generated route paths. It applies to style declaration keys under `style`.

## Canonical Rule

Canonical:

```yaml
style:
  backgroundColor: "#e0f2fe"
  borderColor: "#0369a1"
  borderWidth: 2
  curveStyle: bezier
  sourceLabel: ingress
  targetLabel: egress
  shapePolygonPoints: "0 -1 1 0 -1 1"
```

Rejected:

```yaml
style:
  shape-polygon-points: "0 -1 1 0 -1 1"
```

Do not present aliases as equal-preference syntax, compatibility syntax, or migration syntax. TopoViewer style declarations are camelCase only.

## Documentation

Docs should use one level of visibility:

- Main tables: canonical `camelCase` only.
- Examples: canonical `camelCase` only.
- Importer docs: foreign syntax may be discussed only as input to an importer that outputs canonical TopoViewer style keys.

## Validation And Lint

JSON Schema should validate canonical keys. Semantic lint should report kebab-case style keys as unsupported or unknown. Existing first-party examples must be swept to canonical keys rather than kept alive through renderer aliases.

## Rollout

1. Update docs and examples first so the public contract is clear.
2. Add validation and lint coverage for rejecting non-canonical style keys.
3. Add schema/lint coverage.
4. Update any import path that reads foreign style syntax so translation happens before a TopoViewer document is produced.

## Non-Goals

- Do not convert object model fields such as `source`, `target`, `labels`, `data`, `graph`, or `diagram`.
- Do not change selector syntax.
- Do not support kebab-case style keys as TopoViewer authoring syntax.
- Do not introduce a separate YAML-only casing convention.
