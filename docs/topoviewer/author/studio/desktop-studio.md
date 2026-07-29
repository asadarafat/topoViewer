# Desktop Studio

**Support status:** Experimental

Desktop Studio packages the same authoring application as a native Wails shell.
The application behavior remains owned by `topoviewer-studio`; the Go boundary
owns operating-system dialogs, bounded directory access, coordinated
rollback-capable source writes, recovery, recent-project state, clipboard
access, exports, and file-change events.

Desktop Studio is built separately for each operating system and architecture.
There is no single executable that runs unchanged on macOS, Linux, and Windows.
Unsigned CI artifacts are internal validation candidates, not public releases.

## Run From Source

Desktop development requires Node.js 24, Go 1.25 or newer, and the native
toolchain for the host platform. Linux also requires GTK 3 and WebKitGTK 4.1.

```bash
npm ci
npm run desktop:prerequisites
npm run desktop:frontend:dev
```

The frontend development server uses a test native bridge. For a real native
artifact:

```bash
npm run desktop:check
npm run desktop:smoke
```

The executable is written under
`apps/topoviewer-studio-desktop/build/bin/`. Use `npm run desktop:package` for
the platform package path.

## Project Lifecycle

**New project** starts as an untitled recoverable draft. The first save asks for
an empty directory and persists the canonical source, recovery migration, and
recent-project identity through one coordinated, rollback-capable native
operation. Use **Open folder** for an existing bundle.

Desktop Studio confines every file operation to an approved project token.
Paths are canonicalized, symlinks and traversal are rejected, source and asset
sizes are bounded, and coordinated writes either complete or roll back.
External changes reload only when the current session is clean; dirty sessions
receive an explicit conflict instead of being overwritten.

## Platform Notes

- **macOS:** release candidates need a universal application bundle, Developer
  ID signing, notarization, stapling, and Gatekeeper verification.
- **Windows:** the application uses WebView2. Public installers need
  Authenticode signing; the package workflow builds an NSIS installer.
- **Linux:** the executable is native but dynamically uses GTK 3 and
  WebKitGTK 4.1 from the target system. Build and test against the oldest
  supported distribution ABI before public promotion.

The checked-in release workflow has protected signing hooks. It deliberately
labels unsigned outputs as internal and does not promote them to a public
release.
