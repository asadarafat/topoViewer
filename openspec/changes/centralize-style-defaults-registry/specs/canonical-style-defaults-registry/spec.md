## ADDED Requirements

### Requirement: Canonical Style Defaults Registry

TopoViewer SHALL maintain one canonical style defaults registry owned by
`packages/topoviewer`.

The registry SHALL describe every public style key by target kind, including
nodes, links, paths, regions, diagram shapes, and callouts.

Each style key definition SHALL include:

- canonical camelCase key;
- target kind or kinds;
- data type;
- accepted enum values when applicable;
- user-facing use text;
- default state.

The default state SHALL be one of:

- explicit concrete value;
- derived default with source description;
- no TopoViewer default.

#### Scenario: Node shape default is discoverable

Given a node stylesheet omits `shape`
When TopoViewer compiles the node style
Then the node body shape default is resolved from the canonical registry
And the default is `square`
And the stylesheet reference and YAML assist describe the same default.

#### Scenario: Optional keys are intentional

Given a style key such as `labelZIndex` has no automatic default behavior
When the registry describes that key
Then the key definition explicitly declares that no TopoViewer default applies
And docs and YAML assist do not imply a hidden fallback value.

### Requirement: Runtime Alignment With Registry

The renderer SHALL use registry-backed defaults for stable primitive defaults
where practical.

Derived defaults MAY remain calculated in compiler code, but the registry SHALL
describe the derivation and tests SHALL prove the compiler follows it.

#### Scenario: Compiler default drift is caught

Given the registry declares a default for `node.width`
When compiler tests compile a node with no authored `width`
Then the compiled node uses the registry-declared default
And the test fails if the compiler fallback changes without updating the
registry.

#### Scenario: Derived icon colors remain documented

Given a node style omits `backgroundColor` and `borderColor`
When the node has a selected icon
Then the compiler derives node fill and stroke from icon metadata
And the registry documents those derived defaults.

### Requirement: Documentation Alignment

The public stylesheet reference SHALL be generated or validated against the
canonical registry.

The public stylesheet reference SHALL keep the author-facing table shape:

```text
Key | Values | Use
```

Default behavior SHALL be included in the `Use` text or in focused default
behavior sections.

#### Scenario: Registry key missing from docs

Given a public style key exists in the canonical registry
When docs content checks run
Then the check fails if the stylesheet reference omits that key.

#### Scenario: Explicit default missing from docs

Given a public style key has an explicit concrete default
When docs content checks run
Then the check fails if the docs do not describe that default behavior.

### Requirement: Schema And Lint Alignment

Schema and semantic lint SHALL align with the canonical registry for public
style keys.

The registry SHALL NOT introduce kebab-case aliases or alternate casing.

#### Scenario: Non-canonical style key is rejected

Given authored YAML contains `label-z-index`
When validation and lint run
Then TopoViewer rejects or reports the key as non-canonical
And suggests the canonical `labelZIndex` key where applicable.

#### Scenario: Schema metadata drift is caught

Given a public style key is added to schema metadata
When schema alignment tests run
Then the tests fail unless the key also exists in the canonical registry.

### Requirement: YAML Assist Alignment

The VS Code extension and browser harness SHALL use registry-backed style
metadata for style key suggestions, accepted values, typed value editors, and
default hints.

The harness MAY keep UI grouping metadata, but grouping SHALL reference
registry keys rather than defining an independent style key/default table.

#### Scenario: Enum value suggestions come from registry

Given the user edits a `shape` style value
When YAML assist requests completions
Then the suggested values come from the canonical registry
And include `square`, `circle`, `ellipse`, and the other supported node body
shapes.

#### Scenario: Default hint is shown without overriding intent

Given the user requests help for `curveStyle`
When YAML assist displays context help
Then it explains the default `bezier`
And inserting or accepting help does not modify YAML unless the user explicitly
chooses a completion.
