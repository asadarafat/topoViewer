# Adopt TopoViewer Or Keep Topology Locked To A Surface

The real decision is not whether your team can draw topology diagrams.

It can.

The real decision is whether topology should remain trapped inside one drawing,
one documentation page, one dashboard, or one exported image — or become a
semantic asset that can be validated, styled, reused, embedded, reviewed, and
connected to runtime state.

For a one-off architecture sketch, TopoViewer is probably too much machinery.
Use Mermaid, Excalidraw, diagrams.net, PowerPoint, Visio, a whiteboard, or
whatever helps the team communicate quickly.

Those tools are useful because they are fast.

But speed is not the same as durability.

TopoViewer becomes relevant when the same topology needs to survive beyond one
diagram. That is where screenshots and hand-drawn diagrams start to rot: object
names drift, links change, visual conventions fork, dashboards show metrics
without location, and nobody can review the diagram as infrastructure data.

TopoViewer’s bet is simple:

> Keep topology identity in YAML, keep visual policy in a stylesheet, and let
> many surfaces render the same model consistently.

That is the adoption decision.

Not:

> Can we draw this?

But:

> Should this topology live as a portable YAML bundle that can be rendered,
> validated, styled, mapped, and deployed across multiple surfaces?

## The Evaluation Question

Ask this first:

> Does this diagram describe infrastructure that has stable objects, repeated
> readers, or operational consequences?

If the answer is no, do not force TopoViewer into the workflow.

Use a drawing tool and move on.

If the answer is yes, the sharper question is:

> Do we want every tool to own its own version of the topology, or do we want one
> topology bundle that can be reused everywhere?

That is where TopoViewer starts to matter.

## Existing Diagram, Dashboard, And Source-Of-Truth Tools Are Still Useful

TopoViewer should not pretend that existing tools are bad.

They are not.

Mermaid is excellent for lightweight docs-as-code diagrams.
Excalidraw is excellent for fast collaborative thinking.
diagrams.net is excellent for polished manual diagrams.
React Flow, Cytoscape, and D3 are excellent graph rendering libraries.
Grafana panels are excellent for operational metrics.
NetBox, Infrahub, Kubernetes, Containerlab, and inventory APIs are excellent
sources of infrastructure data.

The issue is not whether these tools are useful.

The issue is that each tool usually owns only one part of the topology workflow.

Drawing tools help humans create diagrams.
Graph libraries help developers render interactive views.
Dashboards help operators see runtime state.
Source-of-truth systems help infrastructure teams manage inventory and intent.

TopoViewer sits between these worlds.

It does not replace all of them. It gives them a shared topology bundle to work
from.

Instead of every documentation page, dashboard, portal, and export inventing its
own version of the topology, TopoViewer provides a portable model:

```text id="bz8s9f"
source-of-truth data
      ↓
converter / adapter
      ↓
TopoViewer YAML bundle
      ↓
docs, portals, dashboards, exports
```

That is the difference.

Mermaid, Excalidraw, diagrams.net, React Flow, Grafana, NetBox, Infrahub,
Kubernetes, and Containerlab can all remain useful.

TopoViewer’s role is to make sure the topology identity, styling policy, and
runtime mapping do not have to be reinvented separately in each surface.

## The Usual Workflow Without TopoViewer

Most teams already have topology diagrams. They are usually spread across many
places:

* a Mermaid diagram in documentation;
* an Excalidraw or diagrams.net sketch in a design page;
* a screenshot in a slide deck;
* a custom React graph inside an internal portal;
* a Grafana dashboard showing runtime metrics;
* a vendor diagram in a PDF;
* a manually updated operational map;
* a topology view generated from inventory data.

Each surface may solve its local problem.

The problem is that each surface also becomes its own source of truth.

The documentation has one naming convention.
The dashboard has another.
The portal has its own object model.
The slide deck has an old screenshot.
The operational view has metrics, but not always clean topology identity.
The inventory system has data, but not always a human-readable visual policy.

The result is diagram drift.

The diagram may look correct, but nobody knows whether it still matches the
infrastructure.

This creates a quiet operational tax.

Every surface needs its own update path.
Every visual convention must be repeated.
Every integration invents its own object names.
Every migration becomes manual cleanup.
Every stale diagram becomes a small trust failure.

That is acceptable for simple diagrams.

It becomes painful when topology is part of how people understand, operate, or
review infrastructure.

## The TopoViewer Workflow

TopoViewer changes the workflow from drawing-first to model-first.

Instead of creating a topology directly inside one tool, the team maintains a
portable topology bundle:

```text id="2a4v8x"
topology.yaml      stable topology identity
stylesheet.yaml    visual policy
mapper.yaml        runtime binding, when telemetry is used
assets/            optional icons, images, and supporting files
schemas/           validation and editor support
```

The same bundle can then be rendered in different surfaces:

* documentation;
* browser authoring harness;
* React applications;
* internal portals;
* Grafana dashboards;
* generated exports;
* review or reporting workflows.

