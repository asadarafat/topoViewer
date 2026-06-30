## Brutal Audit

Current state: TopoViewer is technically promising, but its public surface is
too noisy for broad adoption.

### Strengths

- The core idea is differentiated: topology as code for semantic, inspectable
  network, infrastructure, and service diagrams.
- The renderer has real substance: YAML schemas, selector stylesheets,
  attention, layout, examples, docs embeds, harness, React API, and Grafana
  direction.
- Examples are unusually test-backed for an early open-source diagramming
  project.
- The canonical content root under `packages/topoviewer/content/**` is the
  right foundation for DRY docs and examples.

### Weaknesses

- The repo currently presents too much implementation ambition at the front
  door: renderer, YAML spec, docs plugin, Zensical, VS Code, Grafana, OpenSpec,
  layout engines, and labs all compete for attention.
- First-time users cannot immediately tell what is stable today versus
  experimental or roadmap.
- Public nav mixes beginner docs, generated examples, reference, release,
  production hardening, monorepo internals, and documentation standards.
- Generated example pages read like test-case catalog output. That is useful
  internally, but it does not feel like a curated public learning path.
- The README is directionally correct, but still too much product explanation
  and not enough "copy this YAML, render this diagram, embed it here."
- The README uses a static image where the product would benefit from a short,
  playable walkthrough showing YAML changing into a graph across the actual
  supported surfaces.
- Integration messaging can drift. For example, Grafana implementation has
  moved beyond early phases, but shared public wording can still read as Phase 2.

### Adoption Risks

- High-bar engineers may classify the project as a research workspace before
  they see the stable core.
- The number of surfaces makes the project look harder to adopt than it is.
- Roadmap visibility is good, but roadmap material must not obscure the
  install-and-embed path.
- If docs remain mechanically generated in the main learning path, the project
  will feel less polished than the renderer deserves.

### Why A Serious Evaluator Still Says No

Even after the current spec is implemented, a high-scale engineering org can
still reject TopoViewer for reasons that are not solved by prettier docs:

- No obvious dependency-owner story. A user cannot quickly tell who maintains
  the project, how decisions are made, who reviews security issues, what the
  support boundary is, or whether breaking changes are controlled.
- No hard compatibility contract. The repo needs SemVer policy, schema
  versioning, deprecation rules, migration guidance, and backwards
  compatibility tests that prove old YAML still renders.
- No credible release discipline. A serious adopter wants signed or
  provenance-backed artifacts, changelogs, release notes, SBOM expectations,
  package contents allowlists, and rollback/deprecation procedures.
- No published performance envelope. "It works" is not enough. Users need
  measured limits for small, medium, dense, and stress topologies, plus
  interaction latency, memory, and browser/Grafana budgets.
- No production operations contract. Users need reliability expectations,
  diagnostic behavior, failure modes, telemetry privacy, state persistence
  rules, and what happens when YAML, assets, or telemetry are bad.
- No accessibility and keyboard contract. Enterprise UI adoption can be blocked
  by missing keyboard navigation, focus behavior, color contrast, screen-reader
  posture, or reduced-motion expectations.
- No architectural threat model. The repo has rich input surfaces: YAML, SVG,
  Markdown-derived HTML, mapper templates, telemetry labels, docs embeds, and
  mounted files. A serious adopter wants a threat model and tests tied to it.
- No governance and contribution contract. Without `SECURITY.md`, `SUPPORT.md`,
  `CONTRIBUTING.md`, `CODEOWNERS`, issue templates, review standards, and
  maintainer response expectations, the project looks like a personal lab.
- No API surface ownership. React exports, YAML schema, style metadata, mapper
  schema, docs plugins, harness state, and Grafana plugin APIs need explicit
  public/internal boundaries.
- No compatibility matrix. Adopters need pinned and tested versions for Node,
  React, React Flow, Grafana, browsers, MkDocs, Zensical, and operating
  systems.
- No "why not build it internally" evidence. The project must prove that its
  schema, stylesheet model, docs embeds, harness, mapper, and operational
  integrations create compounding value that a team would not want to rebuild.
- No public maturity signal. Stars will not come from code volume. They come
  from a crisp demo, working install, stable examples, issue hygiene, good
  releases, and evidence that maintainers will not disappear after the first
  external bug report.

The uncomfortable conclusion: public adoption readiness is not just a docs
project. It is a trust project.

### Target Signal

The first ten minutes should communicate:

