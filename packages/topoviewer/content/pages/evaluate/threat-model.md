# Threat Model

TopoViewer accepts rich user-controlled content: YAML, labels, Markdown-like
callouts, inline SVG icons, image references, style values, mapper rules,
telemetry labels, docs embed options, Studio project archives, browser project
storage, Desktop Studio directory files and Grafana mounted bundle files. Treat these
inputs as untrusted unless the embedding product controls both the source and
the complete delivery path.

TopoViewer Studio runs the same application behind two different hosts. The
browser host owns IndexedDB, user-selected files and optional File System Access
API directories. The Wails desktop host owns native dialogs, approved project
tokens, canonical root confinement, file writes, recovery, preferences, and
file-change events. Shared Studio code must use the typed `StudioHost` boundary
and must not infer that a check performed by one host also exists in the other.

## Assets To Protect

| Asset | Why it matters |
|---|---|
| Host page DOM | A malicious diagram must not execute script in React, MkDocs, Zensical, Studio, or Grafana. |
| User credentials and browser state | Diagrams must not steal cookies, tokens, local storage, Grafana session state, or dashboard data. |
| Host filesystem | Grafana mounted bundle loading must not escape configured roots or reveal private paths. |
| Availability | Oversized or abusive YAML must not freeze the browser, docs page, CI, or Grafana panel. |
| Source YAML integrity | Runtime telemetry overlays must not mutate topology, stylesheet, or mapper source files. |
| Studio project integrity | Invalid drafts, corrupt persistence, failed imports, conflicts, or partial writes must not replace the last valid project state. |
| Workspace boundary | Studio must not read or write outside the user-selected browser directory or Desktop Studio approved root. |
| Public artifacts | npm packages, plugin zips, docs builds, and promo media must not contain secrets, local paths, or disposable lab credentials. |

## Input Threats And Controls

| Input | Main threats | Controls | Evidence |
|---|---|---|---|
| Topology and stylesheet YAML | YAML bombs, deep nesting, duplicate IDs, invalid references, renderer overload | Schema validation, semantic lint, renderer limits, hostile YAML tests | `npm run ci:schemas`, `npm run test:hostile-content` |
| Labels, data, standalone text, and callouts | HTML/script injection, broken attributes, CSS injection, layout abuse | React escaping, sanitizer paths, hostile content tests | Hostile text/label/callout tests |
| Inline SVG icons | Script tags, event handlers, `foreignObject`, `javascript:` URLs, CSS injection, encoded bypasses | SVG sanitizer, unsafe reference blocking, corpus tests | SVG hostile corpus tests |
| Image references | Data exfiltration, unsafe protocols, huge embedded images | Allowed protocol checks, embedded byte limits, diagnostics | Renderer limit tests |
| Mapper rules and templates | Executable labels, unexpected style mutation, ambiguous object matching | Mapper schema, target-kind validation, coverage diagnostics, runtime-only overlays, template style-value guards | Mapper docs and Grafana coverage tests |
| Prometheus labels and values | Label injection, CSS injection, stale IDs, high-cardinality denial of service | Mapper value extraction, telemetry-controlled style-value guards, coverage classification, bounded overlay application | Grafana mapper tests |
| Docs embed options | Asset path confusion, broken page hydration, CSS leakage | Static asset loading, docs smoke, render parity checks | Docs and render parity lanes |
| Studio YAML documents | Alias expansion, excessive depth or bytes, duplicate keys, parser crashes, invalid-draft source corruption | Bounded text and structure, strict unique-key parsing, alias limits, last-valid projection, parser fuzz tests | Studio session security tests |
| Studio archives | Traversal, duplicate canonical paths, malformed manifests, decompression bombs, unsupported MIME types, oversized files or aggregate payloads | Canonical path and manifest validation, compressed/uncompressed quotas, ratio and file-count limits, integrity checks, asset validation | Studio archive adversarial tests |
| Studio assets | Executable SVG, MIME spoofing, hostile data URLs, oversized image dimensions, implicit network fetch | MIME allowlist and signature checks, SVG sanitization, byte/dimension limits, local asset resolution, no-network export checks | Studio asset security tests |
| Mapper sample files | Malformed JSON, hostile labels/values, excessive cardinality, oversized frames or expression-like strings | Byte, sample, label, field and string limits; inert values; no evaluation; bounded diagnostics | Mapper ingestion and fuzz tests |
| Browser project storage | Corrupt or stale IndexedDB records, quota exhaustion, accidental persistence of sensitive topology | Versioned records, schema checks, bounded project/assets, recovery snapshots, explicit reset/export, no telemetry persistence | Browser host and persistence tests |
| Browser-selected directories | Traversal-like names, excessive recursion, unsupported files, partial writes | Canonical relative paths, file/byte quotas, browser permission prompts, explicit directory selection | Browser host contract tests |
| Desktop Studio directory files | Traversal, symlink escape, excessive files, write races, partial first save, path disclosure | Opaque approved-root tokens, canonical path confinement, symlink rejection, file/aggregate quotas, revision conflicts, coordinated rollback-capable writes, redacted errors | Go native-service and directory-host tests |
| Desktop native bindings | Forged methods, malformed values, oversized binary payloads, frontend access to arbitrary paths | Generated typed bindings, runtime DTO validation, opaque tokens, method-specific limits, no general filesystem API | Binding drift, frontend adapter, and native service tests |
| Studio exports | Remote asset fetch, oversized image work, unsafe filenames, partial or misleading artifacts | Read-only snapshots, canonical names, pixel/output quotas, no remote references, explicit user action | Studio export security tests |
| Grafana mounted files | Path traversal, symlink escape, oversized files, duplicate bundles, non-UTF-8 content | Backend allowlist, realpath checks, size limits, diagnostics redaction | Grafana backend security tests |
| Lab configuration | Disposable credentials copied into production | Lab warnings, localhost binding, production-shaped examples | Lab safety checks |