The important point is not that every surface must have exactly the same user
experience.

A documentation page, a Grafana dashboard, and an internal portal may all expose
different controls.

The important point is that every surface starts from the same topology identity
and the same visual policy.

A node remains the same node.
A link remains the same link.
A region remains the same region.
A path remains the same path.
A style rule remains reusable.
A telemetry mapping can point to stable objects instead of guessed labels.

That is the core value.

TopoViewer does not replace every visualization tool.

It gives teams a topology model that can travel between tools.

## Why The YAML Bundle Matters

The strongest reason to adopt TopoViewer is not the renderer alone.

It is the bundle.

A TopoViewer YAML bundle can be reviewed like code.
It can be validated in CI.
It can be generated from source-of-truth systems.
It can be rendered in documentation.
It can be embedded in a React product.
It can be used in Grafana with telemetry overlays.
It can be exported for reports.
It can survive beyond one page.

That portability is the main difference from most diagram workflows.

A screenshot cannot do that.
A hand-drawn canvas usually cannot do that cleanly.
A one-off dashboard panel usually cannot do that across products and docs.
A graph library can render topology, but it does not define the full topology
workflow by itself.
A source-of-truth system may own inventory, but it does not automatically define
how the topology should be styled, reviewed, embedded, and reused across
surfaces.

TopoViewer’s value is that the same topology asset can travel.

## Topology Identity Is The Foundation

TopoViewer is useful when topology has identity.

A node is not only a rectangle.
A link is not only a line.
A region is not only a background color.
A path is not only a hand-drawn arrow.

Those objects can be referenced, styled, filtered, validated, tested, reviewed,
and mapped to runtime state.

That matters when the topology is reused.

For example, a network topology may appear in:

* a product documentation page;
* an internal platform view;
* a Grafana dashboard;
* a customer-facing report;
* a browser-based authoring harness;
* a CI validation workflow.

Without a shared model, each surface slowly becomes a separate copy.

With TopoViewer, the topology bundle becomes the shared contract.

The renderer may change.
The dashboard may change.
The documentation site may change.
The source-of-truth system may change.

But the topology identity can remain stable.

## Visual Policy As Code

TopoViewer also has leverage when visual style should be a policy, not a manual
decision.

In many teams, diagram style is tribal knowledge.

Core routers are drawn one way.
Aggregation nodes are drawn another way.
Critical links are highlighted manually.
Regions use inconsistent colors.
Operational status is copied into screenshots.
Different teams invent different visual meanings.

TopoViewer moves that into a stylesheet.

Instead of manually changing every diagram, the team can define style rules once
and apply them consistently.

Selectors can target object kind, labels, metadata, layer, role, status, or
runtime state. That makes visual conventions reusable across examples, products,
and environments.

This is especially important when diagrams are reviewed by many people.

A consistent visual language reduces explanation cost.

## Runtime State Without Corrupting The Topology

Operational diagrams have another problem: runtime state changes constantly, but
topology identity should not.

A link may be congested today.
A node may be down now.
A path may be active for one incident.
A metric may cross a threshold for ten minutes.

That should not mutate the stable topology model.

TopoViewer separates these concerns.

The topology YAML describes stable objects.

The stylesheet describes how objects should look.

The mapper describes how runtime samples map onto topology objects.

The runtime surface can then overlay status, color, badges, labels, or attention
states without rewriting the topology itself.

This separation matters.

A dashboard should explain what is happening now.

It should not corrupt the long-lived model of what the infrastructure is.

## The Converter And Adapter Question

A serious adopter may still need to build a converter or adapter.

That is not a weakness.

It is usually the correct architectural boundary.

Most mature infrastructure teams already have topology-like data somewhere:

* NetBox;
* Infrahub;
* Kubernetes;
* Containerlab;
* inventory APIs;
* CMDBs;
* vendor controllers;
* spreadsheets;
* private databases;
* Terraform or Crossplane state;
* generated service models.

TopoViewer should not pretend that all of these sources naturally speak the same
language.

The practical pattern is:

```text id="yyh8r5"
source of truth
      ↓
converter / adapter
      ↓
TopoViewer YAML bundle
      ↓
many render surfaces
```

Yes, the converter must be built and maintained.

But that converter is valuable work because it makes the boundary explicit.

It forces the team to answer important questions:

* What is the stable ID of this object?
* Which data belongs to topology identity?
* Which data belongs to visual policy?
* Which data belongs to runtime state?
* Which source owns truth?
* What should happen when names change?
* What should be validated before publishing?
* What should be rejected in CI?

Those questions exist anyway.

Without a converter, they are answered informally inside dashboards, scripts,
screenshots, manual diagrams, and one-off exports.

With a converter, they become reviewable engineering decisions.

That is good practice.

The converter is not just glue code.

It is the contract between source-of-truth data and human-readable topology.

## Why Maintaining A Converter Can Be A Strength

It may sound unattractive that adopters need to own a converter.

