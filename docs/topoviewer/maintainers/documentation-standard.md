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

Link a guide directly to its prerequisite, worked example, and next useful task.
The left navigation is a reference map; it does not replace a continuous tutorial.
Keep onward links short and specific to the task rather than repeating the full
site navigation.

New public docs paths should mirror the nav section and page label. Preserve
an existing public URL when shortening its title, and record the explicit
label/path exception in the docs lint check. For example,
`Start > First Topology` is authored at
`packages/topoviewer/content/pages/start/first-topology.md` and rendered at
`docs/topoviewer/start/first-topology.md`.

## Use Case Page Contract

Pages under `Integrate` are not reference pages and should not start
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

Public examples should explain the demonstrated behavior, its expected visible
result, and one concrete experiment the reader can repeat. Keep topology and
stylesheet source beside the viewport. Use task-specific prose when a generic
exercise would be misleading, especially for validation and attention examples.

The generator uses authored README prose and actual stylesheet rules to supply
a reviewed feature-specific exercise for legacy entries. Internal assertion names
and test counts belong in `expected.yaml`, not in the reader-facing explanation.

## Executable Documentation

Write a complete pair when advertising a runnable topology. Label filenames and
mark the blocks immediately before their fences:

- `<!-- docs-check: topology example-name -->`
- `<!-- docs-check: stylesheet example-name -->`
- `<!-- docs-check: viewport example-name -->` for a live fence using that pair.
- `<!-- docs-check: mapper -->` for a complete mapper document.
- `<!-- docs-check: validator -->` for the executable JavaScript file validator.

Explicitly label fragments and their prerequisites in the surrounding prose.
All standalone YAML fences must parse; intentional malformed-YAML demonstrations
use `<!-- docs-check: invalid-yaml -->` and must continue to fail parsing.
Use canonical snippet includes when the same file is displayed and rendered.

`npm run docs:examples:check` builds the core package, parses documentation YAML,
validates marked pairs, checks that they render visible objects, and compares
marked live sources with displayed source. It also validates complete mapper
recipes against the schema and runs the documented validator against valid
files and a broken endpoint. The docs CI lane runs the same check.
The browser docs smoke also verifies the first and styled tutorial in both hosts.

## Gallery And Guided Scenarios

The Examples landing page is generated from `packages/topoviewer/content/gallery.json`.
Keep three guided scenarios ahead of the focused pattern library. Each scenario
starts with an operational question and a live diagram, then gives three actions
with observable outcomes. Explain authored or captured data before readers
interpret a status as live telemetry.

Use a consistent visual vocabulary: readable cards, restrained region boundaries,
cyan/teal paths, and amber/red for warning or failure. Show useful names and status
first. Keep raw metadata in inspection and make optional ports or utilization
available through controls. Preserve stable IDs across incident snapshots.

Gallery previews are actual renderer captures. Do not paint substitute diagrams
or retouch screenshots. Maintain canonical source under `content/examples`, then:

```bash
npm run sync:docs
npm run docs:gallery:capture
npm run docs:gallery:check
```

`sync:gallery` updates the landing page without requiring a package build.
`docs:gallery:capture` builds the core library, creates deterministic source ZIPs
and `.tvstudio` archives using Studio's own encoder and decoder, and captures the
published embed renderer. Archives open the initial scenario; the ZIP also
includes alternate states. The gallery manifest records source, renderer, image,
and download hashes so stale previews and bundles fail CI checks.

After building both documentation hosts, run `npm run docs:gallery:smoke`.
Review its desktop, light/dark, and narrow-screen captures. Check initial framing,
node overlap, readable labels, gallery keyboard access, scenario interactions,
download paths, and Studio imports. Keep small reference examples focused; visual
showcases should not add unrelated complexity to beginner tutorials.

## Wording Rules

- Use the exact public support-status labels: `Supported`,
  `Supported Adapter`, `Beta Preview`, `Experimental`, `Lab`, `Roadmap`, and
  `Maintainer`.
- Put `**Support status:** <label>` near the top of every integration-facing
  page.
- Use `Supported` only for implemented, documented, CI-gated behavior intended
  for normal use.
- Use `Supported Adapter` for implemented adapter paths that are not native
  upstream plugin packages.
