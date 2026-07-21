# TopoViewer Studio Closeout

## Final Status

The `build-topoviewer-studio` change is implemented. The public browser Studio
is a **Beta Preview** at `/studio/`. The package remains private and is not an
npm API. The VS Code host remains **Experimental** and is not a published VSIX.
MkDocs, Zensical, React, and Grafana continue to consume portable TopoViewer
bundles and do not depend on Studio.

The former Browser Harness application is retired. `/harness/` is a tested
compatibility redirect to `/studio/`; no second writable authoring application
is shipped.

## As-Built Architecture

| Owner | Responsibility | Boundary |
|---|---|---|
| `packages/topoviewer` | Schemas, validation, compilation, renderer behavior, style resolution and provenance, pure graph operations, authoring metadata, mapper analysis primitives, and public package entries. | Must not import Studio or host code. |
| `packages/topoviewer-studio` | The authoritative multi-document session, transactional commands, browser projects, canvas-first UI, palette, Edit/Mapper workspaces, export orchestration, and browser host. | Private application package; consumes only published `topoviewer` entries. |
| `packages/vscode-topoviewer` | Workspace access, file watching, atomic writes, CSP, message validation, and mounting the shared Studio application. | Thin adapter; no duplicate authoring state or UI. |
| MkDocs, Zensical, React, and Grafana | Render exported TopoViewer source bundles or runtime artifacts. | No dependency on Studio state or private modules. |
| Repository scripts and workflows | Dependency guards, generated-content checks, screenshots, performance budgets, package inspection, Pages deployment, and deployed smoke checks. | Treat build output and benchmark evidence as generated artifacts. |

The dependency direction is one way:

```text
topoviewer-studio -> topoviewer public entries
host adapters     -> Studio host contract + topoviewer public entries
runtime consumers -> portable bundle + topoviewer public entries
```

One Studio session owns `topology.yaml`, `stylesheet.yaml`, optional
`mapper.yaml`, the last valid projection, invalid drafts, diagnostics, history,
selection, and revision state. Canvas, visual controls, Code workspaces,
preview, persistence, and export are projections of that session. Pointer-time
drag state remains in React Flow; one completed gesture commits one source
transaction.

The detailed architecture decisions remain in
[ARCHITECTURE.md](../../../packages/topoviewer-studio/ARCHITECTURE.md).

## Deployment And Data Flow

```text
browser or VS Code host
        |
        v
StudioHost capability boundary
        |
        v
authoritative Studio session and commands
        |
        +----> live TopoViewer renderer
        |
        +----> browser IndexedDB or VS Code workspace files
        |
        +----> deterministic portable archive / destination bundle
                         |
                         v
             MkDocs, Zensical, React, Grafana
```

The browser production build is emitted under `site/studio/` and deployed by
the Docs workflow with the rest of GitHub Pages. The workflow then runs a smoke
test against the deployed URL. Release screenshots are generated from real dark
mode Studio, MkDocs, Zensical, and Grafana surfaces using the same canonical
topology; their manifest is version-bound and checked during npm and PyPI
release workflows.

Browser persistence is local IndexedDB with bounded recovery snapshots. The
portable `.tvstudio` archive is the durable browser-to-browser and host-to-host
interchange. The optional File System Access API integration is capability-
gated and permission-driven.

## Security Assumptions

Topology, stylesheet, mapper, archive, SVG, image, Markdown, and telemetry
sample inputs are untrusted. Studio enforces bounded file counts and sizes,
canonical archive paths, MIME and image constraints, SVG sanitization, YAML and
renderer limits, mapper cardinality limits, and no implicit remote asset fetch.
VS Code additionally owns workspace trust, trusted roots, nonce-based CSP,
typed message validation, atomic writes, and revision-conflict handling.