1. what TopoViewer is;
2. how it differs from Mermaid.js and raw React Flow;
3. how to render the first topology;
4. how to embed it in React or docs;
5. how the same YAML appears in MkDocs, Zensical, harness, and Grafana;
6. which YAML/schema/API contracts are stable;
7. which integrations are supported, experimental, lab-only, or roadmap;
8. why the examples are trustworthy and CI-backed.

### Product Thesis

TopoViewer should present itself as:

```text
Topology as Code for semantic, interactive diagrams.
```

The supporting claim:

```text
Keep topology facts in YAML, keep presentation in reusable stylesheets, and
render the same model in docs, apps, authoring tools, and operational dashboards.
```

## Brutal Truth: Early-Adopter Adoption Gaps

TopoViewer will not be adopted because it has many surfaces. It will be
adopted only if a strong early adopter can go from "I have topology data" to a
useful rendered diagram without learning repo internals, reverse-engineering
schema behavior, or guessing why a surface behaves differently from another
surface.

The current risk profile is:

1. The workflow still smells like a maintainer workspace in too many places.
   If a user must understand `packages/topoviewer/content/**`, generated
   projections, fixture sync, lab scripts, OpenSpec history, or monorepo build
   output before they get value, the workflow is not production-grade.

2. The integration surfaces are powerful but uneven.
   React, MkDocs, Zensical, harness, VS Code, Grafana, NetBox, and
   OpsMill/Infrahub must not appear equally supported. Containerlab-backed
   telemetry belongs under the Grafana lab, not beside Grafana as a separate
   public integration. Each surface needs a hard status, a five-minute path, a
   failure-mode guide, and a clear boundary between stable, experimental,
   lab-only, and roadmap work.

3. Mapper authoring is a major adoption cliff.
   `*.mapper.tv.yaml` is powerful, but power without assist is friction. If
   users cannot discover valid target kinds, resolver modes, style overlay
   keys, object IDs, labels, data keys, thresholds, and starter PromQL inside
   the harness, the mapper becomes an expert-only language.

4. Documentation is currently a product dependency, not polish.
   The docs must be operationally complete. A user should be able to follow the
   docs from a fresh checkout, npm install, docs preview, mounted bundle, or
   Grafana lab and know exactly what they should see after every step.

5. Lab paths and production paths can blur.
   Fixture mode, synthetic telemetry, Grafana Containerlab-mode telemetry,
   local plugin dist, unsigned Grafana plugin loading, and future signed
   artifacts must be labeled clearly. If docs mix these without explicit
   purpose and status, users will copy the wrong workflow into production.

6. There is no credible adoption story until package and artifact stories are
   clear.
   Local monorepo builds are fine for development, but early adopters need to
   know whether they install from npm, a package tarball, a Grafana plugin zip,
   an unsigned local plugin, a signed artifact later, or source.

7. "It renders" is not enough validation.
   Adoption docs must include expected output, mapping coverage, visual
   screenshots, command snippets, troubleshooting paths, and objective checks
   for no data, wrong data, ambiguous data, stale topology, renderer mismatch,
   and broken docs embeds.

8. Interactivity needs explicit expectations.
   Users need to know what happens to pan, zoom, selection, focus, drag
   position, overlays, persistence, browser refresh, dashboard refresh, bundle
   changes, and panel reloads on every integration surface that claims
   interactivity.

9. Containerlab-backed telemetry must be presented as an advanced Grafana lab
   mode, not the first required adoption path and not a separate top-level lab.
   The default early-adopter path should be authored YAML plus local preview.
   Grafana's Containerlab mode should prove realistic telemetry after the user
   already understands topology/style/mapper behavior.

10. Text-only docs are not enough for public adoption.
    The docs need screenshot-backed expected results, smoke commands, visual
    parity checks, and regression coverage because the product is visual.

## Required Product Correction

The public adoption path must be framed around these first successful journeys:

```text
I want a diagram:
  write topology YAML
  write stylesheet YAML
  preview in the harness
  copy the same YAML into docs or an app
  see the same rendered topology

I want docs:
  add a TopoViewer block to MkDocs or Zensical
  reference the same YAML files
  preview locally
  publish without renderer drift

I want an app:
  install the package
  import the React component
  pass topology/style data
  handle diagnostics and loading

I want operations:
  use the harness to author topology/style/mapper YAML
  mount the three files into Grafana
  bind Prometheus data to TopoViewer objects
  inspect mapping coverage
  see runtime overlays without mutating source YAML
```

