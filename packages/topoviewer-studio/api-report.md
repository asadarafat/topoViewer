# TopoViewer Studio Contract Report

Studio is private. This report freezes only contracts intentionally consumed by
the browser application and host adapters; React UI components remain internal.

## Root Entry (`topoviewer-studio`)

- host capability and result types
- project, source, diagnostic, projection, recovery, and selection types
- command, transaction, and history types
- declarative source-mutation plans and bounded-history state types
- authoring profile override and migration types
- export snapshot, options, result, and exporter types

## Host Entry (`topoviewer-studio/host`)

- `StudioHost`
- `StudioResult`
- host request, result, event, revision, asset, and export types

## Deliberately Internal

- React application and shell components
- session implementation and selectors
- command implementations
- browser persistence implementation
- palette, Inspector, mapper, YAML, and export feature modules
- test host and fixture utilities

Package exports SHALL be reviewed if any deliberately internal symbol becomes
reachable through `package.json` exports.
