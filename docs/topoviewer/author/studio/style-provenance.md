# Style Provenance

**Support status:** Beta Preview

A rendered value may come from an implicit renderer default, one or more
stylesheet rules, or a runtime mapper overlay. Visual shows the effective value
while keeping cascade and selector authoring in Code.

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

Rule precedence is deterministic. Exact-ID rules override semantic label/data
rules and object-kind rules regardless of source position. Rules with equal
specificity preserve source order. Runtime mapper styles apply last for values
owned by current telemetry.

Objects created from the Studio palette keep topology identity, relationships,
labels, positions, and data in `topology.yaml`. Their generated appearance is
written directly to exact-ID rules in `stylesheet.yaml`; Studio does not create
inline topology styles. Version `0.2` validation rejects persistent topology
appearance so there is only one persistent visual owner.

Migrate a version `0.1` or unversioned bundle with the explicit repository
migration command before editing it as canonical source. The migration moves
legacy appearance to exact-ID rules and reports conflicts without creating two
owners. See [Identity And Source Ownership](../identity-and-source-ownership.md).

Resetting a Visual field removes it from the exact-ID rule. If that rule becomes
empty, Studio removes the rule and exposes the next inherited value. Unknown
future fields are preserved during unrelated structured edits. Code can open
their source without Visual pretending to understand them.

Mapper state styles are runtime overlays. They should override only values that
change with telemetry; stable shape, icon, label, and layout policy remains in
`stylesheet.yaml`.
