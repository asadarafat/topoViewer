# Design

## Ownership

`topoviewer-studio` owns the application shell, contextual workspace state,
theme selection, host preferences, and viewport presentation. `topoviewer`
continues to own renderer behavior, schemas, validation, and portable graph
contracts. Browser and VS Code adapters continue to own persistence through
`StudioHost`.

No feature module may read browser storage or VS Code state directly. Theme
selection and viewport preferences use the existing typed host preference
boundary.

## Contextual Workspace

The left workspace has three intent-based destinations:

| Destination | Responsibility |
| --- | --- |
| Add | Object templates and active creation tools. |
| Properties | Visual and Code editing for the current selection or canvas. |
| Mapper | Visual and Code telemetry mapping. |

The shell owns one deterministic transition reducer:

- selecting an object outside Mapper opens Properties;
- selecting or clearing selection inside Mapper keeps Mapper active;
- clicking empty canvas outside Mapper opens canvas Properties;
- completing object or edge creation selects the new object and opens
  Properties;
- cancelling creation keeps the last logical destination;
- multi-selection opens common properties and bulk actions;
- panel collapse, width, Visual/Code state, drafts, and selection remain
  independent concerns.

Viewport controls are not a separate workspace. Empty-canvas Properties owns
grid, helper-line, snap, minimap, controls, and canvas-color preferences.
Topology and stylesheet YAML remain in Properties Code. Mapper YAML remains in
Mapper Code.

## Material Theme

`StudioThemeProvider` remains the sole theme owner. The theme uses MUI CSS
variables and the native `light` and `dark` color schemes with no custom
palette. Typography and spacing continue through the existing Studio contracts
projected into MUI.

The user preference is:

```ts
type StudioColorModePreference = 'system' | 'light' | 'dark';
```

The application resolves the host preference before mounting Studio chrome.
MUI resolves operating-system changes while the preference is `system`.
Changing the mode writes through `StudioHost`; MUI does not create a second
local-storage owner. Theme changes disable incidental CSS transitions.

Monaco defines matching Studio light and dark themes and receives the effective
mode. React Flow and TopoViewer remain non-Material renderer surfaces, while
their Studio-owned controls consume MUI CSS variables.

## Viewport Color Migration

Canvas background and grid colors use a versioned private preference:

```ts
type StudioThemeColorPreference =
  | { mode: 'theme' }
  | { mode: 'custom'; value: string };
```

Theme mode resolves background and grid colors from MUI semantic tokens.
Custom mode preserves the exact validated color across application theme
changes. Reset returns the property to theme mode.

Legacy defaults (`#121212`, the historical fallback `#0d151e`, and `#49657f`)
migrate to theme mode. Other valid legacy colors migrate to custom mode. This
migration changes host preferences only and never edits project source.

## Rams Evaluation

The completed workspace was reviewed against each principle, using the
light, dark, desktop, narrow, Properties, Mapper, Monaco, dialog, and toolbar
golden screenshots together with browser and accessibility tests.

1. **Innovative:** pass. The workspace uses semantic topology selection to
   choose the relevant authoring context. It reuses TopoViewer and MUI contracts
   instead of introducing a second object model or novelty controls.
2. **Useful:** pass. Add, Properties, and Mapper map directly to creating,
   editing, and binding topology. Creation completion, empty-canvas selection,
   multi-selection, cancellation, and Mapper continuity have deterministic
   tested outcomes.
3. **Aesthetic:** pass for the current Beta Preview bar. Native MUI light and
   dark schemes produce a coherent hierarchy, restrained density, and
   consistent controls. This verdict is supported by golden screenshots rather
   than treated as a universal taste claim.
4. **Understandable:** pass. Destination names express user intent, selection
   opens the applicable Properties content, canvas settings appear for an empty
   selection, and Visual/Code remains a representation switch within a feature.
5. **Unobtrusive:** pass. The canvas remains the dominant surface; the rail,
   panel, status, and selection commands stay secondary and can be collapsed.
6. **Honest:** pass. Saved, modified, invalid, unavailable, and Beta Preview
   states report actual product state. The release record also reports bundle
   growth and residual scale risks instead of presenting them as eliminated.