Anything outside those paths is secondary. If a feature does not improve one of
these journeys, it is not a public-adoption priority.

## Concrete Static Repo Findings

These are not all vulnerabilities. They are the kinds of small,
confidence-eroding details that make a serious early adopter pause.

### Public Documentation And Ergonomics Smells

- The docs are broad, but they are not yet ruthless. Users can encounter
  generated examples, roadmap pages, maintainer docs, production-hardening
  notes, labs, and integration plans before they see one crisp "copy this,
  render this" path.
- Generated example pages are useful as regression evidence, but they read like
  test catalog output. They should not be the primary learning path.
- Product messaging is duplicated across README, docs home, product pages, and
  integration pages. This is content drift risk, even if it is not byte-for-byte
  duplication.
- React install documentation has already hit the real problem: an install
  command can be public before the npm package exists. That must be treated as
  a release blocker, not a typo.
- MkDocs, Zensical, and harness renderer parity has been fragile enough that
  docs must include visual parity gates, not only unit tests.
- Old public route casing and repo slug drift have been repeated. Lowercase
  `/topoviewer/` and the intended repository slug need automated checks.
- Public docs must be audited for local paths, `.donotpush`, `.artifacts`,
  `/Users/...`, `DG_25`, private screenshots, and temporary transfer artifacts.
- The docs do not yet behave like a developer reference for a schema-driven
  product. A serious developer needs every graph, node, link, path, region,
  layer, label, data, style, attention, and mapper attribute explained with
  type, accepted values, defaults, validation behavior, selector behavior,
  mapper behavior, and small examples.
- Grafana adoption depends on `*.mapper.tv.yaml`, but mapper authoring is not
  first-class in the harness yet. That is a direct developer-experience blocker:
  users can render a panel, but they cannot ergonomically create the data
  binding that makes the panel operationally useful.

### Integration Surface Smells

- React needs a package publication story, SSR guidance, error handling,
  caching guidance, peer dependency contract, and examples that match actual
  exported types.
- MkDocs and Zensical need a shared canonical content pipeline and a visual
  contract that prevents CSS leakage except for intentional theme colors.
- The browser harness is powerful, but it must become the primary authoring
  product, not a developer-only playground. Mapper authoring, schema assist,
  diagnostics, bundle export, and parity preview belong there.
- VS Code integration should not be described as ready until the extension can
  be installed and can detect/render relevant YAML files without users knowing
  repo internals.
- Grafana must not require users to edit catalogs, sync generated fixtures, or
  rebuild the plugin to bring their own topology/style/mapper bundle.
- NetBox and OpsMill/Infrahub should stay roadmap/spec-driven until plugin
  ergonomics and data-source identity are real, not aspirational.
- Containerlab-backed Grafana demos must not become the first-run path. They
  are advanced realism proof after the simple authoring and Grafana bundle
  workflow works, and they should live under the Grafana lab.

### Lab Security Smells

- `labs/grafana-topoviewer/.env` and
  `labs/grafana-topoviewer/containerlab/.env` are checked in with
  `GRAFANA_ADMIN_USER=admin` and `GRAFANA_ADMIN_PASSWORD=admin`. That is
  acceptable only if loudly labeled as disposable lab-only config. It must not
  look like production guidance.
- The synthetic Grafana and Grafana Containerlab-mode configs enable anonymous
  Admin:
  `GF_AUTH_ANONYMOUS_ENABLED=true`, `GF_AUTH_ANONYMOUS_ORG_ROLE=Admin`, and
  `GF_AUTH_DISABLE_LOGIN_FORM=true`. This is lab convenience and production
  poison if copied.
- Docker and Grafana Containerlab-mode ports are published as host ports
  without a consistently documented localhost-only security posture. On a
  shared host this can expose Grafana, Prometheus, the injector, gNMIc metrics,
  or normalizer services.
- Unsigned plugin loading is required in the lab:
  `GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=asadarafat-topoviewer-panel`.
  That is fine for development and not fine as a production install story.
- The docs must distinguish "lab unsafe", "local development",
  "production-shaped", "unsigned artifact", and "supported installable plugin"
  at every Grafana entry point.

### Plugin Artifact And Release Smells

- `packages/grafana-topoviewer-panel/package.json` is `private: true`, and the
  Grafana plugin metadata still lacks a serious published-artifact story.
- There is no signed plugin artifact contract, no early unsigned zip install
  path with checksum guidance, no SBOM story, and no compatibility matrix that
  states exactly which Grafana versions are expected to work.
