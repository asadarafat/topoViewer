# TopoViewer Studio Performance Contract

TopoViewer Studio uses the versioned thresholds in `performance-budgets.json`.
Transient reports are written under `.artifacts/topoviewer-studio/performance/`
and are not committed. A threshold change requires measured before/after
reports, a rationale in this document, and an owner.

## Reference Runner

The reference local runner is Node.js 24 on the repository's Linux OrbStack
environment on Apple silicon, using Playwright Chromium at a 1440 by 960 CSS
pixel viewport without CPU throttling. CI may run on different hardware. Normal
benchmarks perform two warmups followed by seven measured samples; dense-graph
benchmarks use one warmup and three measured samples to keep the gate bounded.
Reports retain the raw samples, medians, ranges, and coefficients of variation.
Frame-sensitive interactions compute p95 within each measured gesture and then
use the median gesture p95, so one long run cannot be hidden by pooling frames
from otherwise quiet runs.

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

Drag commit completion is deliberately queued to the next animation frame after
pointer release so the UI can paint the final React Flow position before YAML
persistence begins. That measurement is phase-sensitive relative to the browser
frame clock, so it uses a 40 millisecond maximum range rather than a coefficient
of variation. The median and 250 millisecond hard cap still apply.

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

The stabilized boundary run measured 120.3 milliseconds median and 124.3
milliseconds maximum canvas-ready time. The initial request graph contained 16
resources and none of the prohibited Monaco, mapper, export, archive, or
image-export chunks.

The profile found that `main.tsx` eagerly constructed development-only memory,
fixture, persistence-failure, and external-change hosts. Those capabilities now
live behind a dynamic development/performance boundary. Edit, Inspector,
Mapper, Monaco, archive handling, and image export remain lazy feature
boundaries.

Studio has no broad React context provider. Session state is owned by the
workspace controller, while high-frequency drag preview stays in the core
renderer and canvas path. Inspector search, mapper samples, drawer state, and
editor models remain feature-local. Later sections record measured render and
interaction counts before considering additional memoization or virtualization.

A palette drop became visible in 30.1 milliseconds median and 70.9 milliseconds
maximum in the stabilized run.

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
helper lines clear after release. Viewport culling begins at 100 nodes or 250
links. During the measured gestures, the 100-node fixture rendered 9 nodes and
37 links and the 1,000-node fixture rendered 49 nodes and 176 links around the
drag target while retaining the complete source graph.

| Source graph | Median render | Drag p95 frame | Worst frame | Median commit | Long tasks across samples |
|---|---:|---:|---:|---:|---:|
| 2 nodes / 1 link | 157.2 ms | 16.8 ms | 33.4 ms | 7.4 ms | 0 |
| 100 nodes / 250 links | 707.7 ms | 16.8 ms | 50.0 ms | 12.1 ms | 1 total |
| 1,000 nodes / 2,500 links | 3,029.6 ms | 16.8 ms | 33.4 ms | 37.7 ms | 0 |

The stabilized 1,000-node gesture recorded no task above 50 milliseconds; the
100-node series recorded one 51 millisecond pointer-move task across seven
measured gestures. The implementation keeps active pointer movement in
React Flow's runtime store, freezes expensive label geometry during drag,
indexes helper-line candidates, uses bounded label collision lookups, and
commits YAML only after release. Manual position-only updates patch compiled
positions without rebuilding unchanged graph semantics. A compile-generation
token prevents a position fast path from racing ahead of a pending structural
graph reconciliation. Region-membership preview is not attached when a
document has no regions, avoiding a semantic lookup on every pointer move.

The helper-line overlay updates its DOM geometry through one animation-frame
write instead of rerendering the graph for every pointer event. During drag,
the canvas can reuse a stable projection and defer position-only document
projection; the authoritative YAML commit is scheduled after release. This
keeps pointer rendering independent from source serialization while preserving
one deterministic persistence point.

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

## Visual And YAML Style Profile

The production benchmark selects objects on the 1,000-node/2,500-link fixture,
renders the metadata-generated Basic fields, searches and opens groups, and
commits exact-ID candidate colors. It separates the immediate control response
from completion of full candidate validation and canvas projection.

| Interaction | Median | Maximum |
|---|---:|---:|
| Advanced group toggle response | 17.1 ms | 20.2 ms |
| Advanced fields visible | 216.3 ms | 239.2 ms |
| Field search | 11.6 ms | 14.7 ms |
| Selection change | 79.1 ms | 86.1 ms |
| Visual color commit response | 14.1 ms | 21.1 ms |
| Full candidate settlement | 860.7 ms | 982.1 ms |