## Trust Boundaries

| Boundary | Crossing data | Required behavior |
|---|---|---|
| Authoring file to parser | YAML text | Parse without executing content. Report line/column errors where available. |
| Parser to compiler | Parsed objects | Validate shape and references before rendering. |
| Stylesheet to renderer | Style values | Accept only documented keys and values; reject or warn on unsupported controls. |
| SVG string to DOM | Sanitized SVG or fallback glyph | Strip executable and unsafe content before it reaches the DOM. |
| Grafana backend to frontend | Mounted topology/style/mapper YAML and diagnostics | Read only from allowed roots and redact host paths from diagnostics. |
| Prometheus data frame to mapper | Metric labels and values | Treat labels as untrusted strings and values as bounded runtime state. |
| Runtime overlay to source YAML | Overlay state | Never write telemetry-derived changes back into source YAML. |
| Browser picker to Studio host | User-selected files or directory handles | Require an explicit user gesture, canonicalize relative paths, enforce quotas, and do not fetch referenced network content. |
| IndexedDB to Studio session | Persisted project, assets, preferences and recovery data | Validate and migrate records before use; preserve the last valid projection when recovery data is corrupt. |
| Desktop directory to Wails host | Source files, assets, and change events | Resolve only through an approved opaque project token, constrain every path to its canonical root, reject symlinks, and use revision-aware coordinated writes with rollback. |
| Wails frontend to Go services | Generated binding requests and responses | Validate each DTO and limit natively, return typed redacted errors, and expose no arbitrary-path filesystem method. |
| Archive bytes to Studio project | Manifest, YAML documents and assets | Bound work before decompression where possible, validate every declared entry, reject undeclared/duplicate content, and publish no partial project. |
| Asset bytes to renderer/exporter | Local SVG or raster image | Verify allowed type and limits, sanitize SVG, reject executable or remote references, and resolve only explicitly imported content. |
| Export snapshot to downloaded/workspace artifact | Bundle, image, snippet or Grafana package | Treat export as a read-only projection, cap resources, use safe names and require explicit user action. |

## Abuse Cases

