# TopoViewer Studio Performance Contract

TopoViewer Studio uses the versioned thresholds in `performance-budgets.json`.
Transient reports are written under `.artifacts/topoviewer-studio/performance/`
and are not committed. A threshold change requires measured before/after
reports, a rationale in this document, and an owner.

## Reference Runner

The reference local runner is Node.js 24 on the repository's Linux OrbStack
environment on Apple silicon, using Playwright Chromium at a 1440 by 960 CSS
pixel viewport without CPU throttling. CI may run on different hardware, so
each benchmark performs two warmups followed by seven samples and records the
median, p95, range, and coefficient of variation.

The complete functional browser matrix uses three workers. On the 8-core
reference runner, five concurrent Chromium workers caused unrelated Monaco,
mapper, CRUD, and accessibility scenarios to exceed their 30-second contracts;
the same 108-test matrix passed with three workers in 4.0 minutes. Performance
and cross-browser parity suites remain single-worker so their timing and state
evidence is deterministic.

Performance Playwright runs disable trace snapshots because serializing a dense
DOM around every pointer API call changes the measured interaction by hundreds
of milliseconds. Functional browser suites retain traces on failure; the
performance suite uses in-page animation-frame and Long Task observers instead.

Metrics at or above five milliseconds must remain below a 0.50 coefficient of
variation. Faster metrics use a 15 millisecond absolute-range limit because a
coefficient is misleading near timer resolution. Reports that violate the
variance policy fail instead of accepting one favorable sample.

The allocation-heavy dense projection benchmark and immediate browser
interaction benchmarks may exclude exactly one maximum sample from their
variance calculation. The raw sample remains in the report, the median must
still pass its budget, the maximum must remain below the benchmark's hard cap,
and the trimmed series must satisfy the coefficient-of-variation threshold.
This bounded policy prevents one garbage-collection or browser-scheduler pause
from invalidating otherwise stable work without allowing that pause to escape
an absolute threshold.

## Phase 0 Baseline

The retired authoring baseline remains in the budget file for comparison. Its
production entry was 465,436 compressed bytes. The 1,000-node runtime sample
reported 6,237 milliseconds to startup, a 450 millisecond p95 drag frame, 115
frames above 50 milliseconds, and 2,228 milliseconds after pointer release.
Those values document the old path; they are not acceptable Studio budgets.

## Startup Profile

The Phase 17 startup run uses a production build and a canvas-ready performance
mark. It verifies the initial request graph does not fetch Monaco, mapper,
export, archive, or image-export chunks.

| Metric | Pre-Material baseline | Material authoring |
|---|---:|---:|
| Median canvas ready | 45.3 ms | 75.1 ms |
| p95 canvas ready | 54.3 ms | 92.3 ms |
| Cross-run median CV | 0.050 | 0.057 |

The Basic/YAML candidate workspace run on 2026-07-14 measured 119.3
milliseconds median and 128.8 milliseconds maximum canvas-ready time. The
initial request graph contained six resources and none of the prohibited Monaco,
mapper, export, archive, or image-export chunks.

The profile found that `main.tsx` eagerly constructed development-only memory,
fixture, persistence-failure, and external-change hosts. Those capabilities now
live behind a dynamic development/performance boundary. The initial request
graph contains five resources and no prohibited lazy workspace.

Studio has no broad React context provider. Session state is owned by the
workspace controller, while high-frequency drag preview stays in the core
renderer and canvas path. Inspector search, mapper samples, drawer state, and
editor models remain feature-local. Later sections record measured render and
interaction counts before considering additional memoization or virtualization.

The three repeated startup medians ranged from 71.0 to 81.6 milliseconds. A
palette drop became visible in 20.1 milliseconds median and 24.6 milliseconds
maximum across the repeated suite.

## Dense Session Profile

The unit session benchmark separates YAML parsing, document projection, and a
fixed-width position mutation on the 1,000-node/2,500-link fixture. Values below
are medians across the three repeated-run medians.

| Operation | Median | Approved budget |
|---|---:|---:|
| Parse dense YAML | 174.3 ms | 500 ms |
| Project dense document | 196.7 ms | 1,000 ms |
| Commit one position edit | 3.9 ms | 50 ms |

