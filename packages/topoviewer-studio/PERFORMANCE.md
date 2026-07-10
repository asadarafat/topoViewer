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

Performance Playwright runs disable trace snapshots because serializing a dense
DOM around every pointer API call changes the measured interaction by hundreds
of milliseconds. Functional browser suites retain traces on failure; the
performance suite uses in-page animation-frame and Long Task observers instead.

Metrics at or above five milliseconds must remain below a 0.50 coefficient of
variation. Faster metrics use a 15 millisecond absolute-range limit because a
coefficient is misleading near timer resolution. Reports that violate the
variance policy fail instead of accepting one favorable sample.

The allocation-heavy dense projection benchmark may exclude exactly one
maximum sample from its variance calculation. The raw sample remains in the
report and must still pass the absolute budget. This bounded policy prevents a
single garbage-collection pause from invalidating otherwise stable work without
allowing the pause to escape the hard threshold.

## Phase 0 Baseline

The old Harness baseline remains in the budget file for comparison. Its
production entry was 465,436 compressed bytes. The 1,000-node runtime sample
reported 6,237 milliseconds to startup, a 450 millisecond p95 drag frame, 115
frames above 50 milliseconds, and 2,228 milliseconds after pointer release.
Those values document the old path; they are not acceptable Studio budgets.

## Startup Profile

The Phase 17 startup run uses a production build and a canvas-ready performance
mark. It verifies the initial request graph does not fetch Monaco, mapper,
export, archive, or image-export chunks.

| Metric | Before | After |
|---|---:|---:|
| Median canvas ready | 70.7 ms | 45.3 ms |
| p95 canvas ready | 81.0 ms | 54.3 ms |
| Cross-run median CV | n/a | 0.050 |

The profile found that `main.tsx` eagerly constructed development-only memory,
fixture, persistence-failure, and external-change hosts. Those capabilities now
live behind a dynamic development/performance boundary. The initial request
graph contains four resources and no prohibited lazy workspace.

Studio has no broad React context provider. Session state is owned by the
workspace controller, while high-frequency drag preview stays in the core
renderer and canvas path. Inspector search, mapper samples, drawer state, and
editor models remain feature-local. Later sections record measured render and
interaction counts before considering additional memoization or virtualization.

The three repeated startup medians ranged from 43.0 to 48.6 milliseconds. A
palette drop became visible in 19.1 milliseconds median and 23.1 milliseconds
maximum across the repeated suite.

## Dense Session Profile

The unit session benchmark separates YAML parsing, document projection, and a
fixed-width position mutation on the 1,000-node/2,500-link fixture. Values below
are medians across the three repeated-run medians.

| Operation | Median | Approved budget |
|---|---:|---:|
| Parse dense YAML | 157.4 ms | 500 ms |
| Project dense document | 187.0 ms | 1,000 ms |
| Commit one position edit | 3.5 ms | 50 ms |

The dense mutation measurement amortizes five consecutive edits and reports the
per-edit cost. The position-only compiler validates the constrained change and
reuses unchanged semantic graph identities.

## Dense Drag Profile

The drag benchmark exercises helper-line discovery and commit snapping against
stable 2-node/1-link, 100-node/250-link, and 1,000-node/2,500-link fixtures. It
also verifies that the source object moves, the canvas remains nonblank, and
helper lines clear after release. The 1,000-node fixture enables viewport
culling and rendered 90 nodes and 708 edges in the measured viewport.

| Source graph | Median render | Drag p95 frame | Worst frame | Median commit | Long tasks per gesture |
|---|---:|---:|---:|---:|---:|
| 2 nodes / 1 link | 61.1 ms | 16.8 ms | 33.3 ms | 2.1 ms | 0 |
| 100 nodes / 250 links | 270.3 ms | 16.8 ms | 33.4 ms | 2.6 ms | 0 |
| 1,000 nodes / 2,500 links | 1,303.2 ms | 16.8 ms | 66.7 ms | 8.6 ms | 1 |

The dense gesture's longest observed task was 75 milliseconds, below the 100
millisecond hard budget. The implementation keeps active pointer movement in
React Flow's runtime store, freezes expensive label geometry during drag,
indexes helper-line candidates, uses bounded label collision lookups, and
commits YAML only after release. Manual position-only updates patch compiled
positions without rebuilding unchanged graph semantics. A compile-generation
token prevents a position fast path from racing ahead of a pending structural
graph reconciliation.

The canonical machine-readable results are emitted to
`.artifacts/topoviewer-studio/performance/current/drag.json`; the directory is
intentionally ignored because benchmark output is runner-specific and belongs
in CI artifacts rather than source control.

## Inspector Profile