Studio is not an authentication, authorization, tenancy, or hostile-JavaScript
sandbox. A host embedding Studio remains responsible for those product
boundaries. The maintained threat model is
[threat-model.md](../../../packages/topoviewer/content/pages/evaluate/threat-model.md),
and adversarial coverage lives in the Studio, core, and VS Code security suites.

## Performance And Accessibility

The versioned source of truth is
[performance-budgets.json](../../../packages/topoviewer-studio/performance-budgets.json).
The latest closeout CI measurement remained within these compressed bundle
budgets:

| Artifact | Measured | Budget |
|---|---:|---:|
| Studio initial CSS | 8,344 B | 9,216 B |
| Studio initial JavaScript | 444,220 B | 458,752 B |
| Studio largest lazy JavaScript chunk | 640,982 B | 663,552 B |
| Studio total lazy JavaScript | 1,170,249 B | 1,212,416 B |
| VS Code initial CSS | 8,536 B | 9,216 B |
| VS Code initial JavaScript | 436,989 B | 450,560 B |
| VS Code largest lazy JavaScript chunk | 640,972 B | 663,552 B |
| VS Code total lazy JavaScript | 1,169,848 B | 1,212,416 B |
| VS Code extension | 51,980 B | 55,296 B |

Interaction, dense graph, mapper, memory, and variance measurements are
documented in [PERFORMANCE.md](../../../packages/topoviewer-studio/PERFORMANCE.md).
The keyboard, focus, screen-reader, zoom, contrast, and reduced-motion contract
is documented in
[ACCESSIBILITY.md](../../../packages/topoviewer-studio/ACCESSIBILITY.md).

## Operational Handoff

Use Node.js 24. From a clean checkout:

```bash
npm ci
npm run studio:dev
```

Focused gates:

```bash
npm run studio:ci:quality
npm run studio:ci:integration
npm run studio:test:accessibility
npm run studio:benchmark:repeat
npm run studio:packed-core:check
```

Repository and release gates:

```bash
npm run ci
npm run release:screenshots:verify
openspec validate --all --strict --no-interactive
```

Performance reports, traces, failed screenshots, and other machine-local
evidence belong under `.artifacts/topoviewer-studio/` or CI artifacts. Do not
commit them. Reviewed documentation screenshots are the exception and are
managed by the screenshot catalog and release checks.

## Requirement Traceability

Every requirement in the six delta specifications has implementation and
executable verification evidence below. Links are repository-relative and
remain valid after this change moves from `openspec/changes` to
`openspec/archive`.

### Studio Product Contract

| Requirement | Implementation | Verification |
|---|---|---|
| One portable authoring model | [project contract](../../../packages/topoviewer-studio/src/contracts/project.ts), [export snapshot](../../../packages/topoviewer-studio/src/export/exportSnapshot.ts) | [archive tests](../../../packages/topoviewer-studio/tests/unit/project-archive.test.ts), [golden browser journey](../../../packages/topoviewer-studio/tests/parity/studio-golden-authoring.spec.ts) |
| Canvas-first product shell | [Studio workspace](../../../packages/topoviewer-studio/src/app/StudioWorkspace.tsx), [workspace rail](../../../packages/topoviewer-studio/src/features/workspace/WorkspaceRail.tsx) | [shell tests](../../../packages/topoviewer-studio/tests/browser/studio-shell.spec.ts), [workspace tests](../../../packages/topoviewer-studio/tests/browser/studio-workspace-rail.spec.ts) |
| Selection-driven editing | [canvas selection capability](../../../packages/topoviewer-studio/src/features/canvas/useStudioCanvasSelection.ts), [Inspector](../../../packages/topoviewer-studio/src/features/inspector/Inspector.tsx) | [Inspector tests](../../../packages/topoviewer-studio/tests/browser/studio-inspector.spec.ts), [CRUD tests](../../../packages/topoviewer-studio/tests/browser/studio-crud.spec.ts) |
| Clear project state | [document session](../../../packages/topoviewer-studio/src/session/documentSession.ts), [session state](../../../packages/topoviewer-studio/src/features/projects/useStudioSessionState.ts) | [session tests](../../../packages/topoviewer-studio/tests/unit/document-session.test.ts), [external-change tests](../../../packages/topoviewer-studio/tests/browser/studio-external-change.spec.ts) |
| Preview and export are projections | [export snapshot](../../../packages/topoviewer-studio/src/export/exportSnapshot.ts), [export capability](../../../packages/topoviewer-studio/src/features/export/exportCapability.ts) | [snapshot tests](../../../packages/topoviewer-studio/tests/unit/export-snapshot.test.ts), [browser export tests](../../../packages/topoviewer-studio/tests/browser/studio-export.spec.ts) |
| Single public authoring application | [browser entry](../../../packages/topoviewer-studio/src/main.tsx), [VS Code Studio host](../../../packages/vscode-topoviewer/src/webview/studioVsCodeHost.ts) | [retirement guard](../../../scripts/check-authoring-surface-retirement.mjs), [deployed smoke](../../../scripts/smoke-deployed-studio.mjs) |
| Release-bound documentation screenshots | [capture script](../../../scripts/capture-readme-screenshots.mjs), [screenshot catalog](../../../scripts/lib/docs-screenshot-catalog.mjs) | [screenshot check](../../../scripts/check-readme-screenshots.mjs), [release verification](../../../scripts/verify-release-screenshots.mjs) |

