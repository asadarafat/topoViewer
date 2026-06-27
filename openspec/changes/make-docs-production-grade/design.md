## Design

### Documentation architecture

Keep `packages/topoviewer/content/**` as the editable source of truth.

Target public IA:

```text
Overview
Get Started
  First topology
  Browser harness
  MkDocs embed
  React embed
Concepts
  Topology as Code
  Topology vs stylesheet
  Labels vs data
  Layers
  Paths
  Regions
  Attention
  Layout
Guides
  Style a topology
  Add icons
  Build dense diagrams
  Validate YAML
  Debug rendering
Reference
  Topology YAML
  Stylesheet YAML
  Attention YAML/API
  Layout
  MkDocs block
  React/TypeScript API
  Schemas
Examples
  Curated examples
  Generated feature catalog
Integrations
  React
  MkDocs
  Zensical
  Browser harness
  VS Code
  Roadmap integrations
Production
  CI
  Release
  Security
  Performance
Contributing
  Documentation standard
  Adding a feature
```

The final nav can be smaller, but every page must have a clear audience and
job. Avoid dumping all generated examples directly into the main learning path.

### Page contract

Each public content page should declare its purpose implicitly through structure:

- what problem it solves;
- minimal working example when applicable;
- exact YAML/API contract when it is a reference;
- next step links;
- validation or troubleshooting when errors are likely.

Avoid long pages that mix tutorial, conceptual explanation, full reference, and
production policy. Split when a page serves more than one primary user intent.

### Example contract

Every public example README should include these sections or equivalent generated
content:

```markdown
## What This Demonstrates
## Expected Result
## What To Inspect
## Use When
## Common Mistakes
```

Not every example needs a long "Common Mistakes" section, but every example
must at least say what the viewport should show and which YAML fields matter.

Generated example pages should keep the current tab structure:

- Live Viewport;
- Topology YAML;
- Stylesheet YAML;
- Attention YAML only when relevant.

Expected YAML stays internal and must not be shown on public pages.

### Reference generation and checks

Prefer generated or checked references where source-of-truth metadata already
exists:

- style key reference from `styleDefaults.ts`;
- shape values from `nodeShapes.ts` and geometry constants;
- edge arrow/curve/taxi values from edge style constants;
- renderer limits from `limits.ts`;
- TypeScript API inventory from package exports in `src/index.ts`;
- schemas from `packages/topoviewer/schemas/**`.

Do not over-generate prose. Use generation/checks to prevent omissions, while
keeping explanatory prose human-authored.

### API documentation boundary

Every export from `topoviewer` must be classified:

- public stable;
- public experimental;
- public authoring metadata;
- internal but exported for current package needs.

Public stable and experimental exports need docs. Internal exports should either
be removed from the public package surface later or clearly marked as not
supported. This change should document the current state before changing API
surface.

### Integration docs

Supported integration docs must follow one template:

1. status;
2. installation;
3. minimal example;
4. asset/CSS requirements;
5. local preview;
6. production build;
7. validation;
8. troubleshooting;
9. limitations.

Roadmap integrations should stay in roadmap pages and OpenSpec plans, not appear
as supported install paths.

### Docs validation

Add docs checks under existing npm command taxonomy. Candidate commands:

- `npm run docs:lint` for local docs lint checks;
- `npm run ci:docs` includes docs lint, MkDocs build, Zensical build, and smoke
  checks.

Checks should cover:

- generated content sync;
- broken local links and anchors;
- duplicate headings where anchors collide;
- unexpected MkDocs nav/orphan warnings;
- missing required example sections;
- public style keys missing from stylesheet docs;
- public exports missing from TypeScript API docs or stability inventory;
- MkDocs/Zensical critical page parity.

### MkDocs warning policy

Generated pages outside nav are allowed only when explicitly allowlisted by a
docs script. The build should fail when a non-allowlisted Markdown page exists
outside nav.

This turns the current noisy MkDocs warning into a deliberate contract.

### README/docs home boundary

Define page jobs:

- `README.md`: repository orientation, badges, quick local result, package
  layout, contribution basics.
- `docs/index.md`: public documentation landing page and route map.
- `why-topoviewer.md`: product argument, differentiation, and fit/non-fit
  guidance.

Shared fragments can remain, but each page should avoid repeating the same
body-level paragraphs unless they serve the page job.

### Validation strategy

Implementation should be staged:

1. Add docs contract and validation scripts first.
2. Restructure nav and page boundaries.
3. Fill field/API/style references.
4. Upgrade examples.
5. Run MkDocs and Zensical screenshots/smoke tests.
6. Add CI gates only after false positives are removed.

This avoids a large prose-only change that cannot be kept healthy.

## Risks

- Overcorrecting into a huge reference site can make docs harder to use. Keep
  quickstarts and task guides short.
- Full API reference generation can expose unstable exports. Classify stability
  before promising support.
- Example section requirements can become boilerplate. Keep sections concise and
  useful.
- Nav warning enforcement can break generated docs if the allowlist is too
  strict. Start with an explicit allowlist and tighten gradually.