The measured node target exposes 26 visual fields and renders only the 8 fields
needed by the open groups. The visual form averages 1.58 renders per measured
or reset interaction. A structured edit publishes candidate text immediately
and starts the expensive
validation after a 32 millisecond first-paint delay. Prepared controller
evaluation reuses parsed topology and mapper sources and measures 40.4
milliseconds median on the dense fixture.

The 1.5-second median and 2.5-second hard candidate-settlement limits describe
full validation and renderer projection, not acceptable input latency. Full
dense settlement remains approximately 0.85 seconds and is the primary residual
risk if the supported graph ceiling grows. Future work should make dense
projection incremental or off-main-thread before raising those limits.

The synthetic expansion sample mounts and unmounts every advanced Material
control nine times. It forces collection before each timed expansion so garbage
created by the preceding synthetic collapse is not charged to the next
independent click. The controls must still render on every cycle, and the
lifecycle memory profile remains responsible for retained-state failures.
The disclosure state has the normal 125 millisecond interaction budget;
advanced controls render as deferred work under a separate 300 millisecond
median and 400 millisecond hard completion contract.

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
lookups for the duration of one coverage evaluation.

The stabilized production worker benchmark completes in 120.9 milliseconds
median and 121.9 milliseconds maximum. The median per-run p95 frame interval is
33.3 milliseconds and no long task was observed. The 34
millisecond frame budget permits one two-frame React boundary at 60 Hz while
still rejecting sustained main-thread stalls. The browser report retains raw
frame intervals and long-task entries for audit.

The large controlled sample input is owned by the Mapper feature and mirrored
in a non-rendering ref for proposal generation; it is no longer root Studio
state. Worker status and bounded coverage results therefore do not rerender 1.5
MiB of unchanged JSON. Before that isolation, the same workflow completed in
172.5 milliseconds median, produced a pooled 83.4 millisecond p95 interval, and
reached a 100 millisecond worst frame. The UI reports
`data-analysis-mode="worker"`, and the browser test waits for the auditable
“Analyzed off the main thread” state rather than inferring worker use from
timing.

Each timed Mapper iteration forces browser garbage collection after loading its
sample document and before starting responsiveness observers. This prevents a
previous dense fixture or discarded page from determining one interaction
sample. It does not waive retention: the separate ten-cycle memory profile
warms every lazy feature, forces collection, and fails retained heap growth
independently.

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

The stabilized run began at 26,655,844 bytes and retained 3,417,572 bytes after
ten cycles; maximum observed growth was 3,836,992 bytes, below the 16 MiB
budget. The report keeps every
per-cycle sample so repeated-suite review can distinguish a stable cache plateau
from unbounded growth.

The canonical report is
`.artifacts/topoviewer-studio/performance/current/memory.json`.

## Bundle Profile

`performance-bundle-baseline.json` is the checked-in comparison point for the
browser Studio and VS Code webview. The version 2 checker counts both entry
scripts and every `modulepreload` referenced by built HTML; version 1 counted
only entry scripts and therefore understated Vite's initial request graph. The
shared checker enforces the versioned limits below and fails if Monaco, Edit,
Inspector, Mapper, or export stops being a lazy JavaScript feature boundary.

| Surface | Initial CSS gzip | Initial JS gzip | Largest lazy JS gzip | Total lazy JS gzip | Extension host |
|---|---:|---:|---:|---:|---:|
| Browser Studio | 8,344 B | 443,754 B | 640,982 B | 1,170,239 B | n/a |
| VS Code webview | 8,536 B | 436,589 B | 640,972 B | 1,169,833 B | 51,980 B |

The feature split moves Edit and Inspector out of first paint without deferring
the canvas, renderer, or Object Palette needed for useful startup.

| Surface | Before split | After split | Change |
|---|---:|---:|---:|
| Browser Studio initial JS gzip | 470,473 B | 443,754 B | -26,719 B (-5.7%) |
| VS Code webview initial JS gzip | 464,049 B | 436,589 B | -27,460 B (-5.9%) |

The version 2 limits allow roughly 3 to 4 percent headroom: 448 KiB initial JS
for Browser Studio, 440 KiB for VS Code, 648 KiB for the largest lazy chunk,
and 1,184 KiB total lazy JavaScript. Initial CSS is capped at 9 KiB and the VS
Code extension host at 54 KiB. Baseline updates are explicit; ordinary CI runs
only compare and enforce.

The optional-workspace split increases total lazy JavaScript by about 33 KiB on
each surface because that code is now loaded on demand. This is intentional:
the initial graph is smaller, while opening Edit or Viewport pays the feature
cost once. The canvas interaction and startup budgets guard against trading
payload accounting for degraded behavior.

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
