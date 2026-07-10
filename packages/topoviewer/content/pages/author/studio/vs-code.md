# VS Code

**Support status:** Roadmap

The repository contains a working VS Code host adapter for Studio, but no VSIX
is published. Treat it as a maintainer preview, not an installable user surface.

The adapter owns workspace concerns only:

- read topology, stylesheet, mapper, and local asset files;
- enforce workspace trust and root containment;
- save files atomically;
- watch external changes and surface conflicts;
- provide a nonce-based webview content security policy;
- route export through VS Code dialogs.

The webview mounts the same `topoviewer-studio` application used by the browser.
Studio feature code does not import `vscode`, Node filesystem APIs, or adapter
internals.

Maintainers can validate the host without publishing an extension:

```bash
npm --workspace vscode-topoviewer run test:studio-host
npm --workspace vscode-topoviewer run test:unit
```

The golden host test creates nodes and a link, edits Basic and Advanced style,
authors a mapper rule, recovers invalid YAML, saves through the workspace
protocol, and validates an exported archive through the core runtime.

An external file change reloads automatically only when Studio is clean. A
dirty project receives an explicit choice to inspect the diff, keep Studio
source, or reload disk content.