### Studio Hosts And Portability

| Requirement | Implementation | Verification |
|---|---|---|
| Explicit Studio host boundary | [host contract](../../../packages/topoviewer-studio/src/contracts/host.ts), [browser host](../../../packages/topoviewer-studio/src/hosts/browserHost.ts) | [public contract tests](../../../packages/topoviewer-studio/tests/unit/public-contract.test.ts), [host conformance](../../../packages/topoviewer-studio/tests/unit/host-conformance.test.ts) |
| Browser project persistence | [browser project store](../../../packages/topoviewer-studio/src/hosts/browserProjectStore.ts), [browser preferences](../../../packages/topoviewer-studio/src/hosts/browserPreferences.ts) | [project-store tests](../../../packages/topoviewer-studio/tests/unit/browser-project-store.test.ts), [persistence browser tests](../../../packages/topoviewer-studio/tests/browser/studio-persistence.spec.ts) |
| Portable browser file workflow | [project archive](../../../packages/topoviewer-studio/src/archive/projectArchive.ts), [browser host](../../../packages/topoviewer-studio/src/hosts/browserHost.ts) | [archive tests](../../../packages/topoviewer-studio/tests/unit/project-archive.test.ts), [folder-host tests](../../../packages/topoviewer-studio/tests/unit/browser-folder-host.test.ts) |
| Thin VS Code adapter | [webview host](../../../packages/vscode-topoviewer/src/webview/studioVsCodeHost.ts), [workspace host](../../../packages/vscode-topoviewer/src/extension/workspaceStudioHost.ts) | [VS Code golden journey](../../../packages/vscode-topoviewer/tests/studio-host/golden-authoring.spec.ts), [workspace-host tests](../../../packages/vscode-topoviewer/tests/unit/workspaceStudioHost.test.ts) |
| Consumer-independent bundle output | [export snapshot](../../../packages/topoviewer-studio/src/export/exportSnapshot.ts), [documentation bundle](../../../packages/topoviewer-studio/src/export/documentationBundle.ts) | [consumer fixture](../../../packages/topoviewer/tests/studio-export-consumers.spec.js), [documentation-bundle tests](../../../packages/topoviewer-studio/tests/unit/documentation-bundle.test.ts) |
| Deterministic destination packaging | [documentation packaging](../../../packages/topoviewer-studio/src/export/documentationBundle.ts), [Grafana packaging](../../../packages/topoviewer-studio/src/export/grafanaBundle.ts) | [documentation tests](../../../packages/topoviewer-studio/tests/unit/documentation-bundle.test.ts), [Grafana tests](../../../packages/topoviewer-studio/tests/unit/grafana-bundle.test.ts) |

