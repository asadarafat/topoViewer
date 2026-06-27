# Brutal Documentation Audit

## Verdict

The docs are useful, but they are not production-grade yet.

They prove that TopoViewer has many capabilities, but they do not yet guide a
new user from "what is this?" to "I can confidently author, embed, validate,
debug, and ship a diagram." The current docs read like a rapidly growing
engineering notebook: strong feature coverage in some places, thin explanations
in others, and too much reliance on generated examples to carry the teaching
burden.

## What Is Working

- The canonical content root under `packages/topoviewer/content/**` is the right
  foundation. It prevents the worst source-of-truth drift between package docs,
  MkDocs, Zensical, and examples.
- Live viewport examples with topology YAML and stylesheet YAML are a strong
  differentiator. This is the right format for Topology as Code.
- The docs already contain serious content for authoring, attention, React,
  production hardening, schema validation, and stylesheet style keys.
- The example catalog is test-backed, which is better than most project docs.
- MkDocs and Zensical are both part of the build, so multi-surface docs parity is
  already treated as product behavior.

## Critical Gaps

### 1. No Clear Learning Path

The homepage and README explain the idea, but they do not provide a concrete
first-session path. A new user has to infer whether to start with the browser
harness, MkDocs, React, schemas, examples, or the authoring model.

The docs need explicit journeys:

- "Create your first topology."
- "Style an existing topology."
- "Embed in MkDocs."
- "Embed in React."
- "Author with the browser harness."
- "Validate in CI."
- "Debug why a diagram does not render."

Without these, the docs feel comprehensive only to someone who already knows the
system.

### 2. The Information Architecture Mixes Product, Model, Reference, And Examples

The current nav has useful groups, but the boundaries are weak:

- `Product` explains positioning.
- `Model` mixes conceptual guides and reference pages.
- `Examples` is really a generated feature catalog.
- `Integration` mixes supported, adapter, experimental, and roadmap surfaces.
- `Production` contains operational guidance but is not tied into authoring
  workflows.

This makes the docs hard to scan. The site needs a clearer separation:

- overview and quickstarts;
- concepts;
- task guides;
- reference;
- examples;
- integrations;
- production and release.

### 3. Reference Model Is Not A Complete Field Reference

`reference-model.md` explains the object model, but it is not detailed enough to
be a reliable reference. It lacks complete field tables for:

- `graph.layers`;
- `graph.nodes`;
- `graph.links`;
- `graph.paths`;
- `graph.regions`;
- `diagram.shapes`;
- `diagram.callouts`;
- `diagram.pins`;
- `toggles`;
- `layout`;
- `layout.clos`;
- `limits`;
- `icons`;
- `labelFields`;
- top-level `attention`.

Each field needs type, required/optional state, default behavior, accepted
values, validation rules, interactions, and a small example. Right now a user
must read schemas or source code to answer too many normal authoring questions.

### 4. Stylesheet Reference Is Too Monolithic

`stylesheet.md` is one of the strongest pages, but it is doing too much in one
place. It combines selector syntax, layout, defaults, node sizing, icon fit,
style key tables, and practical patterns.

The style key tables are useful, but authors need faster lookup by target kind:

- node body and labels;
- node icons, badges, and status;
- edge line, routing, arrows, and labels;
- paths;
- regions;
- shapes;
- callouts;
- shared label and z-index controls.

The page should be generated or checked against the canonical style defaults
registry. If a style key exists in runtime, docs must explain the key, accepted
values, default behavior, and at least one practical use.

### 5. Examples Are Too Thin

Most example `README.md` files are under 40 words. They name the feature, but
they rarely explain:

- what the user should expect to see in the Live Viewport;
- which YAML lines matter;
- what interaction to try;
- what mistake the example prevents;
- when to use the feature in a real topology.

The live viewport / topology YAML / stylesheet YAML pattern is good, but the
prose around each example needs a standard shape:

- "What this demonstrates";
- "What to inspect";
- "Expected result";
- "Use when";
- "Common mistakes" when relevant.

### 6. Attention Is Powerful But Still Hard To Understand

The attention page is deep and API-rich, but it is not beginner-friendly enough.
The user needs a practical mental model before the API details:

- click object -> focus object;
- click empty canvas -> reset;
- path focus -> path and traversed nodes are emphasized;
- region collapse -> summary node replaces members until expanded;
- dependency focus -> directed neighbors are related;
- hide context -> non-matching graph is hidden.

The docs should explicitly connect topology declarations to visual outcomes and
interactions. Attention is one of TopoViewer's differentiators, so this area
needs tutorial-quality docs, not only a reference.

