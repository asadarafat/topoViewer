# Identity And Source Ownership

TopoViewer `0.2` uses one canonical identity contract across the renderer,
Studio, documentation embeds, React, and Grafana:

- `id` is the required unique object identity and the default rendered text;
- `labels.name` is an optional, non-unique display alias;
- topology YAML owns identity, relationships, geometry, labels, and data;
- stylesheet YAML owns persistent appearance;
- mapper YAML owns runtime telemetry binding and runtime style overlays.

This keeps an object traceable from the viewport to every YAML reference. There
is no second generic `name` field that can drift away from the key used by links,
paths, regions, attention, selectors, or mapper rules.

## IDs And Display Aliases

Use the ID as the visible text when the operational name is already readable:

```yaml
version: "0.2"
graph:
  nodes:
    - id: client-pe05
      labels:
        role: client
      position: [120, 180]
```

Use `labels.name` only when the viewport needs a different or repeated label:

```yaml
version: "0.2"
graph:
  nodes:
    - id: client-pe05-primary
      labels:
        name: Client
        role: client
    - id: client-pe05-backup
      labels:
        name: Client
        role: client
```

Both nodes render as `Client`, but references remain unambiguous because their
IDs are different. Aliases are ordinary semantic labels, so a stylesheet may
target them:

```yaml
stylesheet:
  - selector: 'node[labels.name = "Client"]'
    style:
      backgroundColor: "#1565c0"
```

Omit `labels.name` to render the canonical ID. Set it explicitly to an empty
string when the object should remain selectable and accessible but have no
visible label:

```yaml
graph:
  links:
    - id: client-primary-to-pe05
      labels:
        name: ""
      source: client-pe05-primary
      target: pe05
```

Do not use `labels.name` as a reference key. Links and every other relationship
always use the canonical ID:

```yaml
graph:
  links:
    - id: client-primary-to-pe05
      source: client-pe05-primary
      target: pe05
```

## Rename An ID Safely

Changing an ID is a semantic refactor, not a text replacement. In Studio
Properties, edit **Object ID** and review the impact count before applying. Studio
updates registered references across topology, stylesheet, attention, and mapper
sources as one undoable transaction. The renamed object remains selected.

In the shared source workspace, changing an ID declaration invokes the same
semantic rename path. Studio either applies the complete valid bundle or leaves
every source unchanged. It does not partially update YAML.

The refactor updates known references such as:

- link endpoints and node handles;
- path sequences, endpoints, and parents;
- region members and parents;
- node and link parents;
- callout and connector attachments;
- layer memberships and layout-pinned node IDs;
- attention IDs and exact-ID stylesheet selectors;
- supported static mapper target references.

Free text, `labels.name`, arbitrary data, URLs, inventory keys, and telemetry
labels are not rewritten. Studio reports those external integration risks for
review because it cannot prove that another system uses the same identifier.

## Keep Appearance Out Of Topology

Canonical `0.2` topology objects reject generic `name`, generic `label`, inline
`style`, object-level `icon`, and callout `leader` appearance. Structural fields
such as `position`, `size`, `rotation`, pins, handles, and relationships remain
topology facts.

Put persistent visual policy in stylesheet YAML:

```yaml
stylesheet:
  - selector: 'node[id = "pe05"]'
    style:
      icon: router
      backgroundColor: "#1565c0"
  - selector: 'callout[id = "pe05-note"]'
    style:
      lineColor: "#42a5f5"
      targetArrowShape: triangle
```

Studio follows this boundary. Palette creation, duplication, presets, Format
Painter, and Visual appearance edits write topology facts and stylesheet rules
in the same project transaction rather than leaking appearance into topology.

## Migrate Legacy Bundles

Version `0.1` and unversioned bundles may contain generic names or inline
appearance. Preview repository migration without changing files:

```bash
npm run migrate:identity -- path/to/topology.yaml
```

Apply the deterministic migration after reviewing its diagnostics:

```bash
npm run migrate:identity -- --write path/to/topology.yaml
```

The migration moves legacy display text to `labels.name`, moves persistent
appearance into exact-ID stylesheet rules, updates `labelFields`, and writes the
canonical version. It stops on conflicting aliases rather than silently choosing
between legacy `name` and an existing different `labels.name`.

Keep compatibility fixtures on their original version when they intentionally
test old input. New and maintained project bundles should pass the migration
check without relying on runtime compatibility behavior.