The dense mutation measurement amortizes five consecutive edits and reports the
per-edit cost. The benchmark reuses bounded mutable sessions rather than
retaining eighteen fully parsed dense sessions and measuring artificial garbage
collection pressure. Every sample still changes source state. The position-only
compiler validates the constrained change and reuses unchanged semantic graph
identities.

## Dense Drag Profile

The drag benchmark exercises helper-line discovery and commit snapping against
stable 2-node/1-link, 100-node/250-link, and 1,000-node/2,500-link fixtures. It
also verifies that the source object moves, the canvas remains nonblank, and
helper lines clear after release. The 1,000-node fixture enables viewport
culling and rendered 90 nodes and 708 edges in the measured viewport.

| Source graph | Median render | Drag p95 frame | Worst frame | Median commit | Long tasks per gesture |
|---|---:|---:|---:|---:|---:|
| 2 nodes / 1 link | 121.8 ms | 16.8 ms | 16.8 ms | 2.9 ms | 0 |
| 100 nodes / 250 links | 602.7 ms | 16.8 ms | 50.0 ms | 4.8 ms | 0 |
| 1,000 nodes / 2,500 links | 2,835.6 ms | 33.4 ms | 83.4 ms | 13.7 ms | 4 |

The dense gesture's longest observed task was 86 milliseconds, below the 100
millisecond hard budget. The implementation keeps active pointer movement in
React Flow's runtime store, freezes expensive label geometry during drag,
indexes helper-line candidates, uses bounded label collision lookups, and
commits YAML only after release. Manual position-only updates patch compiled
positions without rebuilding unchanged graph semantics. A compile-generation
token prevents a position fast path from racing ahead of a pending structural
graph reconciliation. Region-membership preview is not attached when a
document has no regions, avoiding a semantic lookup on every pointer move.

The reviewed dense count allows at most four tasks above 50 milliseconds during
the 36-step helper-line stress gesture while retaining the 100 millisecond hard
cap. This is a measured interaction budget, not a waiver. Candidate context
updates reuse the document session's parsed sources and already validated clean
projection; a topology position commit must not parse and compile an unchanged
stylesheet again.

The canonical machine-readable results are emitted to
`.artifacts/topoviewer-studio/performance/current/drag.json`; the directory is
intentionally ignored because benchmark output is runner-specific and belongs
in CI artifacts rather than source control.

## Basic And YAML Style Profile

The production benchmark selects objects on the 1,000-node/2,500-link fixture,
renders the metadata-generated Basic fields, searches and opens groups, and
commits exact-ID candidate colors. It separates the immediate control response
from completion of full candidate validation and canvas projection.

| Interaction | Median | Maximum |
|---|---:|---:|
| Basic group toggle | 23.1 ms | 25.8 ms |
| Field search | 15.2 ms | 16.5 ms |
| Selection change | 97.8 ms | 102.4 ms |
| Basic color commit response | 9.3 ms | 14.7 ms |
| Full candidate settlement | 848.6 ms | 891.2 ms |

The measured node target exposes 26 Basic fields and renders 25 in the selected
context. Basic averages 1.14 renders per measured or reset interaction. A
structured edit publishes candidate text immediately and starts the expensive
validation after a 32 millisecond first-paint delay. Prepared controller
evaluation reuses parsed topology and mapper sources and measures 40.4
milliseconds median on the dense fixture.

The 1.5-second median and 2.5-second hard candidate-settlement limits describe
full validation and renderer projection, not acceptable input latency. Full
dense settlement remains approximately 0.85 seconds and is the primary residual
risk if the supported graph ceiling grows. Future work should make dense
projection incremental or off-main-thread before raising those limits.

The canonical report is
`.artifacts/topoviewer-studio/performance/current/inspector.json`.

## Mapper Profile

Mapper measurements separate bounded JSON ingestion from coverage analysis.
Ingestion remains synchronous because 5,000 normalized samples parse in 11.1
milliseconds median. Coverage analysis grows with both topology and sample
cardinality and therefore moves to a dedicated worker above 250 samples.

| Coverage fixture | Median | Maximum |
|---|---:|---:|
| 50 samples | 0.18 ms | 0.21 ms |
| 500 samples | 0.54 ms | 0.55 ms |
| 5,000 samples / 1,000 nodes | 4.48 ms | 4.58 ms |