### Studio Direct Manipulation

| Requirement | Implementation | Verification |
|---|---|---|
| Drag-to-create object palette | [Object Palette](../../../packages/topoviewer-studio/src/features/palette/ObjectPalette.tsx), [palette authoring](../../../packages/topoviewer-studio/src/features/palette/paletteAuthoring.ts) | [CRUD tests](../../../packages/topoviewer-studio/tests/browser/studio-crud.spec.ts), [palette controller tests](../../../packages/topoviewer-studio/tests/unit/controller-palette.test.ts) |
| Direct graph relationship authoring | [canvas authoring](../../../packages/topoviewer-studio/src/features/canvas/canvasAuthoring.ts), [core graph operations](../../../packages/topoviewer/src/core/authoringGraph.ts) | [graph tests](../../../packages/topoviewer/tests/unit/authoring-graph.test.ts), [CRUD tests](../../../packages/topoviewer-studio/tests/browser/studio-crud.spec.ts) |
| Graph-valid path authoring | [authoring plans](../../../packages/topoviewer-studio/src/commands/authoringPlans.ts), [core graph operations](../../../packages/topoviewer/src/core/authoringGraph.ts) | [graph-theory tests](../../../packages/topoviewer/tests/unit/authoring-graph.test.ts), [path browser tests](../../../packages/topoviewer-studio/tests/browser/studio-crud.spec.ts) |
| Region and group-like behavior | [core region operations](../../../packages/topoviewer/src/core/authoringRegions.ts), [Studio region movement](../../../packages/topoviewer-studio/src/features/canvas/useStudioCanvasCapability.ts) | [core region tests](../../../packages/topoviewer/tests/unit/authoring-regions.test.ts), [Studio region tests](../../../packages/topoviewer-studio/tests/browser/studio-regions.spec.ts) |
| Transactional direct manipulation | [transient store](../../../packages/topoviewer-studio/src/commands/transientStore.ts), [command dispatcher](../../../packages/topoviewer-studio/src/commands/dispatcher.ts) | [dispatcher tests](../../../packages/topoviewer-studio/tests/unit/command-dispatcher.test.ts), [drag performance tests](../../../packages/topoviewer-studio/tests/performance-browser/studio-drag-performance.spec.ts) |
| Efficient repeated authoring | [canvas actions](../../../packages/topoviewer-studio/src/features/canvas/CanvasActionMenus.tsx), [selection operations](../../../packages/topoviewer-studio/src/features/canvas/selection.ts) | [CRUD permutation tests](../../../packages/topoviewer-studio/tests/browser/studio-crud.spec.ts), [drag stability tests](../../../packages/topoviewer-studio/tests/browser/studio-drag-stability.spec.ts) |

### Studio Spec-Driven Authoring

