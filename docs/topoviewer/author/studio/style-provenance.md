# Style Provenance

**Support status:** Experimental

A rendered value may come from an implicit renderer default, one or more ordered
stylesheet rules, an inline topology style, or a runtime mapper overlay. Visual
shows the effective value while keeping cascade and selector authoring in Code.

Visual appearance controls write exact-ID rules in the candidate stylesheet.
This is the safe, selection-specific equivalent of an object override while
keeping visual policy in `stylesheet.yaml`:

```yaml
- selector: 'node[id = "core-1"]'
  style:
    backgroundColor: "#123456"
```

Reusable selector rules belong in **Code > stylesheet.yaml**. Prefer a stable,
low-cardinality label when several objects should share policy:

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

Objects created from the Studio palette keep topology identity, relationships,
labels, positions, and data in `topology.yaml`. Their generated appearance is
written directly to exact-ID rules in `stylesheet.yaml`; Studio does not create
inline topology styles as part of its normal authoring workflow.

Imported and hand-authored bundles may still contain inline styles. When one is
selected, Visual disables the affected controls and shows one **Visual styles
found in topology.yaml** notice for the object. **Move all** creates or updates
the object's exact-ID rule and removes all of that object's inline visual values
in one transaction. Use Code to inspect the source. Studio does not copy one
visual edit into multiple owners.

Resetting a Visual field removes it from the exact-ID rule. If that rule becomes
empty, Studio removes the rule and exposes the next inherited value. Unknown
future fields are preserved during unrelated structured edits. Code can open
their source without Visual pretending to understand them.

Mapper state styles are runtime overlays. They should override only values that
change with telemetry; stable shape, icon, label, and layout policy remains in
`stylesheet.yaml`.
