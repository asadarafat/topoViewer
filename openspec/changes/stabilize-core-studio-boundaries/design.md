## Context

The published `topoviewer` package is the dependency foundation for React,
Studio, VS Code, Grafana, MkDocs assets, and the static browser embed. It has
strong semantic and security tests, but its package metadata currently fails
Are The Types Wrong, `publint` reports module ambiguity, its tarball includes
the entire documentation source tree, and its build policy is repeated across
four Vite configurations.

Studio declares `topoviewer` as a dependency but aliases each public subpath to
`packages/topoviewer/src`. That is convenient for development, but it means the
normal Studio build does not prove the npm artifact contract. Studio also has
feature modules importing `app/controller*` helpers, a root controller near
1,000 lines, a workspace near 1,000 lines, and a canvas receiving dozens of
independent props. The initial Studio bundle is 408,534 gzip bytes, almost equal
to its existing budget.

The current canonical-object-identity change is implementation-complete except
for broad validation. This change depends on that contract and SHALL NOT
reintroduce generic names or inline topology appearance.

## Goals / Non-Goals

**Goals:**

- Make the packed core artifact the tested integration boundary.
- Preserve current ESM, CommonJS, and browser-IIFE runtime consumers while
  making module and declaration formats explicit.
- Keep export dependencies outside the normal renderer execution path.
- Reduce npm artifact content and eliminate documentation drift.
- Make Studio feature ownership and dependency direction mechanically visible.
- Reduce broad React invalidation without changing authoring semantics.
- Add measurable compatibility, journey, visual, and bundle gates.

**Non-Goals:**

- Splitting core into independently versioned npm packages in this change.
- Replacing React Flow, Material UI, Vite, Vitest, or Playwright.
- Introducing Redux, Zustand, XState, Next.js, Turborepo, authentication, or a
  hosted backend.
- Changing topology, stylesheet, mapper, attention, or project archive schemas.
- Reworking renderer geometry or adding new Studio authoring features.
- Claiming support for a runtime that is not covered by a consumer matrix.

## Decisions

### 1. Core is a hard prerequisite for Studio migration

No Studio import-resolution or controller migration begins until core package
lint, declaration resolution, tarball inspection, and focused consumer fixtures
pass. This prevents Studio from being refactored twice.

Alternative considered: refactor Studio first because it has more visible UX
debt. Rejected because Studio currently imports source paths that the package
work changes.

### 2. Preserve dual module compatibility with explicit artifacts

ESM is the canonical implementation format. Existing CommonJS entry points are
preserved with `.cjs` filenames and condition-specific declarations. The
browser embed remains an IIFE script and is not treated as a Node module API.

Declarations are bundled per public JavaScript entry so consumers do not depend
on the package's internal declaration tree or unresolved CSS imports. Package
lint and type-resolution tools determine whether the condition map is valid.

Alternative considered: become ESM-only immediately. Rejected because the
repository explicitly tests `require()` and no consumer deprecation cycle has
been announced.

### 3. Public entries express capability ownership

The package keeps the renderer root and existing `authoring`, `integration`, and
`security` entries. It adds an `export` entry for image/PDF behavior. Existing
root export functions remain as lazy compatibility wrappers during the 0.x
migration rather than statically importing export dependencies.

Build configurations use one shared policy for external React dependencies,
formats, names, and filenames. Separate Vite invocations remain acceptable
because UMD builds do not naturally support a multi-entry library configuration.

### 4. CSS is an explicit consumer asset

The renderer does not import CSS from a declaration-producing component.
`topoviewer/style.css` remains the explicit React consumer contract, while the
browser embed bundles its own CSS. Development and host surfaces import the
public CSS entry explicitly.

### 5. Canonical documentation generates the package README

`packages/topoviewer/content/pages/_fragments/readme.md` remains canonical.
Repository sync writes both the root README and a package-focused README or
validated projection from that source. The npm tarball excludes `content/pages`.

