## Design

### Public layout contract

Add `clos` as a first-class layout mode:

```yaml
layout:
  mode: clos
  width: 1200
  height: 720
  clos:
    direction: topToBottom
    stageCount: auto
    maxStages: 10
    stageOrder: []
    preservePinned: true
    pinnedNodeIds: []
    stageGap: 160
    nodeGap: 88
    groupGap: 160
```

The exact option names can be refined during implementation, but the public
contract should stay generic:

- `direction`: `topToBottom`, `bottomToTop`, `leftToRight`, or `rightToLeft`.
- `stageCount`: positive integer or `auto`.
- `maxStages`: upper bound for auto inference, defaulting to `10`.
- `stageKey`: `auto`, or a generic graph field path such as
  `labels.stage`, `data.stage`, `labels.tier`, or `data.tier`.
- `stageOrder`: optional ordered string values for explicit stage fields.
- `inferLabelRole`: optional opt-in role-to-stage override map. It can live at
  `layout.inferLabelRole` or `layout.clos.inferLabelRole`; the top-level form
  is preferred for concise YAML. It is never enabled implicitly.
- `groupKey`: `auto`, or a generic graph field path such as `labels.group`,
  `data.group`, `labels.zone`, or `data.zone`.
- `preservePinned` and `pinnedNodeIds`: preserve operator-authored positions.
- spacing options: stage, group, and node spacing in layout units.

Do not encode deployment-specific names into the contract. `leaf`, `spine`, and
`super-spine` may appear in examples as authored labels for styling, but the
engine should not treat those labels as stage semantics unless the author
explicitly configures `stageKey` or `inferLabelRole`. Internally use
`stageIndex`, `stageId`, and `stageConfidence`.

The default automatic path may inspect generic stage-like fields such as
`labels.stage`, `data.stage`, `labels.tier`, and `labels.level`. It must not
interpret broad domain classifiers such as `labels.node`, `labels.role`, or
`type` as stage semantics unless the author opts into that behavior with
`stageKey` or `inferLabelRole`.

Explicit stage fields remain copyable and concise:

```yaml
layout:
  mode: clos
  clos:
    stageKey: labels.stage
    stageOrder: [core, aggregation, access]
    groupKey: labels.site
```

Optional role-to-stage mapping is explicit YAML, not a default:

```yaml
layout:
  mode: clos
  inferLabelRole:
    - stage-1: p
    - stage-2: pe
    - stage-3: agg
    - stage-4: access
```

### Inference model

The default path is automatic inference. The layout engine receives visible
nodes and visible links and produces a stable `Map<nodeId, { x, y }>` just like
the existing layout function.

Inference should combine graph-theoretic signals:

1. Use directed `source` -> `target` hierarchy when links form an acyclic graph.
   This is the strongest automatic root signal because it captures authored
   graph structure without requiring role names. A lower-stage node with large
   fanout must not become root when the directed hierarchy clearly places it
   below a source-side boundary node.
2. Build an undirected adjacency graph for visible nodes and links.
3. Count how many valid link endpoints touch each node. When direction is not
   usable, lower endpoint count is a fuzzy root-side boundary signal. Higher
   endpoint count may identify dense intermediate/core fabric nodes, but it is
   not an automatic root signal.
4. Detect connected components and lay each component independently before
   packing components into the requested canvas.
5. Identify likely boundary nodes:
   - lower betweenness than core nodes;
   - fewer cross-stage-like connections;
   - high connection similarity to peer boundary nodes;
   - optional hints from explicit stage keys.
6. Derive candidate stages with breadth-first layering from boundary sets and
   refine with degree, neighbor-stage consistency, and crossing cost.
7. If the graph is symmetric and has clear upper/lower boundary sets, choose an
   orientation that puts the densest core stage near the middle or top according
   to `direction`.
8. Clamp inferred stage count to `maxStages`.
9. Assign each node:
   - `stageIndex`;
   - `stageConfidence`;
   - `groupId`, inferred from shared neighborhoods or explicit `groupKey`;
   - `orderWithinStage`.

The algorithm should remain deterministic. Use stable sorting by explicit
stage, group, label/name/id, and adjacency signatures. Do not depend on random
layout seeds.

### Explicit hints

Automatic inference should be useful, but authored hints must be honored:

- If `stageKey` resolves to a value on a node, that value is authoritative for
  that node unless invalid.
- If string stage values are used, `stageOrder` defines their order; otherwise
  values are ordered deterministically.
- If `inferLabelRole` maps a node classifier value to a stage, that stage is
  authoritative for that node. Classifier values include labels, data, type,
  label, and icon. This mapping is strictly opt-in; role-like labels are not
  treated as stage rules unless authors declare this map or set an explicit
  `stageKey`.
- If `groupKey` resolves to a value on a node, that value is authoritative for
  grouping and ordering.
- If `pinnedNodeIds` contains a node ID, that node keeps its authored position.
- Nodes without hints are inferred around the hinted nodes.

This lets authors declare only the minimum metadata needed for ambiguous
graphs. A clean CLOS graph should not require any metadata.

