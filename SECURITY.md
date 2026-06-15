# Security Policy

TopoViewer renders authored YAML, Markdown, SVG icons, and optional image references. Treat diagrams as untrusted content unless the hosting environment says otherwise.

## Supported Versions

During early access, only the current `0.1.x` development line receives fixes.

## Reporting

Report suspected vulnerabilities privately to the maintainer before public disclosure.

Include:

- A minimal topology/stylesheet reproducer.
- The host surface: React app, MkDocs plugin, or standalone embed.
- Browser and package versions.
- Whether the content source is trusted, user-authored, or remote.

## Security Boundaries

Expected protections:

- Markdown is rendered without raw HTML execution.
- Inline SVG icons are sanitized before use.
- SVG data URLs are blocked for Markdown image references.
- Remote references should be restricted by the embedding application when diagrams are user-supplied.
- Renderer limits protect against oversized diagrams and large embedded images.

Not guaranteed:

- TopoViewer is not a sandbox for arbitrary hostile HTML or JavaScript.
- TopoViewer does not authenticate or authorize diagram content.
- TopoViewer does not validate business policy unless a host application adds that policy.

## Dependency Handling

Use `npm audit` and Python package audit tooling as advisory signals, not automatic rewrite tools. Do not run forced dependency upgrades into release branches without validating build, visual, and interaction behavior.
