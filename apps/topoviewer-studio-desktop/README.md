# TopoViewer Desktop Studio

This directory owns the Wails/Go shell for TopoViewer Studio. It does not own a
second authoring application. The frontend mounts `topoviewer-studio/app`, and
the native boundary provides only operating-system capabilities that the shared
application cannot own.

## Ownership

- `packages/topoviewer-studio` owns sessions, commands, UI, YAML assistance,
  mapper authoring, portable directory behavior, and exports.
- `frontend/src` adapts generated Wails bindings to the typed Studio host.
- `internal/native` owns approved-root tokens, path confinement, native
  dialogs, coordinated rollback-capable writes, recovery, preferences, recent projects,
  clipboard, and file-change events.
- `build` owns Wails metadata and platform packaging inputs.

The frontend must not receive arbitrary filesystem authority or import package
source trees. Native methods accept bounded DTOs and opaque project tokens.

## Development

From the repository root:

```bash
npm ci
npm run desktop:prerequisites
npm run desktop:frontend:dev
```

The development frontend uses a test bridge when no Wails runtime exists. Run
the native verification path before treating a change as complete:

```bash
npm run desktop:check
npm run desktop:test:golden
npm run desktop:smoke
```

`desktop:check` verifies generated bindings, frontend and Go tests, a native
build, and artifact contents. `desktop:smoke` launches the Linux executable
under a virtual display and verifies clean startup.

## Distribution

Desktop artifacts are native and platform-specific:

- macOS: arm64 and amd64 application bundles are combined into a universal
  signed and notarized candidate;
- Windows: amd64 executable and NSIS installer with WebView2;
- Linux: amd64 executable dynamically using GTK 3 and WebKitGTK 4.1.

The manual `desktop-release.yml` workflow keeps unsigned outputs internal.
Public distribution requires protected signing evidence on Windows and macOS,
checksums, and successful target-runner validation. There is no single binary
that runs unchanged across all three operating systems.