| Abuse case | Required result |
|---|---|
| SVG icon includes `<script>` or event handler | Payload is removed or the icon is rejected; no script runs. |
| Label contains HTML or JavaScript URL | Rendered as inert text or rejected; no script runs. |
| Mapper label template receives hostile Prometheus label | Rendered overlay remains inert text; telemetry-controlled CSS/color-style values are rejected when unsafe. |
| YAML uses aliases, duplicate keys, control characters, or huge nested structures | Parser, semantic lint, or renderer limits fail before rendering becomes unresponsive. |
| Mounted bundle path attempts `../` traversal or symlink escape | Backend rejects it and returns redacted diagnostics. |
| Bundle contains duplicate canonical files | Backend rejects the bundle unless a future explicit manifest resolves it. |
| Parallel links match one endpoint-only mapper rule | Mapper reports ambiguity instead of guessing. |
| Docs theme CSS changes SVG or label geometry | Render parity check fails unless the difference is documented as theme color only. |
| Archive expands far beyond its compressed size | Import is rejected before an unbounded allocation or project mutation. |
| Archive manifest lies about paths, MIME type, size, hash, documents or project metadata | Import is rejected as one atomic operation; no project or assets are persisted. |
| Browser directory contains an unsupported asset or excessive content | Folder open fails with a bounded diagnostic and leaves existing projects unchanged. |
| Desktop request resolves outside the approved root or through a symlink | The native host denies the operation and Studio receives a typed, non-sensitive error. |
| First save is cancelled, targets a non-empty directory, or fails during installation | The untitled draft and recovery remain available, no recent project is promoted, and partially created files are rolled back. |
| Mapper sample input contains expression-like strings or very high cardinality | Strings remain inert, ingestion truncates at documented limits, and no expression is executed. |
| Image export encounters an HTTP asset reference or excessive dimensions | Export fails before fetching or expensive encoding; the project remains usable. |

## Studio Host Security Responsibilities

The shared Studio application owns document parsing, archive validation, asset
validation, command invariants, export quotas and safe error presentation. Host
adapters own capabilities that cannot be enforced in portable application code.

The browser host owns explicit picker consent, IndexedDB failure containment,
object URL lifetime and File System Access API permissions. Browser directory
handles do not provide a portable realpath or symlink API; Studio therefore
relies on the browser's sandbox and handle-scoped access rather than claiming a
symlink guarantee it cannot verify.

The Wails desktop host owns native dialogs, opaque project tokens, canonical
root confinement, symlink rejection, typed generated bindings, file-watch
conflicts, recovery, recent-project state, and rollback-capable writes. The
frontend never receives a general filesystem API or authority to supply
arbitrary host paths.

Neither host sends project, mapper-sample or telemetry content over the network
as part of normal Studio operation. A host application that adds remote assets,
collaboration, telemetry, cloud storage or trusted HTML creates a new trust
boundary and must extend this model before enabling it.

## Residual Studio Security Assumptions

- Archive content hashes detect inconsistency inside the imported archive; they
  are not signatures and do not prove who created or approved a bundle. Artifact
  authenticity belongs to the delivery channel or a future signed-manifest
  design.
- Studio validates image signatures, dimensions, bytes and SVG active content.
  It does not perform antivirus scanning or prove that a raster decoder has no
  vulnerability. Hosts must keep browser, Electron and image libraries patched.
- Browser File System Access API handles are constrained by browser-granted
  capability, but they do not expose a portable realpath/symlink check. Desktop
  Studio performs native canonical-path and symlink checks.
- The standalone browser Studio does not control the embedding page's response
  headers, cookies or origin policy; the site operator owns browser CSP and
  isolation headers. Desktop Studio additionally depends on the security and
  patch level of the platform webview runtime.
- Source, archive and message limits bound normal JavaScript work; Studio is not
  a process sandbox. Hosts requiring stronger isolation must parse untrusted
  projects in a separately constrained process or worker.
- Imported image assets are validated and preserved, but Studio does not enable
  implicit `icon.src` or remote Markdown image loading. There is no trusted HTML,
  executable SVG, mapper-expression execution or remote-asset override.
- Local browser persistence and Desktop Studio directory files may contain sensitive
  topology. Studio does not encrypt those stores; workstation access controls,
  repository policy and disk encryption remain host responsibilities.

