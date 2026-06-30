# Security Policy

TopoViewer renders user-authored YAML, selector stylesheets, labels, Markdown,
SVG icons, image references, Grafana mapper rules, and telemetry labels. Treat
all diagram inputs as untrusted unless the host application explicitly controls
the source.

## Supported Versions

During early access, only the current `0.1.x` development line receives
security fixes. Older commits, archived OpenSpec changes, local lab artifacts,
and generated demo bundles are not supported security-maintenance branches.

## Reporting A Vulnerability

Report suspected vulnerabilities privately to the maintainer before public
disclosure. If GitHub private vulnerability reporting is available for the
repository, use it. Otherwise open a minimal public issue that asks for a
private security contact without including exploit details.

Include:

- a minimal topology, stylesheet, mapper, or Markdown reproducer;
- the host surface: React app, MkDocs, Zensical, browser harness, VS Code,
  Grafana panel, or lab;
- browser, Node.js, package, and Grafana versions where relevant;
- whether the content source is trusted, user-authored, mounted, remote, or
  telemetry-derived;
- expected impact, such as script execution, filesystem escape, data leakage,
  denial of service, credential exposure, or unsafe lab guidance.

## In Scope

- Cross-site scripting or HTML/script execution through YAML, labels, callouts,
  Markdown, SVG, images, mapper templates, or telemetry labels.
- Unsafe SVG handling across React, MkDocs, Zensical, harness, and Grafana
  surfaces.
- YAML parser denial-of-service cases that freeze supported surfaces.
- Grafana mounted-bundle backend path traversal, symlink escape, oversized file,
  role/access-control, or diagnostic leakage issues.
- Package artifacts that accidentally include secrets, local paths, private
  files, generated junk, or lab-only production guidance.
- Dependency vulnerabilities that affect shipped runtime code or packaged
  artifacts.

## Out Of Scope

- Disposable local lab credentials when the docs and scripts clearly mark them
  as lab-only.
- Attacks that require maintainers to run arbitrary untrusted shell commands
  outside documented workflows.
- Vulnerabilities in third-party services or infrastructure not controlled by
  this repository.
- Host-application authorization, tenant isolation, and business-policy checks
  that an embedding product must implement around TopoViewer.

## Security Boundaries

Expected protections:

- Markdown and labels render as inert content unless a host explicitly opts into
  trusted HTML.
- Inline SVG icons are sanitized before use.
- SVG data URLs and unsafe image references are blocked where supported.
- Renderer limits protect against oversized documents and large embedded
  assets.
- Grafana mounted bundles are constrained to configured roots and should not be
  able to read arbitrary container files.

Not guaranteed:

- TopoViewer is not a sandbox for arbitrary hostile HTML or JavaScript.
- TopoViewer does not authenticate or authorize diagram content.
- TopoViewer does not validate business policy unless a host application adds
  that policy.
- Local Grafana/Containerlab labs are not production configurations.

## Dependency Handling

Use `npm audit`, Go vulnerability checks, CodeQL/static analysis, secret scans,
and container-image scans as advisory signals that require triage. Do not run
forced dependency upgrades into release branches without validating build,
visual, interaction, docs, and package-artifact behavior.