### 7. Layout Guidance Is Scattered

Manual, force, and CLOS behavior is documented across `authoring.md`,
`reference-model.md`, `stylesheet.md`, and examples. The content is real, but a
user has to assemble it mentally.

There should be a dedicated layout guide with:

- mode decision table;
- manual position persistence rules;
- force layout rules and limitations;
- generic CLOS inference rules;
- when to use `stageKey`, `stageOrder`, `groupKey`, and `inferLabelRole`;
- pinning/preserve behavior;
- diagnostics and ambiguity handling;
- small and dense examples.

### 8. TypeScript API Coverage Is Incomplete

`react.md` documents `TopoViewer`, props, attention APIs, static export, and
some extension guidance. It does not comprehensively cover all exported package
APIs and their intended stability:

- `compileTopoGraph`;
- `composeTopoViewerDocument`;
- `validateTopoDocument`;
- `lintTopoDocument`;
- renderer limits helpers;
- migration helpers;
- CLOS diagnostics/layout helpers;
- style metadata/default helpers;
- shape constants/helpers;
- static export APIs;
- attention cache/runtime helpers.

External users will treat exported APIs as contracts. The docs need a generated
or checked API inventory so exports do not silently drift beyond documentation.

### 9. Integration Docs Do Not Yet Feel Like Handbooks

React, MkDocs, Zensical, and browser harness docs exist, but the supported
surfaces need task-focused handbooks:

- install;
- minimal example;
- required CSS/assets;
- local preview;
- production build;
- validation;
- troubleshooting;
- known limitations;
- upgrade expectations.

The integration roadmap is useful but should not substitute for supported
surface documentation.

### 10. Docs Build Warnings Are Too Noisy

`docs:build:fast` currently accepts many "pages exist but are not included in
nav" warnings. Generated raw example pages may be intentionally unlisted, but
the warning stream is too noisy to catch real orphaned pages.

Production-grade docs need either:

- an explicit allowlist for intentionally unnaved generated pages; or
- a generation layout that avoids producing pages MkDocs treats as nav-worthy.

### 11. README, Docs Home, And Why Page Still Overlap

The shared fragments help, but `README.md`, `docs/index.md`, and
`why-topoviewer.md` still repeat much of the product pitch. Some overlap is
expected, but the boundaries should be explicit:

- README: repository orientation and fast local result.
- Docs home: public product landing and guided route.
- Why TopoViewer: product argument and comparison.

Each page should answer a distinct question.

### 12. Search And Terminology Are Not Controlled

The docs use related terms without a visible glossary or controlled vocabulary:

- topology;
- graph;
- diagram;
- model;
- stylesheet;
- layer;
- attention;
- focus;
- aggregate;
- region;
- path;
- shape;
- callout;
- harness;
- adapter.

New users need a glossary and consistent terminology rules. This matters because
TopoViewer is positioning itself as Topology as Code, not just a renderer.

### 13. Troubleshooting Is Fragmented

Troubleshooting appears indirectly in production hardening, schemas, and
integration pages. A user debugging a blank viewport, missing link, unsafe
image, bad selector, wrong path, stale generated docs, or GitHub Pages path
issue has no single "what went wrong?" page.

### 14. Public Examples Need Visual Acceptance Criteria

The examples are test-backed, but the docs do not state what visual outcome is
expected. That caused repeated confusion around icon fit, glyph placement,
label placement, link attachment, and renderer parity.

Each example should define observable expectations in prose, and critical visual
examples should have Playwright screenshot coverage or a documented visual
tolerance.

### 15. Contribution Rules Are Not Front-And-Center

The project has evolved a strong workflow:

- OpenSpec before larger changes;
- canonical content under `packages/topoviewer/content/**`;
- generated projections;
- examples as tests;
- MkDocs/Zensical parity;
- harness coverage where relevant.

Those rules are not exposed as a concise contributor-facing docs standard. A
new feature can still land with code but incomplete docs unless the checklist is
made explicit.

## Highest-Impact Fix

Do not start by adding random paragraphs.

Start by defining a docs contract:

1. every public capability has a concept page or task guide;
2. every public YAML field has reference coverage;
3. every public style key has generated/checked reference coverage;
4. every exported TypeScript API is either documented or explicitly internal;
5. every example explains expected behavior and relevant YAML;
6. every supported integration has a handbook;
7. every docs warning is either eliminated or explicitly allowlisted.

Then restructure the site around user journeys and generate/check reference
coverage from canonical sources.