- Use `Beta Preview` for an externally usable, documented, and CI-gated surface
  whose scope and limitations are explicit but which has not yet met the
  adoption and release-history requirements for `Supported`.
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
npm run docs:examples:check
npm run ci:docs
```

The docs lint gate checks canonical pages, generated examples, style reference coverage, API reference coverage,
public links, and route consistency.

## Diagram design standard

A diagram should answer one question before showing optional detail. Give it a
specific title and a caption that states the takeaway. Explain abbreviations,
color, line styles, direction and the boundary of the view in nearby prose.
Keep the graph facts intact; change the view, spacing or selected layers when
an overview becomes crowded.

Use these checks, adapted from [Dieter Rams’ ten principles](https://www.vitsoe.com/us/about/good-design):

| Principle | Documentation check |
|---|---|
| Innovative | Use interaction to reveal useful detail, rather than adding decoration. |
| Useful | Every object helps answer the question or demonstrate the named feature. |
| Aesthetic | Align comparable objects and use consistent spacing, typography and strokes. |
| Understandable | Name nodes and relationships; explain arrows, boundaries and abbreviations. |
| Unobtrusive | Keep context quiet and give the selected path or state clear emphasis. |
| Honest | Distinguish authored scenarios from live data and preserve actual relationships. |
| Long-lasting | Prefer stable notation and editable source over visual trends. |
| Thorough | Check labels, attachment points, crossings and framing in the rendered view. |
| Environmentally friendly | Reuse native vector symbols and existing rendering tools. |
| As little design as possible | Remove repeated metadata, ornamental shadows and redundant frames. |

Start with 14–16 px node labels, at least 12 px relationship labels and 13 px
callout bodies in source coordinates. Judge the **rendered** size after fitting:
a large canvas can shrink otherwise readable type. Reserve a header lane in
regions; keep leaders outside unrelated node bodies. Side labels need an
explicit maximum width when wrapping is intentional. Avoid long callouts over
network objects; give explanations a separate reading lane.

Review actual captures at the documentation content width, in light and dark
mode, and at a narrow width. An overview must show its primary names without
clipping. Dense detail may require zoom or layer controls; say what to reveal.
Use compact capture heights for small gallery examples rather than filling the
thumbnail with empty space. Preserve demonstrations of wrapping, shapes,
status, density and invalid input instead of making every fixture identical.

The [C4 diagram review checklist](https://c4model.com/diagrams/checklist) provides
useful checks for scope, notation and relationships, even for diagrams that do
not use C4 notation. [Google’s technical illustration guidance](https://developers.google.com/tech-writing/two/illustrations)
reinforces purposeful detail, readable contrast and iterative visual review.
These are design references, not claims of formal compliance or certification.

### Information and notation

Check the model before styling it. Read each connector as a sentence from its
source to its target; its label and arrow must agree. Distinguish physical links,
protocol sessions, ordered traffic paths, component data flow, and explanatory
associations. An undirected session is not a one-way traffic claim. Name payloads
on data-flow arrows; a filesystem artifact may be a node, but an edge label is
not a processing component. Use explicit scope captions for authored scenarios,
captured snapshots, inferred matches, and omitted intermediary objects.

Use [Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/)
and [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
semantics: Services select Pods in their namespace; Deployments manage ReplicaSets,
which manage Pods. Label matches cannot establish ownership. Use captured UID
owner references, and leave absent evidence unknown. A Pod's Running phase does
not establish its Ready condition. Do not invent custom-resource containment.

In Grafana, [panel plugins consume data frames from data sources](https://grafana.com/developers/plugin-tools/how-to-guides/panel-plugins/).
Verify plugin boundaries against the implementation; TopoViewer's bundle backend
serves source files rather than querying Prometheus. In spine/leaf diagrams,
verify every stated leaf-to-spine connection. Explain custom role symbols; do not
imply UML, flowchart, or vendor notation merely by using a diamond or cylinder.

Renderer acceptance must check visible SVG geometry as well as layout boxes:
floating and parallel links touch the rendered outline, named ports retain their
attachment, circles remain circular, and hidden 3D edges are dashed or omitted.
A feature fixture may demonstrate generic geometry without asserting engineering
projection or protocol semantics.

### Color palette

Use the shared renderer's graphite and paper surfaces. Most devices and ordinary
connections should stay neutral; tint a card lightly when its role matters.
Use blue for emphasis, teal for the reverse direction or a control relationship,
and muted violet for service overlays. Warning and failure examples use amber
and rose red. A shape or color-control fixture may demonstrate additional hues;
explain them rather than treating them as operational status.

Keep text on theme-aware surfaces with `--topoviewer-fg-strong` or
`--topoviewer-fg-muted`. Use the theme's paired foreground and accent colors for
filled controls. Avoid white text on pastel cards and pale icons on paper.
Retain labels, directional arrows, dashed alternatives, and status cues so
meaning survives when colors are difficult to distinguish.

The palette follows the neutral foundation and purposeful accents described in
[IBM's color guidance](https://www.ibm.com/design/language/color/), with redundant
color and line-style cues from its [architecture diagram guidance](https://ibm.github.io/itaa-docs/Archi-diagrs-v3.pdf).

## Reader Journey Acceptance

Documentation changes have an editorial owner: the contributor proposing the
change. A maintainer reviews task completion and semantic correctness before
publication. Generated output has the same acceptance criteria as authored text.

- Keep published paths stable when changing navigation labels. Get started,
  Author diagrams, Integrate, Examples, Reference, Troubleshoot and upgrade,
  and Contribute have distinct reader tasks.
- Display the development/release identity. Installation recipes name their
  tested package version. Record the source revision in publication metadata.
- Execute literal tutorial steps, including edits, and compare the resulting
  document with the displayed complete file. A parser-only check is insufficient.
- Each pattern exercise changes the feature named by its page. Store its reviewed
  mutation and expected visible outcome in `content/examples/experiments.json`;
  validate that mutation in the documentation check.
- Generate field signatures and constraints from schemas/types, with reviewed
  behavior notes. Keep each object independently searchable and readable.
- Review diagrams for scope, relationship meaning, direction, and legends.
  Physical adjacency, control sessions, ownership, and traffic flow need distinct
  semantics. A themed screenshot alone does not prove diagram correctness.
- Verify normal keyboard traversal, search controls, text contrast, fresh mobile
  loads, viewport resize, expand/fit, and recovery after an invalid input.
- Run `npm run docs:journeys` against both built hosts. Store the report and
  screenshots with the CI artifacts; check meaningful failures rather than
  declaring a full accessibility conformance claim from automation alone.

A release review must exercise a fresh consumer install, customization,
intentional validation failure and repair, nested deployment paths, and source
export/reopen. Record the release version, browser, host, and observed outcome.
