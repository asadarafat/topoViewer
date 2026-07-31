Tree layout arranges a directed hierarchy into deterministic levels without
requiring authored positions.

This example uses a service dependency tree with one disconnected component:

- link direction defines parent-to-child traversal
- sibling order is stable by object ID, independent of YAML array order
- `layout.tree.direction` controls the orientation
- bounded gaps keep disconnected components readable

Use `tree` for hierarchies and dependency views. Use `clos` for dense staged
fabrics, `force` for general graphs, and `manual` when placement is part of the
reviewed artifact.