But in real infrastructure environments, this ownership is often necessary.

Every organization has its own naming conventions, inventory quality, lifecycle
rules, topology abstraction level, and operational meaning.

One team may want to model physical devices.
Another may want logical services.
Another may want Kubernetes workloads.
Another may want MPLS, SR Policy, VPN, or application dependency views.

A generic renderer cannot magically know which of those meanings is correct.

The converter is where the organization encodes that decision.

That makes the topology pipeline explicit:

```text id="hdmv62"
raw infrastructure data
      ↓
domain-specific normalization
      ↓
stable topology identity
      ↓
reusable visualization bundle
```

This is healthier than hiding the logic inside a dashboard panel or a custom UI.

It also makes the workflow testable.

The team can validate that every object has a stable ID.
The team can check that required metadata exists.
The team can reject broken links before publishing.
The team can diff topology changes in pull requests.
The team can keep visual policy separate from source data.
The team can reuse the same generated bundle in multiple surfaces.

That is why the converter should not be seen only as cost.

It is the place where infrastructure data becomes operationally usable topology.

## When To Adopt TopoViewer

Adopt TopoViewer when most of these are true:

* the topology has stable objects;
* the same model should appear in more than one surface;
* style consistency matters across teams or products;
* diagrams should be reviewed, validated, or generated;
* topology may come from a source-of-truth system;
* runtime overlays are useful but should not rewrite the stable model;
* the team accepts maintaining converters or adapters where needed;
* the required surface is within the documented support status.

This is the common path for infrastructure docs, internal platform views,
network topology pages, service maps, operational dashboards, and customer
reports where diagram drift is already painful.

## When To Adapt TopoViewer

Adapt TopoViewer when the model is right, but the product workflow is yours.

Examples:

* embedding the React runtime into an internal platform;
* generating `topology.yaml` from NetBox, Infrahub, Kubernetes, Containerlab, or
  a private inventory API;
* wrapping validation in internal CI policy;
* creating a company style preset;
* building a Grafana bundle workflow around existing telemetry conventions;
* hiding experimental controls and exposing only approved authoring paths;
* integrating export and review into internal release processes.

This path treats TopoViewer as a topology-as-code foundation, not as the whole
product.

That is usually the right compromise for mature platform teams:

> Reuse the boring topology machinery, own the workflow around it.

## When To Use Existing Tools Instead

Use Mermaid, Excalidraw, diagrams.net, PowerPoint, Visio, or a whiteboard when:

* the output is a one-off illustration;
* speed matters more than reuse;
* the diagram has no stable object identity;
* the team does not want YAML or code review for diagrams;
* the diagram will not be connected to runtime state;
* the diagram does not need to appear in multiple surfaces;
* manual editing is good enough.

Using a smaller tool for a smaller job is not a failure.

It is the correct engineering decision.

## When Not To Use TopoViewer

Do not use TopoViewer when:

* the diagram is only a presentation picture;
* the topology is not reused;
* the team wants freeform drawing only;
* the required integration is only a roadmap item today;
* the accessibility, security, or lifecycle posture is not enough for the use
  case;
* the team is not willing to treat topology as data.

TopoViewer is not a hosted diagram SaaS.
It is not a general whiteboard.
It is not a replacement for every graph visualization library.
It is not the right tool for every diagram.

Its value appears when topology needs to become a reusable asset.

## Adoption Test

TopoViewer is a strong fit when the answer is yes to these questions:

1. Do the topology objects have stable IDs or names?
2. Will the same topology be reused across docs, products, dashboards, or
   exports?
3. Should visual policy be reusable instead of manually redrawn?
4. Would validation, diffing, or CI review reduce real operational risk?
5. Is there a source-of-truth system that could eventually generate the topology?
6. Can runtime state be mapped onto topology without changing the stable model?
7. Is the team willing to maintain converters or adapters as explicit contracts?

If most answers are yes, TopoViewer is not just a diagram renderer.

It is the topology-as-code layer between infrastructure data and the many
surfaces where humans need to understand it.

If most answers are no, use a drawing tool.

Draw the diagram and move on.

## Final Position

TopoViewer should not be adopted because drawing tools are bad.

It should be adopted when topology has become too important to live only as a
drawing.

The value is not only in rendering boxes and lines.

The value is in making topology portable, reviewable, stylable, validatable, and
ready for runtime mapping.

Existing tools can still do what they are good at.

Mermaid can remain useful for lightweight docs.
Excalidraw can remain useful for brainstorming.
diagrams.net can remain useful for polished manual diagrams.
Grafana can remain useful for operational dashboards.
NetBox, Infrahub, Kubernetes, Containerlab, and inventory APIs can remain useful
as data sources.
React Flow, Cytoscape, and D3 can remain useful as rendering foundations.

TopoViewer’s role is different.

It provides the shared topology bundle that lets these worlds connect without
each one reinventing topology identity, styling, and runtime mapping from
scratch.

That is the adoption argument.