7. **Long-lasting:** pass. Semantic MUI tokens, typed host preferences,
   versioned viewport preference migration, deterministic workspace state, and
   canonical documentation ownership replace visual and persistence coupling.
8. **Thorough down to the last detail:** pass. Hover, focus, selected, disabled,
   loading, empty, error, narrow, light, dark, 200 percent zoom, forced-colors,
   reduced-motion, persistence, and host-parity states have automated evidence.
9. **Environmentally friendly:** pass within the repository's measurable
   software scope. No runtime dependency was added; Monaco and feature
   workspaces remain lazy; worker analysis, deferred position projection, and
   cached inspector projection avoid repeated main-thread work. Initial gzip
   growth remains bounded at 0.87 percent for Studio and 1.01 percent for the VS
   Code webview.
10. **As little design as possible:** pass. Four peer workspaces become three
    intent-based destinations, viewport controls move into canvas Properties,
    and one contextual menu replaces permanently visible selection commands.

## Header And Canvas Controls

The header keeps product identity, project identity, persistence state,
undo/redo, appearance, export, and overflow actions. Beta Preview becomes
secondary text rather than a decorative chip.

The canvas keeps one vertical toolbar. Zoom, fit, select, pan, and Layers remain
direct icon actions. Commands that only apply to a selection move into one
contextual Material menu. Every icon has a tooltip and a minimum 44-pixel
target.

## Accessibility And Performance

Normal light and dark modes target WCAG 2.2 AA. Focus order follows header,
workspace rail, workspace content, then canvas controls. Mode controls expose
their selected state and current effective scheme. Theme and workspace changes
are announced without moving focus unexpectedly.

Monaco, Mapper, Inspector, archive, and export boundaries remain lazy. No new
runtime dependency is allowed. Existing initial-bundle, interaction, dense
graph, CSS, typography, spacing, and Material-ownership budgets remain release
gates.

Position-only canvas interaction defers source projection until commit.
Mapper analysis uses a versioned worker protocol and feature-local sample
ownership. Inspector style projection uses immutable source caching and
progressively reveals additional fields. These boundaries keep transient
interaction away from document rebuild and full-panel render paths.

## Validation Evidence

The final isolated-snapshot gate ran:

```bash
TOPOVIEWER_TEST_PORT=5713 CI=1 npm run ci
```

All lanes passed in 29 minutes 24.4 seconds: environment, generated artifacts,
quality, schemas, build, documentation, renderer parity, core tests,
performance smoke, package, and public readiness. Focused evidence includes:

- Studio startup median: 299.4 ms;
- palette drop-to-visible median: 62.1 ms;
- 1,000-node drag frame median: 16.7 ms, p95: 33.3 ms, commit median: 57.9 ms;
- 5,000-sample mapper worker completion median: 53.3 ms;
- maximum retained memory growth after ten cycles: 4.66 MB;
- Studio initial JavaScript: 447,611 gzip bytes;
- VS Code webview initial JavaScript: 441,010 gzip bytes;
- largest lazy Monaco chunk: 641,006 gzip bytes;
- 1,000-node CLOS layout median: 75.88 ms; and
- MkDocs-to-Zensical visual parity: 0.0010 maximum observed difference.

## Remaining Risks

- Monaco remains a large lazy chunk. It is isolated and budgeted, but code mode
  still has a meaningful first-open download and parse cost.
- Dense full-candidate inspector settlement has a 1.24-second median at the
  current maximum fixture. Progressive rendering protects immediate
  interaction, but this is the primary scale risk if the graph ceiling grows.
- The 1,000-node drag benchmark recorded occasional 50-67 ms pointer-move long
  tasks even though median and p95 budgets pass.
- Four accepted npm advisories remain in Grafana SDK transitive development and
  tooling paths. The production npm audit is clean, and the Go scan reports no
  callable vulnerabilities.
- Studio remains Beta Preview. The evidence supports continued preview use, not
  a claim that every authoring workflow has reached stable-product maturity.
- No performance waiver was used. A regression beyond the recorded budgets
  must fail the release gate or receive a new reviewed OpenSpec decision.

## Rollout

Implementation proceeds through one shell rather than a long-lived feature
flag. Each phase is committed only after its focused tests pass. Rollback uses
source control; no compatibility layer preserves the obsolete four-workspace
navigation.
