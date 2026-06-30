# Documentation Standard

Every feature that changes TopoViewer behavior must update documentation at the
same time as code. The goal is simple: a user should be able to discover the
feature, copy a working YAML example, understand accepted values, and validate
the result locally.

## Required Artifacts

| Change type | Required docs |
|---|---|
| New YAML field | Concept or task guide, reference table, schema update, example, validation test. |
| New style key | Stylesheet reference row with accepted values and defaults, example, schema/lint coverage, YAML assist metadata. |
| New layout mode | Layout guide, option table, diagnostics, small example, benchmark or budget note when relevant. |
| New integration | Integration handbook with install, config, local preview, paths, limitations, and troubleshooting. |
| New public API | TypeScript API reference entry with stability label and intended use. |
| New example | README explanation, topology YAML, stylesheet YAML, expected test metadata, generated public page. |

## Page Jobs

| Page | Job |
|---|---|
| `README.md` | Product position, first local result, published links, package map. |
| Docs home | Route readers to get started, concepts, guides, references, examples, integrations, and production docs. |
| Why TopoViewer | Explain the problem, positioning, and difference from generic diagram tools. |
| Guides | Teach a task with working YAML and next steps. |
| References | Enumerate fields, accepted values, defaults, and constraints. |
| Examples | Show one behavior clearly with live viewport and YAML. |

## Guide Page Budget

Task guides should stay short enough to finish in one sitting. The docs lint
gate enforces the current budget:

| Page class | Budget | Action when exceeded |
|---|---:|---|
| Task guide | 320 lines | Split exhaustive material into Reference, Examples, or Maintainers. |
| Integration guide | 480 lines | Move API, option, and troubleshooting tables to Reference or a lab handbook. |
| Reference, Lab, Maintainer | No task-guide budget | Keep out of the primary Start path and provide task-guide links back to common workflows. |

Use a task guide for the shortest successful path. Put complete attribute
tables, all enum values, compatibility notes, hardening procedures, and lab
runbooks in reference-like pages.

Major guide pages must include a `## Next Steps` section with local links to
the next useful guide, reference, example, or integration page. Do not leave
readers at a dead end or send them to source-code internals when a public docs
page exists.

## Example README Contract

Public examples must render these sections:

- `What This Demonstrates`
- `Expected Result`
- `What To Inspect`
- `Use When`

The source README may provide all sections manually. If it only provides short
legacy prose, the generator wraps that prose into the required public structure.

## Wording Rules

- Use the exact public support-status labels: `Supported`,
  `Pre-Publish Supported`, `Supported Adapter`, `Experimental`, `Lab`,
  `Roadmap`, and `Maintainer`.
- Put `**Support status:** <label>` near the top of every integration-facing
  page.
- Use `Supported` only for implemented, documented, CI-gated behavior intended
  for normal use.
- Use `Pre-Publish Supported` when source behavior is implemented,
  documented, and CI-gated, but the public package release is still pending.
- Use `Supported Adapter` for implemented adapter paths that are not native
  upstream plugin packages.
- Use `Experimental` for implemented behavior that is not yet release-grade.
- Use `Lab` for disposable validation environments.
- Use `Roadmap` for planned behavior with no stable implementation.
- Use `Maintainer` for repository maintenance workflows, not user-facing
  product surfaces.
- Do not describe studies or planned integrations as supported integrations.
- Do not expose local absolute paths in public docs.

## Validation

Run these before publishing docs:

```bash
npm run sync:docs
npm run docs:lint
npm run ci:docs
```

The docs lint gate checks canonical pages, generated examples, guide next-step
links, style reference coverage, API reference coverage, public links, and
route consistency.
