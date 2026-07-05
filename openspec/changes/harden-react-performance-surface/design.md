## Audit Baseline

The React best-practice audit identified five implementation tracks:

1. Split Monaco/YAML authoring behind dynamic imports.
2. Replace MUI barrel imports with direct imports or a Vite-compatible import
   optimizer.
3. Add bundle budget checks for the browser Harness and VS Code webview.
4. Profile `WebviewApp` and split editor, preview, rail, and persistence state
   boundaries.
5. Wrap direct `localStorage.setItem` calls in safe helpers.

The Vercel guidance is prioritized. Bundle-size work and accidental waterfall
work should be resolved before lower-level render micro-optimizations. The
TopoViewer audit found no obvious critical fixture-load waterfall in the
checked embed and workbench paths, so this change should start with bundle
splitting and measurable authoring payload budgets.

## Surface Scope

Primary surfaces:

- `packages/topoviewer/src/components/TopoViewerWorkbench.tsx`
- `packages/vscode-topoviewer/src/webview/WebviewApp.tsx`
- `packages/vscode-topoviewer/src/webview/AuthoringRail.tsx`
- `packages/vscode-topoviewer/src/webview/MapperYamlTools.tsx`
- `packages/vscode-topoviewer/src/webview/WebviewChrome.tsx`
- `packages/vscode-topoviewer/src/webview/webviewAppSupport.tsx`
- `packages/vscode-topoviewer/src/webview/host.ts`

Secondary surfaces:

- harness build scripts and generated build reports;
- root CI orchestration;
- docs/developer guidance for reading performance reports.

Out of scope unless directly affected:

- topology/style/mapper schema;
- renderer visual behavior;
- Grafana mounted-bundle behavior;
- MkDocs and Zensical projection semantics.

## Bundle Strategy

### Monaco

Monaco and YAML authoring tools should not be part of the first boot path when a
surface can show chrome, fixture metadata, and the rendered preview without the
editor being ready.

Preferred shape:

- dynamically import Monaco editor components behind the YAML/editor tab or
  behind the authoring rail mount;
- render a small loading state while the editor chunk loads;
- preserve existing editor ready callbacks, diagnostics decorations, and YAML
  assist behavior;
- preload the editor chunk on clear user intent, such as hovering or selecting
  the YAML tab, if measurement shows this improves perceived latency.

### MUI Imports

The repo currently uses Vite surfaces, not a Next.js compiler with automatic
package import optimization. Broad imports such as:

```ts
import { Box, Button, Stack } from '@mui/material';
```

should either become direct imports:

```ts
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
```

or be handled by a proven Vite-compatible import optimizer. Direct imports are
the preferred first implementation because they are explicit, easy to audit,
and do not add another build dependency.

Do not apply this blindly to package exports where tree-shaking is already
known to be optimal. The task sequence requires measurement before and after.

## Bundle Budget Model

The first phase records current artifact sizes. The implementation phase then
sets budgets from improved output.

Budget checks should report:

- raw bytes;
- gzip bytes where practical;
- largest entry chunk;
- largest lazy chunk;
- whether Monaco appears in an initial entry chunk;
- whether MUI barrel imports remain in source files covered by the budget.

Budget checks should be local-first and CI-enforced after they are credible.
The check should fail when:

- an initial Harness or VS Code webview entry chunk exceeds its checked-in
  budget plus a small documented tolerance;
- Monaco or editor-only authoring code moves back into an initial chunk;
- forbidden MUI barrel imports are reintroduced in budgeted source paths.

Budgets must not be based on stale generated `site/` files. The check should
build or inspect the current build output produced by the repo scripts.

## Webview Re-render Strategy

Do not split `WebviewApp` only because it is large. Split it where profiling
shows repeat work or broad invalidation.

Expected boundaries:

- editor text and Monaco diagnostics;
- preview document composition and viewer rendering;
- authoring rail controls;
- object inspector and relationship composer;
- persistence and storage helpers;
- mapper rule builder/coverage previews.

Use the React Profiler or a lightweight render-count instrumentation that can be
run locally and removed or disabled in production. The implementation should
record before/after evidence before claiming re-render improvement.

The likely end state is not one global store. It is smaller React boundaries
with explicit props and memoization where it pays off.

## Storage Strategy

Create or reuse a small browser storage helper with:

- `getJson` / `setJson` or equivalent typed helpers;
- string value helpers for simple preferences;
- consistent try/catch around storage access;
- quota/security error swallowing with optional debug diagnostics;
- versioned key names;
- fallback defaults when stored data is invalid.

Replace direct `localStorage.setItem` calls in React effects and host helpers
with this helper.

Storage helpers must not hide all problems silently in tests. Unit tests should
cover unavailable storage, quota errors, invalid JSON, and valid migration
cases.

## Testing And Evidence

Required evidence before completion:

- baseline bundle report before changes;
- improved bundle report after dynamic imports/direct imports;
- checked-in budget config or script output proving budgets are enforced;
- focused tests for safe storage helpers;
- WebviewApp before/after profiling evidence or render-count evidence;
- focused Harness/webview smoke proving the YAML authoring loop still works;
- full local validation or the agreed focused subset before commit.

Evidence artifacts must live under `.artifacts/react-performance-surface/` or
similar local-only paths, not inside `openspec/changes/**`.