- The plugin still depends on local monorepo build output for the strongest
  demos. Early adopters need either a pinned artifact or a brutally clear
  "build from source, experimental" path.
- npm publishing must be manual, deliberate, and provenance-aware. Normal push
  CI must validate package contents but never publish.

### Dependency And Supply-Chain Smells

- `.github` currently has CI and docs workflows, but no `dependabot.yml`.
  That means dependency monitoring is not yet automatic. A serious public repo
  needs automated security update PRs, not occasional manual `npm audit`
  checks.
- `npm audit --omit=dev --audit-level=moderate` currently reports a moderate
  production advisory through `dompurify`.
- Full `npm audit --audit-level=moderate` currently reports high advisories
  through Grafana package dependencies plus an `esbuild` advisory. Some may be
  dev-only or upstream-tooling risk, but the repo needs a written triage policy
  separating shipped risk, dev-tool risk, and accepted temporary risk.
- Go tests pass for the Grafana backend, but there is no documented
  `govulncheck` or Go vulnerability gate.
- There is no explicit CodeQL/static-analysis, secret-scanning, container image
  scanning, or scheduled dependency-health report in the public-readiness plan.
- Release gates must prove artifacts contain only intended files and no local
  paths, `.env`, private keys, personal screenshots, generated junk, or
  accidental `.donotpush` content.

### Backend Resource Endpoint Smells

- The Grafana backend resource endpoint accepts `root`, `manifest`, and `id`
  query parameters. It has root allow-listing and size limits, which is good,
  but not enough to call it hardened.
- The backend must be attacked with symlink escape cases. Lexical containment
  via absolute paths and relative paths is not sufficient if a mounted symlink
  resolves outside the bundle root.
- Diagnostics can include filesystem paths. That is useful for local labs, but
  in shared Grafana it can leak container internals to users who do not need
  them.
- Manifest behavior needs abuse tests: duplicate IDs, absolute paths,
  `../` traversal, symlinks, massive manifests, deep YAML, zero-byte files,
  non-UTF-8 files, and many bundle directories.
- Resource access must be tested with Grafana Viewer, Editor, Admin, and
  anonymous access. Testing as local anonymous Admin is not enough.

### YAML, Mapper, SVG, And HTML Attack Surface

- TopoViewer renders user-authored YAML, inline SVG, Markdown-derived HTML,
  labels, callouts, mapper templates, and remote/data image references. That is
  a rich input surface.
- SVG sanitization is regex-based in core security helpers. Regex sanitizers
  are brittle. The project needs a malicious SVG corpus, not confidence in a
  few replacement rules.
- `dangerouslySetInnerHTML` exists in renderer components for callouts/labels.
  That can be safe only if every compiler path sanitizes correctly. It deserves
  explicit XSS regression tests.
- Mapper template rendering uses constrained token replacement rather than
  `eval`, which is good. It still needs hostile sample values proving telemetry
  labels cannot become executable HTML, CSS injection, broken SVG IDs, or bad
  React attributes.
- YAML parsing needs hostile cases: aliases, YAML bombs, huge arrays, deeply
  nested maps, duplicate keys, strange Unicode, null bytes, invalid encodings,
  and malformed partial edits.
- Renderer limits exist, but mounted bundle limits need proof that oversized
  documents fail before they freeze the panel or browser.

### Operational And UX Smells

- The docs still read too much like a maintainer lab manual in places. A new
  user should not care about phase history before they see one working path.
- Mapper coverage numbers can be confusing without examples. A line like
  "21 samples resolved, 7 duplicate" is not self-explanatory. The docs must
  tell users whether that is healthy, suspicious, or broken.
- Mapper YAML is currently too easy to treat as an implementation artifact
  rather than a user-authored contract. It needs harness authoring, inline
  suggestions, target/object pickers, coverage preview, examples, and docs that
  explain every mapper attribute in relation to TopoViewer object attributes.
- Editable versus provisioned dashboards are a trap. Users need to know when
  Grafana UI saves are ephemeral, when JSON must be copied back, and when
  provisioning makes edits read-only.
- "Production-shaped" is an honest phrase only if docs show what is still not
  production: auth, signing, artifact installation, dependency audit, network
  exposure, support status, and compatibility.

## Penetration-Style Test Matrix Required

This project does not need theater. It needs hostile tests that match the
actual attack surfaces:

