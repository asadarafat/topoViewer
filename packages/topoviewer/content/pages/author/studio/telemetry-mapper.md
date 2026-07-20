# Telemetry Mapper

**Support status:** Beta Preview

`mapper.yaml` binds runtime samples to stable topology objects. It is optional
and belongs to the same portable project as topology and style.

Select the topology object to bind, then open **Mapper** from the workspace
rail. Studio derives the target kind from the canvas selection instead of asking
you to repeat it in a form. A node selection creates node rules, a link or
direction selection creates the corresponding edge rule, and no selection uses
whole-graph context. Mixed or unsupported selections are rejected explicitly.

Enter the metric and common join or state fields, then choose **Create rule**.
For a project without `mapper.yaml`, that first commit creates the document and
rule in one undoable transaction. Merely opening Mapper does not add a file or
change the project.

The rule form and common generated fields remain visible together. Choose
**View More** for less-common contract fields. Search always covers the complete
installed mapper metadata, including fields that are not currently expanded.
Whole-file export and removal remain under **Mapper actions** so routine rule
authoring is not crowded by project-level commands.

## Visual And Code

Mapper has two representations of the same optional document:

- **Visual** creates rules, edits common and generated fields, configures state
  styles, analyzes local samples, and reports coverage.
- **Code** edits the complete `mapper.yaml` contract with diagnostics, source
  navigation, Apply, and Revert.

Code is unavailable until a mapper exists. Create the first rule in Visual to
create `mapper.yaml`, then switch to Code for fields or structures that are not
yet exposed by the form. Switching representations preserves the active mapper
rule and any unapplied Code draft. Invalid YAML remains isolated while the
canvas and Visual view continue to use the last valid mapper.

Use **Edit > Code** for topology and stylesheet source. Studio deliberately
keeps each YAML document with the visual workflow that owns it instead of
providing a second global source editor.

## Analyze Local Samples

Paste bounded generic JSON or Grafana-like data-frame JSON into the sample
workspace. Studio does not contact a telemetry endpoint. It classifies samples
as resolved, unresolved, ambiguous, duplicate, or ignored and links findings
back to rules and topology objects.

Drag a discovered metric onto a topology object to propose a rule. Studio uses
stable IDs and compatible labels or data keys; ambiguous joins require an
explicit choice.

Coverage analysis above the small interactive threshold runs in a worker so the
canvas remains responsive. Sample input is bounded by count and byte limits and
is not stored as topology identity.

## Keep Stable And Runtime Policy Separate

```text
topology.yaml    stable object identity
stylesheet.yaml  stable visual policy
mapper.yaml      runtime sample binding and state overrides
```

Use mapper style fields for values that change with runtime state, such as link
color, width, status, badge, or direction label. Keep normal icons, labels,
geometry, and layout in the stylesheet.

The Grafana export action validates that a mapper exists and packages canonical
`*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml` files.