## What TopoViewer Does Not Guarantee

- It is not a sandbox for arbitrary hostile HTML or JavaScript.
- It does not authenticate users or authorize access to topology content.
- It does not decide whether a topology object should be visible to a tenant.
- It does not make disposable local labs safe for production.
- It does not verify Prometheus data provenance; the host observability stack owns that.
- It cannot detect browser-directory symlinks when the browser API does not expose
  that information; access remains constrained to the granted directory handle.
- It does not make a selected desktop directory trustworthy. Users and
  operating-system permissions remain responsible for the content they open.
- It does not provide a trusted-content mode for arbitrary HTML, executable SVG,
  mapper expressions or remote asset loading.

## Evidence Map

| Risk area | Evidence or guardrail |
|---|---|
| SVG and HTML injection | Hostile corpus tests under TopoViewer package tests. |
| Grafana mounted file escape | Go backend tests for roots, symlinks, traversal, size, and redaction. |
| Public artifact leakage | Artifact autopsy scripts for npm, plugin zip, docs, and media. |
| Dependency and supply chain | npm audit, OSV, govulncheck, CodeQL, secret scanning, Trivy, Dependabot. |
| Renderer parity drift | `ci:render-parity` and docs smoke checks. |
| Unsupported public claims | Docs lint and public-readiness checks. |
| Studio archive and asset abuse | Studio archive, asset-validation and import atomicity tests. |
| Studio parser and command abuse | Studio YAML/session fuzz tests with bounded completion assertions. |
| Desktop native boundary | Go path-security, transaction, recovery, binding-drift, artifact inspection, and startup smoke tests. |
| Browser/Desktop behavioral parity | Shared host conformance and golden authoring journey. |

## Adding Hostile Corpus Cases

When a security bug or bypass is found, add the smallest reproducer to the
focused corpus before fixing the bug:

| Surface | Where to add the case | Expected proof |
|---|---|---|
| SVG icon payload | `packages/topoviewer/tests/unit/hostile-content-corpus.ts` | Sanitized SVG no longer contains the active payload. |
| Markdown, labels, callouts | `packages/topoviewer/tests/unit/security.test.ts` and `packages/topoviewer/tests/topoviewer-interactions.spec.js` | Unit output is inert and browser runtime does not execute script. |
| Docs embed runtime | `packages/topoviewer/tests/fixtures/security-docs-embed.html` plus the hostile-content Playwright grep | Embed runtime remains inert through the same mount path MkDocs/Zensical use. |
| YAML parser or renderer abuse | `packages/topoviewer/tests/unit/security.test.ts` | Parser, lint, or renderer limits reject the input before rendering. |
| Grafana mapper or telemetry labels | `packages/grafana-topoviewer-panel/tests/mapperOverlayAdapter.test.ts` | Mapper output cannot turn telemetry labels into active HTML, CSS injection, SVG data URLs, or broken React attributes. |
| Grafana mounted files | `packages/grafana-topoviewer-panel/pkg/plugin/*_test.go` | Backend rejects traversal, symlink, oversized, duplicate, malformed, or non-UTF-8 files with redacted diagnostics. |
| Studio archive or asset payload | `packages/topoviewer-studio/tests/unit/*security*.test.ts` and archive tests | Import rejects traversal, excessive expansion, invalid manifests, MIME mismatch, unsafe SVG and excessive image dimensions without persistence. |
| Studio YAML/session/mapper payload | Studio unit fuzz and bounded-ingestion tests | Parsing and command execution terminate within their limits, preserve the last valid projection and never evaluate input strings. |
| Desktop binding or directory path | `apps/topoviewer-studio-desktop/internal/native/*_test.go` and desktop frontend adapter tests | Invalid DTOs, out-of-root paths, symlinks, conflicts, and partial writes are rejected before unsafe I/O or project promotion. |

Run `npm run test:hostile-content` for the focused gate. Run
`npm run ci:public-readiness` before a public release candidate.


- Repository `SECURITY.md`: vulnerability reporting and scope.
