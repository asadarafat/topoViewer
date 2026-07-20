# Design Review Checklist

Use this checklist before adding or changing any public TopoViewer contract:
React exports, YAML fields, stylesheet keys, mapper capabilities, docs embed
options, Grafana panel options, schemas, examples, or generated docs behavior.

## Public Surface Classification

| Question | Required answer before merge |
|---|---|
| Is the surface Supported, Supported Adapter, Experimental, Lab, Roadmap, Maintainer, Advanced, or Internal? | Add the status to docs or explicitly keep the surface internal. |
| Is this a public package export? | Update `packages/topoviewer/api-report.md` and API docs. |
| Is this an authored YAML field? | Update schema, object reference, examples, YAML assist, and validation tests. |
| Is this a style key? | Update style metadata, defaults, schema, docs, examples, render parity if geometry changes, and YAML assist. |
| Is this a mapper field or overlay? | Update mapper schema, Studio assist, Grafana docs, coverage diagnostics, and mapper tests. |
| Is this only for a lab? | Label it Lab and keep it out of the stable first-run path. |

## Compatibility Review

| Check | Pass condition |
|---|---|
| Existing examples | Previously documented YAML still renders or fails with an explicit migration diagnostic. |
| SemVer | Breaking changes include release notes and migration guidance. |
| Schema versioning | New document semantics have a version or migration strategy. |
| Dashboard compatibility | Grafana option changes include migration/default behavior. |
| Docs embed compatibility | MkDocs/Zensical block option changes are additive or documented. |

## Security Review

| Input touched | Required checks |
|---|---|
| YAML parser or schema | YAML abuse tests for depth, size, aliases, duplicate keys, and malformed partial edits. |
| SVG, HTML, labels, Markdown, or callouts | Hostile corpus test covering script, event, URL, CSS, and encoded bypasses. |
| Mapper templates or telemetry labels | Tests proving telemetry cannot produce executable HTML, CSS injection, invalid SVG, or broken React attributes. |
| Grafana mounted files | Backend tests for root allowlist, traversal, symlinks, size, encoding, duplicates, and redaction. |
| Package or docs artifact | Artifact autopsy remains clean for secrets, local paths, debug dumps, and stale routes. |

## Runtime Review

| Concern | Required evidence |
|---|---|
| Renderer geometry | MkDocs and Zensical parity if shape, label, icon, region, edge, or arrow layout changes. |
| Performance | Benchmark or documented budget impact for layout, render, mapper overlays, docs embeds, or Grafana refresh. |
| Diagnostics | Bad input produces actionable diagnostics without corrupting source YAML or freezing the UI. |
| Accessibility | Keyboard/focus and non-color status behavior are documented or explicitly best-effort. |
| SSR/host integration | React docs explain browser-only behavior, lazy loading, or fallback where relevant. |

## Documentation Review

| Artifact | Required update |
|---|---|
| README/docs home | Update only if the first-run story or support status changes. |
| Guide page | Add task-oriented usage if a normal user must learn the feature. |
| Reference page | Add accepted values, data type, default behavior, validation, selector/mapper implications, and YAML cue. |
| Curated example | Add focused YAML and expected visual result for user-facing behavior. |
| Troubleshooting | Add failure mode if the feature can produce a likely user error. |

## Merge Gate

Before merge, run the smallest relevant lane and record it in the change:

```bash
npm run docs:lint
npm run public-readiness
npm run ci:generated
```

Run `npm run ci` before release, archive, or public-readiness claims.
