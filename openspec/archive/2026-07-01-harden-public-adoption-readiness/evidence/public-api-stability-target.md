# Public API Stability Target

The minimal supported API target is documented in
`packages/topoviewer/content/pages/reference/typescript-api.md`.

Supported adoption surface:

| Need | API |
|---|---|
| Render a composed document | `<TopoViewer document={document} />` |
| Compile a document for inspection or extension hooks | `compileTopoGraph(document)` |
| Validate schema-level document shape | `validateTopoDocument(document)` |
| Validate semantic graph references and renderer limits | `lintTopoDocument(document)` |

Type hardening completed in this pass:

| Weak surface | Replacement |
|---|---|
| `CompiledGraph.nodes: Array<Record<string, unknown>>` | `CompiledGraph.nodes: CompiledNode[]` |
| `CompiledGraph.edges: Array<Record<string, unknown>>` | `CompiledGraph.edges: CompiledEdge[]` |
| Anonymous compiled node data | Exported `CompiledNodeData` |
| Anonymous compiled edge data | Exported `CompiledEdgeData` |
| `TopoViewerExtension.nodeTypes?: Record<string, ComponentType<any>>` | `TopoViewerExtension.nodeTypes?: NodeTypes` |
| `TopoViewerExtension.edgeTypes?: Record<string, ComponentType<any>>` | `TopoViewerExtension.edgeTypes?: EdgeTypes` |
| `toolbarActions?: unknown[]` | `toolbarActions?: TopoViewerToolbarAction[]` |

Remaining pre-1.0 work:

- Review whether `StyleDeclaration = Record<string, unknown>` should become a
  generated or discriminated style type.
- Add compatibility tests for extension hooks once real external extension
  examples exist.
- Treat advanced compiler/layout exports as public but lower-level than the
  minimal adoption API.