### 6. Compatibility is tested as a consumer, not inferred from the monorepo

CI packs the package and installs it in temporary fixtures. Fixtures cover ESM,
CommonJS, SSR import without a browser global, TypeScript module resolution,
CSS/schema exports, and a minimal Vite consumer. A matrix covers the documented
Node and React combinations without relaxing the repository's Node 24 developer
toolchain.

### 7. Studio consumes package exports in normal builds

Studio Vite configuration removes aliases to core source. Root development
scripts build core before starting Studio. A focused development-only test
configuration may use workspace resolution, but at least one required lane MUST
install and build against the packed tarball.

### 8. Studio uses feature models and actions, not a new global framework

Project/session, canvas, style, mapper, viewport, and export features own narrow
state projections and commands. The root controller composes these capabilities
but does not expose raw implementation state indiscriminately.

The first migration replaces `CanvasSurface`'s broad prop list with immutable
`CanvasModel` and `CanvasActions` contracts and moves canvas helpers out of
`app/`. Subsequent controller extraction follows measured invalidation paths.

Alternative considered: add a global state library. Rejected because it would
move the god object rather than establish ownership and would add migration risk
without baseline evidence.

### 9. Real workflows are release contracts

Playwright journeys cover a small set of complete authoring tasks derived from
recorded failures: create and edit links, multi-select and align, move/resize a
region, style an object, and export/reopen a project. Stable screenshots cover
shell, palette, Inspector, mapper, and dialogs at representative viewports.

### 10. Bundle budgets are ratcheted from measured improvements

The current initial Studio baseline is 408,534 gzip bytes. Code splitting is
applied at feature boundaries where first paint does not require the feature.
The budget is lowered only after a repeatable build proves the new baseline,
with a small documented tolerance. Dense-graph runtime behavior must not regress
while reducing boot payload.

## Risks / Trade-offs

- **Dual-package declaration complexity** -> Bundle declarations per entry and
  require both `publint` and Are The Types Wrong to pass before migration.
- **CSS becomes accidentally absent in a host** -> Add explicit imports and
  visible browser parity tests for every supported host.
- **Lazy compatibility wrappers alter chunk timing** -> Keep async function
  signatures and add export behavior tests.
- **Packed Studio builds slow CI** -> Run the packed-contract lane once as a
  focused prerequisite, not in every browser matrix shard.
- **Controller decomposition causes stale closures or selection drift** -> Move
  one feature boundary at a time and preserve existing workflow tests.
- **Visual snapshots become noisy** -> Limit screenshots to stable chrome and
  normalize animation, fonts, viewport, and test data.
- **Bundle reduction harms interaction performance** -> Keep canvas/runtime code
  eager and use existing startup, drag, Inspector, mapper, and memory budgets.

## Migration Plan

1. Record package, bundle, boundary, and module-resolution baselines.
2. Correct core artifacts and package metadata while preserving current public
   symbols through compatibility wrappers.
3. Pass focused core, package lint, packed-consumer, and artifact checks.
4. Remove Studio source aliases and prove built-package consumption.
5. Enforce feature dependency direction and migrate the canvas contract.
6. Extract controller capabilities in measured, behavior-preserving steps.
7. Add journey/visual checks and ratchet the bundle budget.
8. Run cross-surface and full local CI before considering archive or release.

Rollback is phase-local: core package changes can be reverted before Studio
migration; Studio keeps public behavior and can revert a feature boundary
without reverting the stable package contract.

## Open Questions

- Whether CommonJS usage remains material enough to retain beyond the next
  minor release; this change preserves it and records consumer evidence.
- Whether a future pure model package is justified by independent consumers;
  this change establishes entry boundaries but does not create another package.
- Whether the improved Studio initial payload can reach 300 KB gzip without
  deferring functionality required for useful first paint; measurement decides
  the final ratcheted threshold.
