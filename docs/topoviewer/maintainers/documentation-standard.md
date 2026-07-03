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
| Docs home | Route readers through the same journey defined in `mkdocs.yml`. |
| Why TopoViewer | Explain the problem, positioning, and difference from generic diagram tools. |
| Guides | Teach one task with working YAML and clear placement in the nav. |
| References | Enumerate fields, accepted values, defaults, and constraints. |
| Examples | Show one behavior clearly with live viewport and YAML. |
| Use cases | Put a replicable TopoViewer application on the main stage, then explain the UX and DevX pattern needed to reproduce it. |

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

Do not add end-of-page wayfinding sections to public docs. The left nav, page
table of contents, and search are the navigation model.

Public docs paths must mirror the nav section and page label. For example,
`Start > First Topology` is authored at
`packages/topoviewer/content/pages/start/first-topology.md` and rendered at
`docs/topoviewer/start/first-topology.md`.

## Use Case Page Contract

Pages under `Examples > Use Cases` are not reference pages and should not start
by explaining what TopoViewer is. Their job is to give the reader a quick,
replicable application of TopoViewer.

A use-case page must:

- put the runnable or published result near the top of the article;
- give the reader a quick win before deep explanation;
- describe the practical UX loop first: what to open, edit, apply, inspect, and
  export;
- describe the DevX loop next: what files, scripts, schemas, or generated
  bundles make the workflow repeatable;
- explain implementation details only after the reader understands the workflow;
- keep local setup in collapsible admonitions when a hosted path exists;
- avoid becoming a product overview, support matrix, or exhaustive field
  reference.

The expected storyline is:

```text
try it
  -> repeat the useful workflow
  -> understand the files and commands
  -> inspect how TopoViewer implements the pattern
  -> adapt the pattern to the reader's own topology
```

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
  `Supported Adapter`, `Experimental`, `Lab`, `Roadmap`, and `Maintainer`.
- Put `**Support status:** <label>` near the top of every integration-facing
  page.
- Use `Supported` only for implemented, documented, CI-gated behavior intended
  for normal use.
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
