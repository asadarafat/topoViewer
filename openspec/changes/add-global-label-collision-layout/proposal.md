## Why

Dense operational topologies now expose a real renderer limit: labels can be
correct individually and still collide as a diagram. The current endpoint-label
auto placement is local to one link. It can separate `sourceLabel` and
`targetLabel` for the same edge, but it does not consider labels owned by
regions, nodes, other links, or directional telemetry strokes.

That is why the ST CLOS Grafana panel still needs manual offsets after the
endpoint-label cleanup. The physical-port labels, region labels, node labels,
and directional bandwidth labels are all valid objects, but the renderer does
not yet have a shared label placement pass that can negotiate space between
them.

This change also codifies the link-direction styling contract that has already
landed in the core package. The archived direction-lane specs covered the
original bidirectional lane primitive, but the latest implementation changed
the contract in an important way: arrows are marker geometry only, endpoint
port text belongs to `sourceLabel` and `targetLabel`, and `linkDirection`
styles inherit from the parent link before direction-specific overrides are
applied.

## What Changes

Add a deterministic global label collision layout model for TopoViewer labels:

- collect visible labels from nodes, regions, links, endpoint labels, and
  directional link strokes into a shared placement model;
- assign stable anchors, candidate placements, priorities, and collision
  policies per label kind;
- place labels using deterministic scoring so Grafana refreshes do not cause
  jitter;
- avoid node bodies, region captions, endpoint labels, edge labels, and
  direction labels where practical;
- preserve existing manual offsets as explicit final nudges;
- degrade predictably when a dense graph cannot be made overlap-free.

Codify the current link-direction styling contract:

- `linkDirection` is a virtual styling target derived from a parent link;
- direction styles inherit parent link style, then apply `linkDirection`
  selector rules and direction-specific overrides;
- direction labels represent vector values such as bandwidth;
- edge arrows remain marker/geometry primitives;
- physical port labels use `sourceLabel` and `targetLabel`;
- overlay toggles can hide endpoint labels or directional telemetry without
  hiding the parent topology link.

## Capabilities

### New Capabilities

- `global-label-collision-layout`: deterministic placement and collision
  avoidance for visible TopoViewer labels.

### Modified Capabilities

- `link-direction-lanes`: codifies the achieved styling inheritance and marker
  contract for `linkDirection`.
- `stylesheet-link-style`: formalizes endpoint label style keys and global
  auto-placement behavior.
- `topoviewer-renderer`: applies a shared label placement pass before labels
  are rendered.
- `topoviewer-grafana-panel`: benefits from stable label placement under
  telemetry refresh.
- `topoviewer-docs`: documents the difference between endpoint labels,
  direction labels, edge labels, and object labels.

## Non-Goals

- Replacing graph layout or moving topology objects to solve label collisions.
- Running a full physics simulation on every pan, zoom, or Grafana refresh.
- Guaranteeing zero overlap for arbitrarily dense diagrams.
- Treating physical interfaces as first-class graph nodes.
- Putting port names back inside arrow markers.
- Using topology graph layers for annotation toggles such as ports or
  bandwidth; those remain overlay-layer concerns.