The production Inspector benchmark renders the complete generated node style
metadata and measures profile switching, field search, canvas selection, and a
committed color edit. It follows the shared two-warmup/seven-sample policy.

| Interaction | Median | Maximum |
|---|---:|---:|
| Basic profile | 12.5 ms | 14.9 ms |
| Advanced profile | 15.4 ms | 19.0 ms |
| All profile | 13.0 ms | 14.2 ms |
| Field search | 3.6 ms | 5.6 ms |
| Selection change | 13.0 ms | 14.4 ms |
| Committed color edit | 10.1 ms | 16.0 ms |

The measured profiles contain 25 Basic, 42 Advanced, and 67 All fields. The
Inspector averaged 1.83 renders per measured or reset interaction. These values
are well below the 100 millisecond median, 200 millisecond hard-outlier, and six
renders-per-interaction budgets. Virtualization or another selector layer would
add state and accessibility complexity without measured benefit at this field
cardinality, so neither is introduced.

The canonical report is
`.artifacts/topoviewer-studio/performance/current/inspector.json`.

## Mapper Profile

Mapper measurements separate bounded JSON ingestion from coverage analysis.
Ingestion remains synchronous because 5,000 normalized samples parse in 7.8
milliseconds median. Coverage analysis grows with both topology and sample
cardinality and therefore moves to a dedicated worker above 250 samples.

| Coverage fixture | Median | Maximum |
|---|---:|---:|
| 50 samples | 2.1 ms | 2.7 ms |
| 500 samples | 20.9 ms | 46.7 ms |
| 5,000 samples / 1,000 nodes | 179.5 ms | 230.7 ms |

The 5,000-sample ingestion median is 7.8 milliseconds. The production worker
benchmark analyzes 5,000 samples in 117.9 milliseconds median and 164.2
milliseconds maximum against the two-node mapper fixture. The main thread
maintains a 16.8 millisecond p95 frame interval and records no long
task. The UI reports `data-analysis-mode="worker"`, and the browser test waits
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

The three forced-GC baselines ranged from 16.87 to 16.88 MiB. Maximum retained
growth ranged from 2.94 to 2.99 MiB, and every run finished at its measured
maximum below the 16 MiB budget. The report keeps every per-cycle sample so
repeated-suite review can distinguish a stable cache plateau from unbounded
growth.

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
| Browser Studio | 14,552 B | 284,464 B | 640,982 B | 1,117,905 B | n/a |
| VS Code webview | 14,786 B | 278,825 B | 640,972 B | 1,118,172 B | 51,890 B |

Both surfaces remain below the 24 KiB initial CSS, 400 KiB initial JS, 700 KiB
largest lazy chunk, and 1.2 MiB total lazy JavaScript budgets. The VS Code host
also remains below 64 KiB. Baseline updates are explicit; ordinary CI runs only
compare and enforce.

The older cross-surface raw-byte guard in
`scripts/react-performance-budgets.json` remains active for the Harness and VS
Code webview. The pre-Studio webview ceiling of 3,400,000 lazy JavaScript bytes
did not include the isolated Studio export, mapper, archive, and workspace
features. The completed Studio webview measures 937,729 initial bytes and
4,153,893 lazy bytes, with the compressed lazy total above remaining at
1,118,172 bytes. The raw lazy ceiling is therefore reset to 4,200,000 bytes;
the compressed total, largest-chunk, initial-bundle, and lazy-feature gates are
unchanged. This is a measured baseline update, not a waiver.

The Phase 18 active-drag synchronization fix moved the legacy Harness entry
from 1,567,902 raw / 471,291 gzip bytes to 1,568,394 raw / 471,550 gzip bytes.
The 492-byte raw and 259-byte compressed increase prevents stale compiled or
controlled-selection snapshots from resetting live node geometry between
consecutive drags. The Harness raw initial ceiling moves from 1,560,000 to
1,561,000 bytes; the 8,192-byte tolerance and every compressed Studio budget
remain unchanged. This is a measured correctness baseline update, not a waiver.

## Repeated Suite

`npm run studio:benchmark:repeat` completed three full serial runs on the
reference runner. Every unit, production-browser, memory, and bundle gate passed,
and the aggregate report contained 222 cross-run numeric metrics with no
failure. The highest validated median coefficient of variation was 0.311 for a
4.8 to 10.7 millisecond color edit. Dense render medians had a 0.039 coefficient
of variation, and dense commit medians had a 0.020 coefficient of variation.

The budgets in `performance-budgets.json` are approved and owned by the
TopoViewer Studio maintainers. Changes require a versioned threshold update,
measured before/after evidence, and reviewable rationale here.

## Waivers

No performance-budget waiver is approved.