| Requirement | Implementation | Verification |
|---|---|---|
| Canonical authoring metadata | [style metadata](../../../packages/topoviewer/src/core/styleAuthoringMetadata.ts), [mapper metadata](../../../packages/topoviewer/src/core/mapperAuthoringMetadata.ts) | [metadata completeness tests](../../../packages/topoviewer/tests/unit/authoring-metadata.test.ts), [metadata drift guard](../../../scripts/check-authoring-metadata.mjs) |
| Complete generated style controls | [Basic Style Editor](../../../packages/topoviewer-studio/src/features/inspector/BasicStyleEditor.tsx), [Inspector](../../../packages/topoviewer-studio/src/features/inspector/Inspector.tsx) | [Inspector tests](../../../packages/topoviewer-studio/tests/browser/studio-inspector.spec.ts), [Material authoring tests](../../../packages/topoviewer-studio/tests/browser/studio-material-authoring.spec.ts) |
| Customizable main-field profile | [profile model](../../../packages/topoviewer-studio/src/features/inspector/profile.ts), [profile capability](../../../packages/topoviewer-studio/src/features/inspector/useStudioAuthoringProfile.ts) | [profile tests](../../../packages/topoviewer-studio/tests/unit/authoring-profile.test.ts), [preferences tests](../../../packages/topoviewer-studio/tests/unit/browser-preferences.test.ts) |
| Workspace ownership rail | [workspace rail](../../../packages/topoviewer-studio/src/features/workspace/WorkspaceRail.tsx), [Studio workspace](../../../packages/topoviewer-studio/src/app/StudioWorkspace.tsx) | [workspace tests](../../../packages/topoviewer-studio/tests/browser/studio-workspace-rail.spec.ts), [product chrome tests](../../../packages/topoviewer-studio/tests/browser/studio-product-chrome.spec.ts) |
| Typed and usable controls | [Studio controls](../../../packages/topoviewer-studio/src/ui/controls.tsx), [icon picker](../../../packages/topoviewer-studio/src/features/inspector/StudioIconPicker.tsx) | [MUI surface tests](../../../packages/topoviewer-studio/tests/unit/mui-surface.test.ts), [Material authoring tests](../../../packages/topoviewer-studio/tests/browser/studio-material-authoring.spec.ts) |
| Effective style provenance | [core provenance](../../../packages/topoviewer/src/core/styleProvenance.ts), [Style workspace](../../../packages/topoviewer-studio/src/features/inspector/StyleWorkspace.tsx) | [core provenance tests](../../../packages/topoviewer/tests/unit/style-provenance.test.ts), [Studio style tests](../../../packages/topoviewer-studio/tests/browser/studio-style-workspace.spec.ts) |
| Attribute-first style cascade authoring | [style-rule operations](../../../packages/topoviewer-studio/src/features/styles/styleRules.ts), [stylesheet mutation](../../../packages/topoviewer-studio/src/session/stylesheetCandidateMutation.ts) | [selector tests](../../../packages/topoviewer/tests/unit/style-authoring-selectors.test.ts), [rule controller tests](../../../packages/topoviewer-studio/tests/unit/controller-style-rules.test.ts) |
| Lossless structured editing | [document session](../../../packages/topoviewer-studio/src/session/documentSession.ts), [YAML source operations](../../../packages/topoviewer-studio/src/session/yamlSource.ts) | [round-trip tests](../../../packages/topoviewer-studio/tests/unit/document-session-roundtrip.test.ts), [candidate mutation tests](../../../packages/topoviewer-studio/tests/unit/stylesheet-candidate-mutation.test.ts) |

### Studio Telemetry Mapper