| Area | Attack | Required result |
| --- | --- | --- |
| Bundle root | `root=/`, disallowed root, relative root, empty root | Request is rejected without leaking sensitive paths. |
| Manifest path | `../`, absolute outside root, symlink outside root | Request is rejected after realpath/symlink resolution, not only lexical cleanup. |
| Bundle files | symlinked YAML outside root | Backend refuses to read it. |
| Bundle files | file over size limit, many files, many directories | Backend fails fast with bounded CPU/memory and useful diagnostics. |
| YAML parser | alias bomb, deep nesting, duplicate keys, invalid UTF-8 | UI reports diagnostics and remains responsive. |
| Mapper parser | unknown keys, impossible states, invalid target kind, huge rule set | Diagnostics identify the exact path and prevent overlays. |
| Mapper templates | telemetry label contains `<script>`, SVG, CSS, long text, Unicode controls | Rendered labels are inert text and cannot execute or break layout. |
| SVG icons | script tags, event handlers, `javascript:` href, `foreignObject`, encoded bypasses | Sanitizer removes or blocks payloads across React, MkDocs, Zensical, harness, and Grafana. |
| Markdown/callout HTML | raw HTML, image data SVG, javascript link | Renderer output is inert and safe. |
| Grafana roles | Viewer, Editor, Admin, anonymous | Resource access follows Grafana security expectations and docs state lab exceptions. |
| Network exposure | lab started on shared host | Docs/scripts make insecure anonymous Admin exposure obvious and avoid accidental production copy-paste. |
| Storage | local/session interaction state contains sensitive object names | State is scoped, clearable, bounded, and documented. |
| Dependency audit | npm/Go advisories | Each advisory is fixed, suppressed with rationale, or explicitly classified as dev/tooling/external. |
| Artifact integrity | npm tarball, Grafana plugin zip, docs build | Artifact contains no `.env`, local paths, private files, or unexpected generated junk. |

## Uncommon Hardening Methods

These are deliberately more aggressive than normal "best practice" checklists:

- Run a hostile-content corpus through React, MkDocs, Zensical, harness, and
  Grafana. The corpus should include malicious SVG, callouts, labels, mapper
  templates, YAML bombs, Unicode controls, huge labels, and malformed partial
  edits.
- Add "artifact autopsy" scripts for npm packs, docs builds, Grafana plugin
  zips, screenshots, and generated videos. The scripts should ban local paths,
  `.env`, `.donotpush`, private keys, debug dumps, and unexpected binary files.
- Add visual parity probes that compare DOM invariants and screenshot crops
  across harness, MkDocs, and Zensical. Color may be theme-derived; geometry,
  sizing, label placement, edge attachment, and glyph alignment must not drift.
- Add a fake early-adopter drill: start from a clean checkout and follow only
  public docs. Any step requiring maintainer knowledge becomes a docs bug.
- Add a "docs contradiction" lint that checks README, docs home, package
  READMEs, integration pages, and OpenSpec status words for conflicting
  support claims.
- Add a security posture banner for every lab command that starts anonymous
  Admin or exposes local ports.
- Add dependency-risk ledger entries for npm and Go advisories. Do not hide
  behind green tests when audit findings remain untriaged.
- Add package/install dry runs for public docs commands before any package name
  appears in README or docs.
- Add mapper ergonomic tests: a user should be able to discover all required
  mapper keys and common values from the harness without reading source.
- Add layout/render stress budgets and fail builds when curated examples exceed
  defined render time, screenshot stability, or interaction thresholds.

## Documentation Bar

The docs are production-grade only when they include:

- a five-minute happy path;
- a from-scratch local path;
- a copyable YAML-to-diagram path;
- a React install path that works against a published package or is clearly
  labeled pre-publish;
- MkDocs and Zensical embed paths with local preview and expected result;
- a harness authoring guide for topology, stylesheet, and mapper YAML;
- a Grafana mounted-bundle path with mapper authoring, Prometheus binding,
  mapping coverage, and troubleshooting;
- mapper schema reference with real accepted values;
- target/resolver examples for node, link, path, region, layer, and graph;
- style overlay examples that map telemetry to visual changes;
- expected screenshots for healthy, degraded, and failed states;
- compatibility notes for Node, React, Grafana, browser, and docs tools;
- explicit "supported", "experimental", "lab", "roadmap", and "maintainer"
  labels;
- fresh-checkout validation commands.

If any of those are missing, TopoViewer can be technically useful, but it
should not claim production-ready public adoption.
