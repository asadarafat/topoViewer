# Style Provenance

**Support status:** Experimental

A rendered value may come from a default, a matching stylesheet rule, an
object-specific style, or a runtime mapper overlay. Studio shows that source so
an edit does not accidentally change every matching object.

Expand a style field summary to inspect its source document and source range.
The **Edit scope** control offers only valid destinations:

- the selected object's direct representation;
- an existing matching stylesheet rule;
- a new selector-based rule.

Studio reports how many objects the chosen scope affects before committing the
change. A reusable role or status convention usually belongs in a stylesheet
rule. A one-object exception can use object scope. Prefer the narrowest scope
that still expresses a real visual policy.

When creating a rule, use a selector based on stable labels or object type:

```yaml
- selector: 'node[labels.role = "core"]'
  style:
    shape: roundRectangle
    backgroundColor: "#123456"
```

Unknown future fields are preserved during unrelated structured edits. Studio
lists them as unsupported and can open their exact YAML range rather than
deleting or pretending to understand them.

Mapper state styles are runtime overlays. They should override only values that
change with telemetry; stable shape, icon, label, and layout policy remains in
`stylesheet.yaml`.