| Requirement | Implementation | Verification |
|---|---|---|
| Mapper authoring in the shared workspace | [Mapper workspace](../../../packages/topoviewer-studio/src/features/mapper/MapperWorkspace.tsx), [mapper capability](../../../packages/topoviewer-studio/src/features/mapper/useStudioMapperCapability.ts) | [mapper browser tests](../../../packages/topoviewer-studio/tests/browser/studio-mapper.spec.ts), [round-trip tests](../../../packages/topoviewer-studio/tests/unit/document-session-roundtrip.test.ts) |
| Complete mapper contract coverage | [canonical mapper metadata](../../../packages/topoviewer/src/core/mapperAuthoringMetadata.ts), [generated mapper fields](../../../packages/topoviewer-studio/src/features/mapper/MapperGeneratedFields.tsx) | [metadata completeness tests](../../../packages/topoviewer/tests/unit/authoring-metadata.test.ts), [field-model tests](../../../packages/topoviewer-studio/tests/unit/mapper-field-model.test.ts) |
| Progressive mapper workflow | [Mapper workspace](../../../packages/topoviewer-studio/src/features/mapper/MapperWorkspace.tsx), [generated fields](../../../packages/topoviewer-studio/src/features/mapper/MapperGeneratedFields.tsx) | [mapper browser tests](../../../packages/topoviewer-studio/tests/browser/studio-mapper.spec.ts), [accessibility tests](../../../packages/topoviewer-studio/tests/browser/studio-accessibility.spec.ts) |
| Target-compatible mapper styling | [Mapper Style Editor](../../../packages/topoviewer-studio/src/features/mapper/MapperStyleEditor.tsx), [style metadata](../../../packages/topoviewer/src/core/styleAuthoringMetadata.ts) | [mapper browser tests](../../../packages/topoviewer-studio/tests/browser/studio-mapper.spec.ts), [metadata tests](../../../packages/topoviewer/tests/unit/authoring-metadata.test.ts) |
| Sample-driven rule inference | [core inference](../../../packages/topoviewer/src/core/mapperInference.ts), [sample workspace](../../../packages/topoviewer-studio/src/features/mapper/MapperSampleWorkspace.tsx) | [inference tests](../../../packages/topoviewer/tests/unit/mapper-inference.test.ts), [mapper browser tests](../../../packages/topoviewer-studio/tests/browser/studio-mapper.spec.ts) |
| Mapper coverage diagnostics | [core coverage](../../../packages/topoviewer/src/core/mapperCoverage.ts), [analysis projection](../../../packages/topoviewer-studio/src/features/mapper/mapperAnalysisProjection.ts) | [coverage tests](../../../packages/topoviewer/tests/unit/mapper-coverage.test.ts), [analysis tests](../../../packages/topoviewer-studio/tests/unit/mapper-analysis.test.ts) |
| Mapper round-trip safety | [document session](../../../packages/topoviewer-studio/src/session/documentSession.ts), [YAML source operations](../../../packages/topoviewer-studio/src/session/yamlSource.ts) | [mapper fixture](../../../packages/topoviewer-studio/tests/fixtures/mapper-roundtrip.yaml), [round-trip tests](../../../packages/topoviewer-studio/tests/unit/document-session-roundtrip.test.ts) |

### Studio Production Readiness

| Requirement | Implementation | Verification |
|---|---|---|
| Measured workflow improvement | [performance contract](../../../packages/topoviewer-studio/PERFORMANCE.md), [budget configuration](../../../packages/topoviewer-studio/performance-budgets.json) | [performance runner](../../../scripts/run-studio-performance-suite.mjs), [benchmark policy tests](../../../packages/topoviewer-studio/tests/unit/performance-benchmark-policy.test.ts) |
| Interaction and bundle budgets | [budget configuration](../../../packages/topoviewer-studio/performance-budgets.json), [render ownership](../../../packages/topoviewer-studio/src/features/canvas/CanvasSurface.tsx) | [drag benchmark](../../../packages/topoviewer-studio/tests/performance-browser/studio-drag-performance.spec.ts), [bundle budget check](../../../scripts/check-studio-bundle-budgets.mjs) |
| Accessible authoring workflow | [accessibility contract](../../../packages/topoviewer-studio/ACCESSIBILITY.md), [Studio UI controls](../../../packages/topoviewer-studio/src/ui/controls.tsx) | [accessibility browser tests](../../../packages/topoviewer-studio/tests/browser/studio-accessibility.spec.ts), [MUI surface tests](../../../packages/topoviewer-studio/tests/unit/mui-surface.test.ts) |
| Untrusted-input security | [project security](../../../packages/topoviewer-studio/src/security/projectSecurity.ts), [host security](../../../packages/topoviewer-studio/src/hostSecurity.ts) | [Studio security tests](../../../packages/topoviewer-studio/tests/unit/studio-security.test.ts), [security browser tests](../../../packages/topoviewer-studio/tests/browser/studio-security.spec.ts) |
| Failure containment and recovery | [error boundary](../../../packages/topoviewer-studio/src/app/StudioErrorBoundary.tsx), [autosave](../../../packages/topoviewer-studio/src/app/useStudioAutosave.ts) | [persistence browser tests](../../../packages/topoviewer-studio/tests/browser/studio-persistence.spec.ts), [external-change tests](../../../packages/topoviewer-studio/tests/browser/studio-external-change.spec.ts) |
| Material UI-owned Studio styling | [theme provider](../../../packages/topoviewer-studio/src/ui/StudioThemeProvider.tsx), [shared UI controls](../../../packages/topoviewer-studio/src/ui/controls.tsx) | [Material ownership guard](../../../scripts/check-studio-material-controls.mjs), [theme ownership guard](../../../scripts/check-studio-theme-ownership.mjs) |
| Cross-host and cross-browser verification | [shared golden journey](../../../packages/topoviewer-studio/tests/support/goldenAuthoringJourney.ts), [VS Code host](../../../packages/vscode-topoviewer/src/webview/studioVsCodeHost.ts) | [browser golden journey](../../../packages/topoviewer-studio/tests/parity/studio-golden-authoring.spec.ts), [VS Code golden journey](../../../packages/vscode-topoviewer/tests/studio-host/golden-authoring.spec.ts) |
| Staged Studio support evidence | [Studio documentation](../../../packages/topoviewer/content/pages/author/studio/index.md), [Pages workflow](../../../.github/workflows/docs.yml) | [public-readiness guard](../../../scripts/check-public-readiness.mjs), [deployed smoke](../../../scripts/smoke-deployed-studio.mjs) |