Resolver indexes cache ID, label, data, endpoint, direction, and selector
lookups for the duration of one coverage evaluation. The production worker
benchmark analyzes 5,000 samples in 115.5 milliseconds median and 147.5
milliseconds maximum against the two-node mapper fixture. The main thread
maintains a 16.8 millisecond p95 frame interval and records no long task. The
large controlled sample input is isolated behind a memoized state boundary, so
worker status and bounded coverage results do not rerender 1.5 MiB of unchanged
JSON. The UI reports `data-analysis-mode="worker"`, and the browser test waits
for the auditable “Analyzed off the main thread” state rather than inferring
worker use from timing.

Canonical reports are
`.artifacts/topoviewer-studio/performance/current/mapper.json` and
`.artifacts/topoviewer-studio/performance/current/mapper-worker.json`.

## Memory Profile

The Chromium memory gate warms all lazy modules before taking a forced-GC
baseline, then runs ten lifecycle cycles. Every cycle opens and closes Monaco,
ingests mapper samples through a worker, creates and undoes an object, exports
SVG, enters and exits presentation, imports a portable archive, deletes the
imported project, and returns to the original canvas. Heap usage comes from the
Chrome DevTools Protocol after `HeapProfiler.collectGarbage`, not an uncollected
`performance.memory` snapshot.

The Basic/YAML candidate run began at 24,677,820 bytes and retained 4,036,048
bytes after ten cycles, below the 16 MiB budget. The report keeps every
per-cycle sample so repeated-suite review can distinguish a stable cache plateau
from unbounded growth.

The canonical report is
`.artifacts/topoviewer-studio/performance/current/memory.json`.

## Bundle Profile

`performance-bundle-baseline.json` is the checked-in comparison point for the
browser Studio and VS Code webview. The shared checker computes gzip bytes from
built artifacts, enforces the versioned limits below, and prints absolute and
percentage deltas in the performance CI lane. It also fails if Monaco, mapper,
or export stops being a lazy JavaScript feature boundary.

| Surface | Initial CSS gzip | Initial JS gzip | Largest lazy JS gzip | Total lazy JS gzip | Extension host |
|---|---:|---:|---:|---:|---:|
| Browser Studio | 20,515 B | 366,496 B | 640,982 B | 1,140,779 B | n/a |
| VS Code webview | 20,734 B | 360,337 B | 640,972 B | 1,141,019 B | 51,890 B |

Both surfaces remain below the 24 KiB initial CSS, 400 KiB initial JS, 700 KiB
largest lazy chunk, and 1.2 MiB total lazy JavaScript budgets. The VS Code host
also remains below 64 KiB. Baseline updates are explicit; ordinary CI runs only
compare and enforce.

The Material authoring migration adds 1,013 compressed CSS bytes and 72,793
compressed initial JavaScript bytes to Browser Studio. The VS Code webview adds
1,030 CSS bytes and 72,612 initial JavaScript bytes. This is an intentional
product tradeoff for one consistent, accessible control system across every
Studio surface. Supported second-level imports remain tree-shakeable. Monaco,
mapper, and export remain lazy; total lazy JavaScript grew by only 1,793 bytes
in Studio and 1,743 bytes in the webview. No hard budget was raised.

The former raw-byte guard was retired with the duplicate authoring application.
`scripts/check-studio-bundle-budgets.mjs` now owns both Browser Studio and VS
Code webview budgets, lazy-feature checks, and checked-in baseline comparison.

## Repeated Suite

`npm run studio:benchmark:repeat` completed three full serial runs on the
reference runner. Every unit, production-browser, memory, and bundle gate
passed, and the aggregate report contained 216 cross-run numeric metrics with
no failure. The highest validated median coefficient of variation was 0.204 for
an 8.7 to 13.8 millisecond Inspector search. Dense render medians had a 0.025
coefficient of variation, and dense commit medians had a 0.120 coefficient of
variation.

The budgets in `performance-budgets.json` are approved and owned by the
TopoViewer Studio maintainers. Changes require a versioned threshold update,
measured before/after evidence, and reviewable rationale here.

## Waivers

No performance-budget waiver is approved.
