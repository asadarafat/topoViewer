# Style Provenance

**Support status:** Experimental

A rendered value may come from an implicit renderer default, one or more ordered
stylesheet rules, an inline topology style, or a runtime mapper overlay. Basic
shows the effective value and names the winning source so an edit does not
silently target the wrong owner.

Basic writes exact-ID rules in the candidate stylesheet. This is the safe,
selection-specific equivalent of an object override while keeping visual policy
in `stylesheet.yaml`:

```yaml
- selector: 'node[id = "core-1"]'
  style:
    backgroundColor: "#123456"
```

YAML mode owns reusable selectors. Prefer a stable, low-cardinality label when
several objects should share policy:

```yaml
- selector: 'node[labels.role = "core"]'
  style:
    shape: roundRectangle
    backgroundColor: "#123456"
```

Matching rules follow source order. More specific policy should therefore be
placed after broad target rules. Inline topology styles win over authored
stylesheet values, and runtime mapper styles can override values supplied by
telemetry.

When an inline value wins, Basic disables that field and offers **Source** and
**Move to stylesheet**. Migration creates or updates the object's exact-ID rule
and removes only the corresponding inline field in one transaction. Studio does
not copy one visual edit into multiple owners.

Resetting a Basic field removes it from the exact-ID rule. If that rule becomes
empty, Studio removes the rule and exposes the next inherited value. Unknown
future fields are preserved during unrelated structured edits. YAML mode can
open their source without Basic pretending to understand them.

Mapper state styles are runtime overlays. They should override only values that
change with telemetry; stable shape, icon, label, and layout policy remains in
`stylesheet.yaml`.
