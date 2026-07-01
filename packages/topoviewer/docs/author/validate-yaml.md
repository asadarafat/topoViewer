# Validate YAML

TopoViewer validation has two layers: schema validation and semantic lint.

## Schema Validation

Schema validation checks the shape of the document: required fields, accepted
types, enum values, and known object sections.

```bash
npm run validate:schemas
```

## Semantic Validation

Semantic lint checks graph meaning: missing endpoints, duplicate IDs, invalid
layer references, unsafe style values, layout conflicts, and renderer limits.

```bash
npm run validate:semantics
```

## CI Command

Use the full local CI command before publishing:

```bash
npm run ci
```

For docs-only changes:

```bash
npm run ci:docs
```

## Editor Setup

The browser harness and VS Code webview use the same schema and style metadata
where possible. Completion should suggest valid keys and typed values based on
the current YAML location.
