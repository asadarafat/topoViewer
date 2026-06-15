# Topology Attention Roadmap

TopoViewer should distinguish itself in very large, densely populated environments by showing what matters first. It should not behave like a generic graph canvas that happens to accept network-shaped data. The product direction is a topology attention engine: preserve dense graph context, but make the relevant service, path, failure domain, or operational signal obvious.

## Direction

Large topology views fail when every node, link, label, and metric competes for attention at the same priority. TopoViewer should keep the source graph complete while deriving focused views that answer operator questions quickly:

- What is important right now?
- What changed?
- What depends on this object?
- What does this object depend on?
- Which path, service, region, or failure domain explains the current view?

The renderer should support three goals at the same time:

- Keep spatial context so users do not get lost.
- Reduce visual noise without deleting the underlying graph facts.
- Make focus changes fast enough for repeated investigation.

## Capability Themes

- Semantic focus over labels, data fields, regions, paths, adjacency, and dependencies.
- Progressive disclosure through aggregates, collapsed regions, and stable drill-down.
- Explainable importance scoring that drives default emphasis, label priority, opacity, and z-order.
- Operator focus modes for paths, upstream/downstream dependencies, blast radius, and recent change context.
- Scale-first rendering that measures dense graphs before adding heavier rendering technology.

## Implementation Planning

The detailed SDD/TDD plan is tracked as OpenSpec project planning under:

```text
openspec/changes/implement-topology-attention-engine/
```

Those artifacts hold the proposal, requirements, technical design, and test-first task plan. This page intentionally stays high level so published product docs describe direction rather than internal execution detail.
