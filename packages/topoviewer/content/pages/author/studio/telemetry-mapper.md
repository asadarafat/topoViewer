# Telemetry Mapper

**Support status:** Experimental

`mapper.yaml` binds runtime samples to stable topology objects. It is optional
and belongs to the same portable project as topology and style.

Open **Telemetry mapper** and choose **Enable telemetry mapper**. The Basic rule
workflow asks for a metric, target object kind, join field, value field, and
state thresholds. Advanced exposes the complete schema-derived contract.

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
