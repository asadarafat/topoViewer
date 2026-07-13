# Telemetry Mapper

**Support status:** Experimental

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
