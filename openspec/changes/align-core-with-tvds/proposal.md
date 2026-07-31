## Why

TopoViewer already has a strong semantic graph and progressive-disclosure
engine, but direct React hosts, embeds, and application adapters do not receive
one complete contract for accessibility, failures, themes, status, drilldown,
or hierarchy layout. The result is capable rendering with inconsistent host
behavior and avoidable duplication at the exact boundaries where a reusable
topology core should be strongest.

## What Changes

- Declare the base package a logical-topology renderer and document that map
  projection, geographic navigation, and application chrome belong to optional
  host integrations.
- Add a non-throwing compile result and accessible empty, filtered-empty, and
  error fallbacks while preserving the existing throwing compiler API.
- Make node and edge accessibility descriptions include stable identity,
  endpoints, and normalized operational status, and preserve React Flow's
  native keyboard navigation.
- Add typed light and dark core themes, a documented token contract, neutral
  defaults, a 4 px spacing scale, and a package check that prevents new
  unowned CSS color literals.
- Normalize static and mapped status semantics, expose legend data, and add an
  opt-in TVDS lint profile for non-color status cues and literal contrast.
- Extract zoom-driven aggregate expansion into a pure shared viewport
  controller used by embeds and available to direct React hosts.
- Add a layout-provider contract and a deterministic built-in tree layout.
- Export explicit runtime, guided-authoring, and rapid-authoring interaction
  presets instead of making hosts reconstruct connection behavior.

No existing YAML or public API is removed. Existing dark presentation and
throwing compile behavior remain compatible defaults.

## Capabilities

### New Capabilities

- `core-topology-experience`: accessible semantic output, resilient render
  states, typed themes, normalized status and legend data, shared viewport
  reduction, interaction presets, deterministic layout providers, and the
  logical-topology ownership boundary.

### Modified Capabilities

- `core-package-contract`: additive public exports, schema additions, packed
  consumer compatibility, and package-owned theme validation.

## Impact

The primary implementation is owned by `packages/topoviewer`: core types,
compiler helpers, React renderer, embed adapter, CSS tokens, schemas, tests,
and canonical documentation. Studio, Grafana, MkDocs, Zensical, and custom
React consumers remain hosts; they consume public exports and do not own
duplicate status, viewport, or theme rules.

The work adds no runtime dependency and no map SDK. Serialized documents remain
backward compatible; `layout.mode: tree` is additive. Accessibility and render
fallback defaults improve behavior without requiring host changes. Package,
API, embed-parity, docs, and packed-consumer gates must cover every new export.
