## Context

Studio already has one lazy `MonacoYamlEditor`, one `createStudioYamlAssist`
factory, and editor-specific owners for topology, stylesheet, and mapper
candidate state. Monaco completion, hover, diagnostics, `?` discovery, and
source navigation are still operational at the `b0dc545` baseline and current
HEAD.

The Material workspace revamp preserved those internals but left Search as the
only common visible editor command. Assistance therefore exists only through
undocumented keyboard and pointer behavior. This is a discoverability
regression, not a missing language-service implementation.

## Goals / Non-Goals

**Goals:**

- Make contextual YAML assistance visible and keyboard accessible in topology,
  stylesheet, and mapper Code workspaces.
- Keep Monaco and YAML-assist knowledge in their existing shared owners.
- Open field documentation when the cursor identifies a documented field and
  compatible completion otherwise.
- Preserve lazy loading, source state, diagnostics, editor focus, and host
  parity.

**Non-Goals:**

- Add a second context-help panel or duplicate canonical metadata.
- Replace Monaco, add a YAML language-server dependency, or move Monaco into
  the initial bundle.
- Change the Add, Properties, or Mapper workspace model.
- Change YAML, schema, renderer, host persistence, or public package contracts.

## Decisions

### The shared editor owns context resolution

`MonacoYamlEditor` will expose one internal imperative context-help command.
The editor already owns the active model, cursor, document kind, and current
assist instance, so it is the only layer able to choose hover or completion
without leaking Monaco details or duplicating cursor parsing in parent panels.

The command will:

1. focus the editor;
2. ask the existing assist provider whether the word at the cursor has
   documentation;
3. invoke Monaco hover when documentation exists; and
4. invoke Monaco suggestions otherwise.

An alternative dedicated help panel was rejected because it would create a
second presentation and state model for the same metadata. A command that
always opens suggestions was rejected because it would hide the existing
field-level documentation behavior.

### Every YAML owner exposes one identical command

Topology, stylesheet, and mapper editor toolbars will render the same Material
icon command through a shared Studio component. Parents keep ownership of
candidate apply/revert and document-specific commands; the shared control owns
only naming, tooltip, icon, and invocation.

An application-header command was rejected because context help only has
meaning when an editor model and cursor are active. A new Code destination on
the workspace rail was rejected because the current product contract
intentionally keeps topology and stylesheet under Properties and mapper source
under Mapper.

### Existing assistance remains authoritative

The change will not add schema copies, field registries, or host-specific
providers. `topoviewer` authoring metadata remains the canonical source;
`yamlAssist` remains the Studio projection; Monaco remains the rendering and
interaction boundary.

### Verification covers behavior, not only presence

Browser tests will activate the command in all three document kinds and assert
that Monaco displays either documented hover or compatible suggestions.
Existing completion, `?`, diagnostics, failure-boundary, lazy-load, and bundle
tests remain regression gates.

## Risks / Trade-offs

- **Help opens the wrong Monaco surface** -> The command is scoped to the
  editor instance and current model rather than a global language provider.
- **The toolbar duplicates behavior** -> The icon is an explicit entry point
  to the existing hover/completion contract, not a second help implementation.
- **Monaco enters the initial bundle** -> The button has no Monaco import and
  invokes the lazy editor only through its existing ref.
- **A click before editor mount does nothing** -> The existing lazy boundary
  remains visible and the command becomes active with the editor; no draft or
  application state is lost.
- **Dense projects regress** -> Context resolution is synchronous and bounded
  to the active cursor; it does not rebuild or validate the graph.

## Migration Plan

No project or preference migration is required. Rollout is an additive Studio
UI change. Rollback removes the toolbar command and internal handle method
without affecting YAML or saved projects.

## Open Questions

None. The existing assist and workspace ownership contracts determine the
implementation.