The contract intentionally does not include a `rootNodeIds` option or another
YAML root marker. If authors need deterministic stage control, they should use
generic stage metadata through `stageKey`/`stageOrder` or opt in to
`inferLabelRole`.

### Stage naming

The runtime should not require semantic role names. For explainability, helper
metadata may expose generic stage labels:

- `stage-0`, `stage-1`, ... for all layouts;
- optional descriptive aliases such as `leaf-like`, `spine-like`, and
  `super-spine-like` only when the graph pattern strongly matches those common
  three-stage or five-stage CLOS shapes.

These aliases are diagnostic/debug metadata, not schema requirements and not
styling selectors.

### Positioning

For `topToBottom`:

- Y is determined by `stageIndex`.
- X is determined by group and within-stage order.

For horizontal directions, swap axes.

Within each stage:

1. Group nodes by explicit or inferred group.
2. Sort groups by barycenter of connected nodes in adjacent stages.
3. Sort nodes inside each group by barycenter, then stable label/id.
4. Repeat the barycentric sweep from outer stages toward core and back for a
   small fixed number of passes.
5. Pack groups using `groupGap`; pack nodes using `nodeGap`.
6. Center each stage around `width / 2` or `height / 2`.

The algorithm should reduce crossings but should not attempt expensive optimal
crossing minimization.

### Multi-stage support

The implementation must not special-case only three stages. It should support:

- two-stage bipartite fabrics;
- three-stage CLOS;
- five-stage CLOS;
- arbitrary staged CLOS-like graphs up to at least ten stages.

When `stageCount: auto`, choose the smallest stage count that explains most
links as same-stage or adjacent-stage edges while minimizing stage assignment
conflicts. Links that skip stages are allowed and should not break layout.

### Ambiguity and fallback

Not every graph is a CLOS graph. If confidence is low, the layout should still
produce readable output:

- use connected-component layering;
- report lint or diagnostic warnings when the graph is too ambiguous;
- keep positions deterministic;
- never throw solely because inference is imperfect.

Potential diagnostic examples:

- too few nodes for CLOS inference;
- too many disconnected components for one layout;
- inferred stage count hit `maxStages`;
- explicit stage hints conflict with graph connectivity.

### Runtime boundary

The layout engine remains renderer-agnostic:

- no React imports;
- no DOM access;
- no external layout library required for the initial implementation;
- no UI state;
- no mutation of input graph objects.

The output is only node positions.

### Performance

The implementation should target dense authored topologies:

- deterministic inference and ordering should be approximately linear or
  near-linear in nodes and links for common cases;
- avoid all-pairs shortest paths for large graphs;
- cap crossing-reduction passes;
- expose benchmark timings for 1k-node and larger synthetic CLOS graphs;
- document the default recommended node limits for interactive rendering.

### Documentation and examples

Docs should explain that CLOS layout is graph-structural:

- it is not an environment-specific layout;
- it does not require network roles;
- it is useful for any staged CLOS-like relationship graph;
- authors can add hints only when inference is ambiguous.

The docs should be practical and operator-facing. They should answer:

- "What do I write in YAML first?"
- "Why did this node become the root?"
- "Why did my `role` or `node` label not change the layout?"
- "When should I use explicit `stageKey`/`stageOrder`?"
- "When should I use `inferLabelRole`?"
- "When is CLOS the wrong layout mode?"

Avoid documenting the algorithm as abstract graph theory only. Show small YAML
snippets and the expected behavior:

- automatic layout: directed `source` -> `target` links drive root-to-leaf
  placement;
- label styling: `labels.node: spine` can select an icon/style without
  becoming a stage rule;
- explicit stage fields: `layout.clos.stageKey: labels.stage` and
  `stageOrder` are the recommended deterministic override;
- role mapping: `inferLabelRole` is an opt-in compatibility mapping for
  existing role vocabularies;
- ambiguous graphs: use `manual` or `force` if the topology is not staged.

Examples should include:

- a tiny two-stage graph;
- a three-stage graph that proves common names like leaf/spine/super-spine are
  styling labels unless explicit stage hints are configured;
- a five-stage or ten-stage synthetic example proving the directive is generic;
- a harness fixture where manual coordinates are removed and layout is produced
  by `mode: clos`, directed links, and no `stageKey`/`stageOrder`.

### Testing strategy

Tests should cover:

- schema acceptance and rejection for `layout.mode: clos` and its options;
- deterministic output snapshots for small graphs;
- no-metadata inference for two, three, five, and ten stages;
- directed hierarchy winning over high-fanout lower stages;
- ordinary `labels.role` and `labels.node` not becoming stage rules by default;
- low endpoint-count fuzzy fallback when directed hierarchy is not usable;
- hint precedence for explicit stage/group keys;
- opt-in `inferLabelRole` override behavior;
- pinned-node preservation;
- crossing-reduction ordering stability;
- fallback behavior for ambiguous non-CLOS graphs;
- docs examples rendering in MkDocs and the harness.