## Residual Risk Register

| Risk | Severity | Owner | Target | Why it does not block this exit |
|---|---|---|---|---|
| Browser Studio remains Beta Preview until independent adopters complete real authoring workflows across two clean release cycles. | Medium | Studio maintainers | Evidence-driven promotion, no earlier than `0.5.0` | The public support label is explicit; current claims are limited to the tested desktop browser scope. |
| VS Code integration remains Experimental and no VSIX is published. | Medium | VS Code adapter maintainers | `0.4.x` packaging decision | Browser Studio is the public Beta surface; the adapter passes shared contracts without being advertised as supported. |
| Browser projects are local to one browser profile and do not provide cloud synchronization or collaboration. | Medium | Browser host maintainers | `0.4.x` portability review | Deterministic archive import/export is tested and is the documented durable interchange. |
| Dense stylesheet candidate settlement remains approximately 0.85 seconds and would need incremental or worker-based projection before raising graph ceilings. | Medium | Studio performance owner | Before increasing supported density | Immediate control response remains within budget and current dense fixtures pass the published hard limits. |
| Monaco and export tooling produce large lazy chunks and Vite emits generic 500 kB warnings. | Low | Studio performance owner | `0.4.x` optimization review | They are excluded from initial startup and remain below versioned compressed lazy-chunk budgets. |
| Grafana SDK packages retain six documented transitive npm advisory paths. | Medium | Grafana panel maintainers | Next validated Grafana-compatible dependency upgrade | Production npm audit is clean, direct TopoViewer dependencies are remediated, and the accepted paths are SDK/dev-tooling dependencies recorded by CI. |

## Validation Record

Phase 19 was closed on commit `737b71acebc314ed51c6a26dc30caf7f8471fa7c`:

- clean worktree `npm run ci`: passed on 2026-07-21 in 15m 4.6s;
- OpenSpec strict validation: passed;
- [CI](https://github.com/asadarafat/topoviewer/actions/runs/29853301703): passed;
- [Security](https://github.com/asadarafat/topoviewer/actions/runs/29853302648): passed;
- [CodeQL](https://github.com/asadarafat/topoviewer/actions/runs/29853301431): passed;
- [Docs and Pages](https://github.com/asadarafat/topoviewer/actions/runs/29853301357): passed, including deployed Studio smoke.

The exact closeout candidate SHA and its local and remote gate results are added
only after that candidate is committed and verified. Archive is prohibited
until those entries and tasks 20.6-20.7 are complete.
