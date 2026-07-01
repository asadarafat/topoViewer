# Attention Reference

Use this page when you need the exact attention contract. Use [Topology Attention](../author/attention.md) for workflow and examples, and [Attention TypeScript API](./attention-typescript-api.md) when host code owns indexing, focus, scoring, or presentation.

## YAML Surfaces

| Surface | Purpose | Authoring location |
|---|---|---|
| Topology default attention | Default focus, interaction, aggregate, and link-grouping behavior carried with the topology. | Top-level `attention:` in topology YAML. |
| MkDocs/Zensical embed attention | Page-specific attention override for one rendered viewport. | `attention:` inside a `topoviewer` fenced block. |
| React attention prop | Runtime focus state or precomputed presentation controlled by the host app. | `TopoViewer` `attention` prop. |

## Object Families

| Object | Key fields | Reference |
|---|---|---|
| Attention root | `interactive`, `clickMode`, `query`, `aggregate`, `links` | [Object Attribute Reference](./object-attributes.md#attention-root) |
| Focus query | `ids`, `labels`, `data`, `pathIds`, `regionIds`, `selectors`, `dependency`, `changes`, `mode` | [Object Attribute Reference](./object-attributes.md#attention-focus-query) |
| Dependency query | `from`, `direction`, `depth` | [Object Attribute Reference](./object-attributes.md#attention-dependency-query) |
| Change query | `since`, `timestampFields`, `revision`, `revisionFields` | [Object Attribute Reference](./object-attributes.md#attention-change-query) |
| Aggregate | `groups`, `expandedGroupIds`, `expandOnClick`, `viewport` | [Object Attribute Reference](./object-attributes.md#attention-aggregate) |
| Aggregate group | `id`, `by`, `regionId`, `parentId`, `key`, `value`, `label` | [Object Attribute Reference](./object-attributes.md#attention-aggregate-group) |
| Link grouping | `enabled`, `threshold`, `by`, `expandOnClick`, `viewport` | [Object Attribute Reference](./object-attributes.md#attention-link-grouping) |

## Focus Modes

| Mode | Result | Use when |
|---|---|---|
| `highlight` | Focused and related objects are emphasized while the rest of the graph remains normal. | The user needs context and only a light cue. |
| `dim-context` | Focused and related objects are emphasized while unrelated context remains visible but muted. | Dense operational views where context should stay visible. |
| `hide-context` | Unrelated context is hidden. | Troubleshooting or documentation needs an isolated subgraph. |

## Click Contract

| Interaction | Default result |
|---|---|
| Click node, link, path segment, or region | Applies focus to the clicked object using `attention.clickMode`, defaulting to `dim-context` when enabled. |
| Click empty viewport space | Clears the active interactive focus and returns to the default topology attention state. |
| Click collapsed aggregate summary | Expands the group when `aggregate.expandOnClick` is enabled. |
| Click expanded source region or parent node | Collapses the matching group again when `aggregate.expandOnClick` is enabled. |
| Click aggregate link | Expands that link group when link grouping `expandOnClick` is enabled. |

## Summary Data

Attention-derived aggregate objects expose stable label and data fields for styling, export, and host integrations.

| Namespace | Example keys | Use |
|---|---|---|
| `labels.*` | `aggregate`, `aggregateBy`, `nodes`, `links`, `severity`, severity counts | At-a-glance styling, badges, selectors, and visible metadata. |
| `data.*` | `isAggregate`, `aggregateId`, `aggregateBy`, `members`, `childCount`, `linkCount`, `severitySummary` | Exact membership, counts, drill-down, and host-app workflow. |

## Validation

Run these checks when changing attention YAML, schema, or examples:

```bash
npm run validate:schemas
npm run validate:semantics
npm run examples:audit
```
