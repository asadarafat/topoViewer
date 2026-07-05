## Current State

The renderer now has three relevant label systems:

1. Object labels for nodes, regions, paths, links, shapes, and callouts.
2. Endpoint labels on links: `sourceLabel` and `targetLabel`.
3. Direction labels on `linkDirection` lanes, usually telemetry values.

Endpoint labels currently have a local auto-placement path in the edge
renderer. It can choose a better side for source/target labels on the same
edge, then apply manual offsets such as `sourceLabelXOffset`,
`sourceLabelYOffset`, `sourceLabelSideOffset`, and `sourceLabelDistance`.

That is useful but incomplete. It cannot see a nearby region caption, a node
label, a direction label on a different edge, or a port label from an adjacent
link. Dense operational diagrams therefore still need manual per-example
tweaks.

## Link Direction Styling Contract

The current implementation should be treated as the public direction-lane
contract:

- A `linkDirection` is a virtual style target derived from one parent `link`.
- The parent link owns identity, source/target nodes, endpoint labels,
  topology-layer membership, and base style.
- A direction lane inherits the compiled parent link visual policy first.
- `linkDirection` selectors and direction-specific inline style override only
  the fields they need to change.
- Direction arrows are marker geometry. They do not carry text.
- `sourceLabel` and `targetLabel` carry physical endpoint names such as
  `e1-1`, `eth1`, or `xe-0/0/0`.
- Direction labels carry vector values such as bandwidth, packet rate, or
  state.
- Annotation visibility belongs to overlay layers, not topology layers. Turning
  off a bandwidth overlay must hide direction strokes/labels without hiding
  the physical parent link.

The renderer, docs, schemas, examples, mapper overlays, and Grafana bundles
must align to that contract.

## Label Participant Model

The global placement pass should normalize visible labels into descriptors:

```ts
type LabelKind =
  | 'nodeLabel'
  | 'nodeMeta'
  | 'regionLabel'
  | 'edgeLabel'
  | 'endpointLabel'
  | 'directionLabel';
```

Each descriptor needs:

- stable ID;
- owning object kind and ID;
- label kind;
- text;
- anchor point or anchor box in graph coordinates;
- estimated size in graph coordinates;
- preferred placement;
- candidate placements;
- priority;
- collision policy;
- z-index;
- manual final offset.

The placement pass should operate in graph coordinates. It should not require
DOM measurement for correctness. A later refinement may add optional measured
sizes, but the first production path should use deterministic size estimates so
server-side builds, documentation previews, and Grafana refreshes behave
consistently.

## Placement Strategy

The first placement engine should use deterministic candidate scoring before
any expensive iterative adjustment:

1. Build obstacle boxes from node bodies and already placed higher-priority
   labels.
2. Generate candidate positions for each label kind.
3. Score candidates by overlap, distance from anchor, preferred-placement
   penalty, bounds penalty, and manual-offset cost.
4. Pick the lowest-score candidate with stable tie-breaking by label ID.
5. If overlap remains after all candidates are exhausted, apply the configured
   collision policy.

This is intentionally simpler than a continuous force simulation. It should be
predictable, cheap, and easy to test.

Candidate defaults:

- `nodeLabel`: use the configured node label position first, then nearby
  positions around the node body.
- `nodeMeta`: prefer below the node label, then below or beside the node.
- `regionLabel`: prefer configured region label position, then nearby region
  corners/edges that remain close to the region boundary.
- `edgeLabel`: prefer the edge midpoint, then move along/normal to the edge.
- `endpointLabel`: prefer the endpoint side computed from edge direction,
  then adjacent quadrants around the endpoint.
- `directionLabel`: prefer the configured direction label placement, then move
  along/normal to the direction lane.

## Priorities

Default priority should reflect operational value:

1. Node primary labels.
2. Endpoint port labels.
3. Edge labels and direction labels.
4. Region labels.
5. Node meta and decorative labels.

Priorities must be overridable with an explicit style key so a user can make a
region or direction label more important in a specific diagram.

## Collision Policies

The renderer should support a small set of collision policies:

- `none`: preserve existing behavior.
- `avoid`: move the label to the best non-overlapping candidate.
- `fade`: use `avoid`, then reduce opacity when unavoidable overlap remains.
- `hide`: use `avoid`, then hide the lower-priority label when unavoidable
  overlap remains.

Default policy should be conservative. Existing diagrams should not change
dramatically unless a style enables global auto placement or the default is
introduced behind a renderer version gate.

## Style Surface

The final key names may be refined during implementation, but the public model
should include:

- `labelAutoPosition`;
- `labelCollisionPolicy`;
- `labelPriority`;
- `nodeLabelAutoPosition`;
- `regionLabelAutoPosition`;
- `edgeLabelAutoPosition`;
- `endpointLabelAutoPosition`;
- `directionLabelAutoPosition`.

Existing endpoint-specific manual offsets remain final nudges:

- `sourceLabelXOffset`;
- `sourceLabelYOffset`;
- `targetLabelXOffset`;
- `targetLabelYOffset`;
- `sourceLabelSideOffset`;
- `targetLabelSideOffset`;
- `sourceLabelDistance`;
- `targetLabelDistance`.

The global placement pass must not make these keys ambiguous. Auto placement
chooses the best base position; manual offsets then intentionally adjust it.

## Recompute Rules

The placement pass should recompute when:

- topology data changes;
- style changes;
- selected topology layers or overlay layers change;
- attention grouping changes visible objects;
- node or region positions change through dragging;
- telemetry changes labels that affect size or visibility.

It should not recompute merely because the user pans or zooms.

## Validation Strategy

Coverage should include:

- unit tests for candidate generation and scoring;
- renderer tests proving endpoint, node, region, edge, and direction labels
  can avoid each other;
- Grafana CLOS smoke screenshots before/after label placement;
- docs examples that show when to use endpoint labels versus direction labels;
- performance checks on dense generated graphs.
