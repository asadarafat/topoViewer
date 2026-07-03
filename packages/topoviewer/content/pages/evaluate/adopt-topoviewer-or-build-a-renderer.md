# Adopt TopoViewer Or Build A Topology Renderer

The real decision is not whether your team can draw topology diagrams. It can.
The decision is whether topology should remain a picture, or become a semantic
asset that can be validated, styled, embedded, and connected to runtime state.

For a one-off architecture sketch, TopoViewer is probably too much machinery.
Use a drawing tool, Mermaid, Excalidraw, diagrams.net, or whatever helps the
team communicate quickly.

TopoViewer becomes relevant when the same topology needs to survive beyond one
page or one dashboard. That is where screenshots and hand-drawn diagrams start
to rot: object names drift, links change, visual conventions fork, dashboards
show metrics without location, and nobody can review the diagram as data.

TopoViewer’s bet is simple: keep topology identity in YAML, keep visual policy
in a stylesheet, and let each surface render the same model consistently.

## The Evaluation Question

Ask this first:

> Does this diagram describe infrastructure that has stable objects, repeated
> readers, or operational consequences?

If the answer is no, do not force TopoViewer into the workflow.

If the answer is yes, the next question is sharper:

> Do you want to own the full topology-as-code platform yourself, or adopt a
> renderer with schemas, examples, docs integration, and operational mapping
> already defined?

That is the adoption decision: reuse TopoViewer as the topology-as-code
foundation, adapt it inside your own product, or build a topology renderer and
authoring workflow yourself.

## What You Would Need To Build Internally

Building this internally sounds smaller than it is because the first demo is
usually just boxes and lines. The production work appears later.

You would need a topology model with stable IDs, layers, nodes, links, paths,
regions, metadata, validation, migration behavior, examples, and field-level
documentation.

You would need a stylesheet language with selectors, defaults, accepted values,
conflict behavior, style inheritance, editor help, and a way to explain why one
object looks different from another.

You would need a renderer that handles geometry, labels, icons, region bounds,
edge routing, arrows, direction lanes, attention/focus, collapsed groups,
selection, export, theme behavior, and host application callbacks.

You would need authoring tools because raw YAML without feedback becomes a tax.
That means schema-aware editing, diagnostics, examples, apply/revert behavior,
export, object picking, and enough guardrails that users can recover from bad
YAML without guessing.

You would need integration contracts for docs, React products, and operational
dashboards. Each surface brings its own failure modes: asset paths, hydration,
dark mode, static builds, data refresh, panel lifecycle, and screenshot or
export behavior.

You would need security and compatibility discipline: SVG sanitization, hostile
content tests, mounted-file safety, renderer limits, dependency triage, package
artifact inspection, API reports, schema drift checks, and release gates.

That is the hidden cost. The expensive part is not drawing the first diagram.
The expensive part is keeping the tenth surface and hundredth diagram boring.

## Where TopoViewer Has Leverage

TopoViewer is useful when topology has identity.

A node is not only a rectangle. A link is not only a line. A region is not only
a background color. A path is not only a hand-drawn arrow. Those objects can be
referenced, styled, filtered, validated, tested, and mapped to telemetry.

The strongest fit is a team that wants one topology model to appear in multiple
places:

- React applications and internal portals;
- MkDocs and static documentation;
- the browser harness during authoring;
- Grafana dashboards when telemetry is available;
- generated exports for review or reporting.

The same model does not mean every surface has the same UX. It means the object
identity and visual policy are not rewritten from scratch every time.

TopoViewer also has leverage when styling should be a policy rather than a
manual choice. Selectors can target labels, data, object kinds, status, or
telemetry-driven state. That makes visual conventions reusable across examples,
products, and environments.

For operations, the mapper layer keeps source topology separate from runtime
state. Telemetry can change a link color or node badge without mutating the
topology YAML. That separation matters when a dashboard should explain what is
happening now without corrupting the stable model.

## When To Adopt TopoViewer

Adopt TopoViewer when most of these are true:

- the diagram objects have stable identities;
- the same topology should render in more than one surface;
- style consistency matters across diagrams or teams;
- validation and reviewability matter more than freeform drawing speed;
- topology may eventually come from source-of-truth data;
- runtime overlays are useful, but should not rewrite the topology model;
- your chosen surface is within the documented support status.

This is the common path for teams building infrastructure docs, internal
platform views, network topology pages, service maps, or operational dashboards
where diagram drift is already painful.

## When To Adapt TopoViewer

Adapt TopoViewer when the model is right but the product surface is yours.

Examples:

- embedding the React runtime into an internal platform;
- generating `topology.yaml` from NetBox, Kubernetes, Infrahub, Containerlab, or
  a private inventory API;
- adding a custom style preset for a company design system;
- wrapping validation in an internal CI policy;
- building a Grafana bundle workflow around an existing telemetry convention;
- hiding experimental controls and exposing only approved authoring paths.

This path treats TopoViewer as a rendering and schema foundation, not as the
entire product. That is usually the right compromise for mature platform teams:
reuse the boring topology machinery, own the product workflow around it.

## When To Build Your Own

Build your own if the core assumptions do not fit.

TopoViewer is not a hosted diagram SaaS. It is not a general whiteboard. It is
not meant to replace every graph visualization library. It is not the right
choice if your primary need is freeform drawing, pixel-perfect presentation
design, or a completely custom interactive canvas with no interest in the YAML
model.

Building internally can also make sense when your production requirement depends
on a TopoViewer roadmap or lab surface that is not supported yet, or when your
security, accessibility, tenancy, or lifecycle requirements require controls
that the current project does not provide.

## When Not To Use TopoViewer

Do not use TopoViewer when:

- the output is a one-off illustration;
- the team does not want YAML, schemas, or code review for diagrams;
- the diagram has no stable object identity;
- a drawing tool is faster and good enough;
- the required integration is only a roadmap item today;
- the current accessibility or security posture is not enough for your use case.

Using a smaller tool for a smaller job is not a failure. It is the correct
engineering decision.

## Adoption Test

TopoViewer is a fit when the answer is yes to all five questions:

1. Do the diagram objects have stable IDs or names?
2. Will the topology be reused across docs, products, dashboards, or exports?
3. Should visual policy be reusable instead of manually redrawn?
4. Would validation, diffing, or CI review reduce real operational risk?
5. Can the team accept the documented support status for the surface it needs?

If one or two answers are no, adapt TopoViewer carefully or wait.

If most answers are no, do not adopt it. Draw the diagram and move on.
