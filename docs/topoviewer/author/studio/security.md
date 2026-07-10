# Security

**Support status:** Experimental

Treat topology, stylesheet, mapper, labels, Markdown, SVG, images, archives,
telemetry samples, and mounted files as untrusted input unless the host controls
their source.

Studio enforces bounded source size, archive size, file count, expansion ratio,
asset size, image dimensions, sample count, and renderer cardinality. Archive
paths are canonicalized and validated before any project is created. SVG and
image media types are inspected instead of trusting filenames.

The browser host keeps projects in local IndexedDB. The VS Code adapter keeps
file access inside a trusted workspace and uses atomic writes plus a nonce CSP.
Shared Studio features reach persistence, files, preferences, export, and
reporting only through the typed host contract.

Studio does not:

- evaluate YAML, mapper templates, labels, or Markdown as JavaScript;
- fetch arbitrary remote assets during normal authoring or export;
- provide authentication, authorization, tenancy, or business policy;
- sandbox arbitrary hostile HTML supplied by a host application;
- encrypt browser or workspace project files.

Host applications remain responsible for identity, access control, workstation
security, and deciding which project sources users may open.

Report suspected vulnerabilities privately when possible. Do not publish
working exploit details in a public issue.
