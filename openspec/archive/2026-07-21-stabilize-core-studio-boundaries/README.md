# stabilize-core-studio-boundaries

Stabilize the published core package before decomposing Studio against explicit, tested package and feature boundaries.

## Measured Results

The settled `mapper-coverage` browser fixture records `CanvasSurface` renders for
the same task sequence before and after the stable model/action boundary. The
baseline was captured with component memoization disabled; the optimized result
is enforced by `studio-canvas-render-boundary.spec.ts`.

| Interaction | Before | After | Result |
|---|---:|---:|---|
| Open Mapper workspace | 1 | 0 | Unrelated workspace state no longer redraws the canvas. |
| Select one node | 1 | 1 | The canvas receives the required selection update once. |
| Complete a node drag inside a region | 3 | 3 | Region preview enter/clear and topology commit remain intentional. |
| Commit one visual style draft | 3 | 1 | Candidate validation now reaches the canvas only when the valid projection changes. |
| Toggle alignment assistance | 2 | 1 | One viewport model update replaces broad workspace invalidation. |

The final full-CI package build contains 54 packed files in a 1.1 MB tarball
(4.1 MB unpacked). The ESM renderer is 449.17 KB raw / 116.60 KB gzip, while
the optional export implementation remains in a separate 569.74 KB raw /
151.02 KB gzip chunk.

The same run measured Browser Studio initial JavaScript at 444,220 bytes gzip,
down 26,253 bytes (5.6%) from the 470,473-byte pre-split baseline. The VS Code
webview measured 436,989 bytes gzip, down 27,060 bytes (5.8%) from 464,049
bytes. Both remain below their ratcheted budgets; Monaco remains lazy at roughly
641 KB gzip rather than entering the initial request graph.
