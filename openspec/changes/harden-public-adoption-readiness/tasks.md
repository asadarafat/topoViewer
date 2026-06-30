## 0. Spec And Audit Traceability

- [x] 0.1 Integrate the cross-surface brutal adoption and security audit into `audit.md`
- [x] 0.2 Add an audit-to-task traceability table to this change that maps every `audit.md` section to task IDs
- [x] 0.3 Add a spec-to-task traceability table that maps every `spec.md` requirement and scenario to task IDs
- [ ] 0.4 Refuse archive until every spec requirement is implemented, explicitly deferred to a named OpenSpec, or documented as accepted risk
- [ ] 0.5 Refuse archive until every audit smell is resolved, explicitly deferred to a named OpenSpec, or documented as accepted risk
- [ ] 0.6 Add a final "public adoption readiness report" under this change with completed evidence links, remaining risks, and go/no-go recommendation

## 1. Evidence Baseline

- [x] 1.1 Generate an inventory of public docs pages, package READMEs, generated pages, labs, examples, CI workflows, and package manifests
- [x] 1.2 Save the inventory output under this change so review can see exactly what was audited
- [x] 1.3 Search public files for local path leaks: `/Users/`, `DG_25`, `.donotpush`, `.artifacts`, temporary transfer files, private screenshots, and stale hostnames
- [x] 1.4 Search public files for stale route/repo casing: `/TopoViewer/`, `github.com/asadarafat/TopoViewer`, and mixed `topoViewer` paths
- [x] 1.5 Search scripts, docs, workflows, and lab files for default credentials, anonymous Admin, unsigned plugin loading, and broad host-port exposure
- [x] 1.6 Run and record current package/security baseline: `npm audit --omit=dev --audit-level=moderate`, full `npm audit --audit-level=moderate`, and Go backend tests
- [x] 1.7 Identify all `dangerouslySetInnerHTML`, SVG sanitization, YAML parsing, mapper template, and mounted-bundle file-read paths
- [x] 1.8 Classify every major public surface as Supported, Experimental, Lab, Roadmap, or Maintainer

## 2. Public Information Architecture

- [x] 2.1 Refactor MkDocs nav into Start, Author, Embed, Examples, Reference, Labs, and Maintainers
- [x] 2.2 Regenerate Zensical nav from the same public IA without an extra duplicate top-level Zensical section
- [x] 2.3 Move Monorepo, Release, Documentation Standard, and Production Hardening under Maintainers
- [x] 2.4 Keep generated exhaustive reference/test catalog available but out of the primary learning path
- [x] 2.5 Move lab-only and roadmap-heavy pages out of the first-run path
- [x] 2.6 Update docs home to route users by job: author, embed, operate, reference, maintain
- [x] 2.7 Add docs lint that fails when Maintainer/Lab pages appear in the primary Start path
- [x] 2.8 Add docs lint that fails when an integration page has no support-status label

## 3. README And First-Run Story

- [x] 3.1 Refactor README first screen around the stable core promise: YAML topology, reusable stylesheet, interactive diagram
- [x] 3.2 Add the smallest useful topology and stylesheet snippets or a direct first-topology link
- [x] 3.3 Add one concise support-status table for React, MkDocs, Zensical, harness, VS Code, Grafana, NetBox, and OpsMill/Infrahub; document Containerlab only as a Grafana lab telemetry mode
- [x] 3.4 Remove monorepo internals, phase history, and long roadmap explanations from the README body
- [x] 3.5 Verify README public URLs use lowercase `/topoviewer/` and the intended repository slug
- [x] 3.6 Add a README install warning or pre-publish status if the npm package name is not live
- [x] 3.7 Add README links for MkDocs, Zensical, harness, and integration roadmap that match the published GitHub Pages layout
- [x] 3.8 Add a review checklist that proves the README first screen answers "what is it", "why use it", and "how do I see it"

## 4. Support Status And Product Claims

- [x] 4.1 Define the exact status labels and wording in a reusable docs fragment or shared source
- [x] 4.2 Apply status labels to README, docs home, React, MkDocs, Zensical, harness, VS Code, Grafana, NetBox, and OpsMill/Infrahub pages; keep Containerlab status inside the Grafana lab page
- [x] 4.3 Add docs lint that rejects unsupported terms such as "production-ready" unless the page meets the matching readiness gate
- [x] 4.4 Add docs lint that flags "supported", "stable", "experimental", "lab", and "roadmap" contradictions across README, docs home, package READMEs, and integration pages
- [x] 4.5 Add a public support matrix showing stable package/API/schema surfaces versus experimental fields and integrations
- [x] 4.6 Update OpenSpec index or docs so active roadmap work does not read as shipped support

## 5. Curated Examples

- [x] 5.1 Create or promote a curated Examples landing page before the generated catalog
- [x] 5.2 Include curated examples for basic graph, CLOS fabric, real network, node styling, edge styling, attention, and Grafana mapper overlay
- [x] 5.3 For each curated example, document what to copy, what it renders, which YAML fields matter, and the expected visual result
- [x] 5.4 Keep live viewport, topology YAML, stylesheet YAML, mapper YAML, and attention YAML tabs only where relevant
- [ ] 5.5 Audit curated example YAML for production-grade icon sizing, label placement, edge attachment, color choices, shape/size validity, and no label overlap
- [ ] 5.6 Add screenshot evidence for representative curated examples in harness, MkDocs, and Zensical
- [x] 5.7 Add generated catalog demotion wording so users understand it is exhaustive reference/test coverage, not the learning path

## 6. Guide And Reference Split

- [ ] 6.1 Split oversized authoring material into task-oriented guide pages and model reference pages
- [ ] 6.2 Keep the Stylesheet guide practical at the top and move exhaustive key tables to Reference
- [ ] 6.3 Ensure every stylesheet key table lists accepted values, data type, defaults, and use without duplicating enum prose outside the table
- [ ] 6.4 Split Attention into quick use cases, topology declaration, TypeScript API, and reference sections
- [x] 6.5 Keep React page focused on embedding; move exhaustive exported API detail to TypeScript API reference
- [x] 6.6 Add SSR, error handling, loading, caching, diagnostics, and versioning guidance to React docs
- [x] 6.7 Add clear "next step" links at the end of major guide pages
- [ ] 6.8 Add a guide-page length budget and demote pages that exceed it to Reference or Maintainers
- [x] 6.9 Add object reference pages for graph, layers, nodes, links, paths, regions, callouts, labels, data, layout, icons, stylesheet rules, style objects, attention, and mapper rules
- [x] 6.10 For every object reference page, list every public attribute with purpose, required/optional status, data type, accepted values or format, default behavior, validation behavior, selector implications, mapper implications, and stability status
- [x] 6.11 Add a minimal YAML snippet for every public object attribute
- [ ] 6.12 Add a small rendered or diagnostic example for every object family, using focused graphs rather than crowded catalog examples
- [x] 6.13 Add mapper-relevant notes to node, link, path, region, layer, graph, label, and data attribute docs
- [x] 6.14 Add selector-relevant notes to labels, data, stylesheet rule, style object, node, link, path, and region attribute docs
- [x] 6.15 Generate or validate object-attribute tables from schema/type/style metadata so docs cannot silently drift
- [x] 6.16 Add docs lint that fails when a public schema/type attribute is missing from the object reference
- [x] 6.17 Add docs lint that fails when an object reference attribute lacks an example or explicit "not applicable" reason

## 7. Differentiation And Positioning

- [x] 7.1 Add factual "Why not Mermaid.js?" comparison focused on semantic topology runtime, not generic diagram syntax
- [x] 7.2 Add factual "Why not raw React Flow?" comparison focused on schema, stylesheet, docs embeds, validation, and authoring workflow
- [x] 7.3 Add static image/SVG workflow comparison without unnecessary competitor callouts
- [x] 7.4 Add "Topology as Code" positioning that explains topology means graph/diagram facts, not only network device topology
- [x] 7.5 Add examples showing TopoViewer as an npm library inside an end product, not only docs pages
- [x] 7.6 Add a public "what TopoViewer is not" section to reduce overpromising and support burden

## 8. Harness Mapper Authoring

- [x] 8.1 Add browser harness support for editing `*.mapper.tv.yaml` alongside topology and stylesheet YAML
- [x] 8.2 Add schema-backed Monaco suggestions for mapper keys, enums, target kinds, resolver modes, states, thresholds, overlays, and query hints
- [x] 8.3 Add topology-aware suggestions for node IDs, link IDs, path IDs, region IDs, layers, labels, and data keys from the applied topology
- [x] 8.4 Add style-overlay suggestions driven by the same style metadata used by runtime/docs/schema
- [ ] 8.5 Add mapper diagnostics for YAML parse errors, schema errors, topology binding errors, ambiguous matches, stale IDs, unsupported overlay keys, and query hints
- [ ] 8.6 Add a mapper coverage preview showing matched, unmatched, duplicate, ambiguous, and stale telemetry using synthetic frames or pasted sample labels
- [x] 8.7 Add copy/export behavior for canonical bundle suffixes: `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml`
- [ ] 8.8 Add curated mapper examples for node health, link state, bidirectional utilization, path SLO, region aggregate status, layer aggregate status, and graph summary status
- [x] 8.9 Document that the harness authors mapper YAML while Grafana consumes and validates it at runtime
- [x] 8.10 Add Playwright coverage proving a user can author a valid mapper without reading source files
- [x] 8.11 Add a dedicated Mapper YAML tab/mode in the browser harness with the same editor quality as topology and stylesheet YAML
- [x] 8.12 Treat topology, stylesheet, and mapper YAML as one editable bundle with shared dirty state, apply/revert behavior, local persistence, and export/copy behavior
- [ ] 8.13 Add a mapper rule builder UI for target kind, selector/join mode, metric/query, value extraction, states, thresholds, overlay styles, label templates, and aggregate behavior
- [ ] 8.14 Add target-kind-specific validation so node, link, path, region, layer, and graph mapper rules only expose supported overlay controls
- [ ] 8.15 Add topology-derived picker UX for object IDs, layer IDs, label keys/values, data keys, link endpoints, path IDs, and region IDs
- [ ] 8.16 Add mapper presets that demonstrate style changes, label changes, status/badge changes, aggregate state, ID matching, label/data matching, endpoint matching, selector matching, and ambiguous-match diagnostics
- [ ] 8.17 Add a mapping coverage panel in the harness that mirrors Grafana coverage concepts before the user mounts the bundle
- [ ] 8.18 Add copyable generated PromQL starters or metric label recommendations from mapper rules where possible
- [ ] 8.19 Add docs links from the mapper editor to exact mapper object and object-attribute reference sections
- [x] 8.20 Add schema-backed hover help explaining each mapper attribute, accepted values, implications, and examples inline in Monaco
- [x] 8.21 Add tests that invalid mapper edits do not mutate applied topology/style YAML or corrupt the last valid preview
- [ ] 8.22 Add tests that exported `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml` can be mounted by the Grafana panel without catalog edits or fixture sync

## 9. Cross-Surface Rendering Parity

- [ ] 9.1 Add a renderer parity fixture set covering graph basic, CLOS, label placement, icons, regions, directed lanes, attention, and mapper overlays
- [ ] 9.2 Add Playwright captures for harness, MkDocs, and Zensical for the parity fixture set
- [ ] 9.3 Add DOM or screenshot invariants for node shape aspect ratio, icon/glyph alignment, label vertical spacing, meta label spacing, edge attachment, arrow offset, and region label placement
- [ ] 9.4 Allow theme-derived color differences only where documented; fail geometry, sizing, spacing, and layout drift
- [ ] 9.5 Add a regression for docs CSS leakage so MkDocs/Zensical theme CSS cannot alter renderer geometry
- [ ] 9.6 Add failure artifacts under `.artifacts/` for parity diffs without committing those artifacts
- [ ] 9.7 Wire representative parity checks into CI or a clearly named pre-release command

## 10. Grafana Early-Adopter Workflow

- [x] 10.1 Document the production-shaped path: author in harness, export bundle files, mount bundle, select bundle, bind Prometheus, inspect coverage, validate overlays
- [x] 10.2 Remove or clearly demote any workflow that requires users to edit fixture catalogs, run fixture sync, or rebuild the plugin for normal bundle changes
- [x] 10.3 Add Grafana docs for mapper coverage numbers, including resolved, unresolved, ambiguous, duplicate, and stale examples
- [x] 10.4 Add Grafana docs for dashboard editability versus provisioning and what changes survive reload
- [x] 10.5 Add Grafana docs for panel interactivity: pan, zoom, select, focus, drag persistence, refresh, variable changes, bundle changes, and panel reload
- [x] 10.6 Add Grafana docs for expected query outputs and rendered overlay outcomes for healthy, degraded, failed, and no-data states
- [ ] 10.7 Add screenshots for mounted bundle selection, mapper diagnostics, mapping coverage, and telemetry overlay states
- [x] 10.8 Add a fresh-checkout Grafana smoke command sequence that does not require source-code reading
- [x] 10.9 Add Grafana docs that start from a harness-authored bundle and explicitly show where the generated `*.mapper.tv.yaml` is mounted
- [x] 10.10 Add Grafana mapper docs for every mapper attribute with purpose, type, accepted values, examples, and relationship to topology object attributes
- [x] 10.11 Add Grafana examples that map telemetry to node style, link style, path style, region style, layer aggregate state, graph summary state, label text, badge/status, and directional link data
- [x] 10.12 Add troubleshooting docs for mapper rules that match no objects, match too many objects, match parallel links ambiguously, use unsupported overlay keys, or receive unexpected metric labels

## 11. Lab Safety Boundaries

- [x] 11.1 Replace or clearly label checked-in lab `.env` files as disposable local defaults
- [x] 11.2 Add startup warnings for npm scripts that run Grafana with anonymous Admin, disabled login form, unsigned plugin loading, or published host ports
- [x] 11.3 Add docs warnings beside every lab command that exposes Grafana, Prometheus, injector, gNMIc, or normalizer ports
- [x] 11.4 Add localhost binding or explicit docs rationale for every Docker and Grafana Containerlab-mode published port
- [x] 11.5 Add a production-shaped Grafana configuration example that does not use anonymous Admin or disposable credentials
- [x] 11.6 Add docs explaining unsigned plugin loading is local lab/development only
- [x] 11.7 Add CI or lint checks that prevent lab credentials from appearing in production docs snippets

## 12. Security: Hostile Content Corpus

- [x] 12.1 Add a hostile SVG corpus covering script tags, event handlers, `javascript:` URLs, `foreignObject`, encoded bypasses, CSS injection, data SVGs, and malformed SVG
- [x] 12.2 Add tests proving SVG sanitization blocks or removes hostile payloads and preserves safe SVG icons
- [x] 12.3 Add hostile label/callout/Markdown tests proving rendered HTML remains inert across React runtime paths
- [x] 12.4 Add docs-embed hostile content tests for MkDocs and Zensical live viewport rendering
- [x] 12.5 Add Grafana hostile content tests for labels, mapper-rendered labels, SVG icons, and panel diagnostics
- [x] 12.6 Add hostile mapper template and telemetry-label tests proving Prometheus labels cannot become executable HTML, CSS injection, invalid SVG, or broken React attributes
- [x] 12.7 Add YAML abuse tests for aliases, YAML bombs, deep nesting, duplicate keys, huge arrays, invalid UTF-8, null bytes, Unicode controls, and malformed partial edits
- [x] 12.8 Add renderer-limit tests proving oversized YAML fails with diagnostics before freezing browser, docs, or Grafana
- [x] 12.9 Document how to add new hostile corpus cases when a bug is found

## 13. Security: Grafana Mounted Bundle Backend

- [x] 13.1 Add backend tests for disallowed root, empty root, relative root, `root=/`, and root outside allowlist
- [x] 13.2 Add backend tests for manifest traversal, absolute manifest path, symlinked manifest outside root, and manifest path with encoded traversal
- [x] 13.3 Add backend tests for symlinked topology/style/mapper files outside the allowed root using realpath resolution
- [x] 13.4 Add backend tests for duplicate bundle IDs, missing canonical suffix files, duplicate canonical suffix files, zero-byte files, non-UTF-8 files, and malformed YAML
- [x] 13.5 Add backend tests for oversized files, large directory counts, deeply nested directories, and many bundle directories
- [x] 13.6 Redact unnecessary filesystem paths from diagnostics returned to the Grafana frontend
- [x] 13.7 Add Grafana role/access tests or documented manual checks for Viewer, Editor, Admin, and anonymous lab access
- [x] 13.8 Add backend timeout or bounded work checks where bundle discovery can traverse many files

## 14. Release Artifact Integrity

- [x] 14.1 Add npm package artifact autopsy that fails on `.env`, `.donotpush`, local paths, private keys, unexpected binaries, debug dumps, stale URLs, and generated junk
- [x] 14.2 Add Grafana plugin zip artifact autopsy with the same denylist plus plugin metadata and compatibility validation
- [x] 14.3 Add docs build artifact autopsy for generated pages, public assets, screenshots, videos, and accidental local/private content
- [x] 14.4 Add promotional media artifact checks for local paths, debug panels, personal data, failed diagnostics, and private lab names
- [x] 14.5 Add an artifact allowlist for npm pack contents and Grafana plugin zip contents
- [x] 14.6 Add CI wiring so artifact autopsy runs before publishing, release upload, or public readiness claim

## 15. Dependency And Supply Chain

- [x] 15.1 Add npm dependency audit triage policy separating shipped, dev-only, toolchain, upstream/external, and accepted temporary risk
- [x] 15.2 Add a dependency-risk ledger and populate it with the current `dompurify`, Grafana package, `react-use`, `js-cookie`, and `esbuild` audit findings
- [x] 15.3 Fix or document every current npm advisory before claiming production-ready adoption
- [x] 15.4 Add Go vulnerability triage using `govulncheck` or documented equivalent for the Grafana backend
- [x] 15.5 Add package install dry runs for every public install command before it appears in README, MkDocs, Zensical, or package READMEs
- [x] 15.6 Add signed/unsigned Grafana plugin artifact status docs, checksum guidance, SBOM expectation, and version compatibility matrix
- [x] 15.7 Add CI guard that normal push and pull-request workflows validate but never publish npm packages or Grafana release artifacts
- [x] 15.8 Add `.github/dependabot.yml` for npm, GitHub Actions, Go modules, and Docker/container image ecosystems used by the repo
- [x] 15.9 Configure Dependabot or equivalent security update PR labels, grouping, schedule, reviewers/owners, and CI expectations
- [x] 15.10 Add CodeQL or equivalent static-analysis workflow for TypeScript/JavaScript and Go code
- [x] 15.11 Add secret scanning through GitHub-native settings, Gitleaks, TruffleHog, or an equivalent CI-enforced scanner
- [x] 15.12 Add container image scanning through Trivy, Grype, or an equivalent scanner for Grafana lab and Grafana Containerlab-mode images
- [x] 15.13 Add OSV/dependency vulnerability scanning or an equivalent cross-ecosystem check where npm audit and govulncheck do not cover the risk
- [x] 15.14 Add a scheduled security-health workflow/report that records last run, open findings, owners, and triage state
- [x] 15.15 Add docs explaining automated security monitoring coverage, limitations, and how maintainers triage generated security PRs
- [x] 15.16 Add CI/readiness checks that fail when Dependabot/security automation configuration is missing or does not cover a used ecosystem

## 16. Manual npm Publishing

- [x] 16.1 Decide the public npm package name and verify it matches README, MkDocs, Zensical, and package README install commands
- [x] 16.2 Document the first publish checklist: version, changelog or release note, `npm run ci`, package dry-run, artifact autopsy, and maintainer approval
- [x] 16.3 Define a manual publish path using either a local maintainer command or GitHub Actions `workflow_dispatch`
- [x] 16.4 Ensure the publish path is never triggered by a normal push, pull request, or docs deployment
- [x] 16.5 Document npm token, 2FA, provenance, access, dist-tag, rollback, and deprecation expectations
- [x] 16.6 Validate `npm pack --dry-run` or equivalent before any real publish
- [x] 16.7 Prefer a deliberate early dist-tag such as `next` until the stable public package contract is ready for `latest`
- [x] 16.8 Add an issue/release template for first public package feedback and support boundaries

## 17. Promotional Demo Video

- [ ] 17.1 Define the promotional storyboard for YAML to graph across harness, MkDocs, Zensical, and Grafana
- [ ] 17.2 Add `scripts/record-promo-demo.mjs` or equivalent Playwright recording command
- [ ] 17.3 Make the script fail clearly when docs preview, harness, or Grafana lab surfaces are not running
- [ ] 17.4 Record deterministic dark-mode video to `.artifacts/promo/` only as a temporary local review artifact
- [ ] 17.5 Capture a poster image suitable for README fallback and place the accepted checked-in copy under `docs/assets/`
- [ ] 17.6 Document the GitHub asset-hosting workflow using a dedicated media issue or equivalent durable host
- [ ] 17.7 Upload the reviewed video and capture the GitHub-hosted media URL
- [ ] 17.8 Embed the hosted video or compatible fallback in README using only a durable hosted URL or `docs/assets/` asset
- [ ] 17.9 Verify playback from the rendered GitHub README after push
- [ ] 17.10 Ensure public docs do not reference local `.artifacts` video paths
- [ ] 17.11 Add lint that fails if README, MkDocs, Zensical, or GitHub Pages content references `.artifacts/promo/`

## 18. Uncommon Hardening Drills

- [x] 18.1 Run a fake early-adopter drill from a clean checkout using only public docs and record every place source-code knowledge was required
- [x] 18.2 Run the same drill for a user who only wants React embedding
- [x] 18.3 Run the same drill for a user who only wants MkDocs/Zensical docs embedding
- [x] 18.4 Run the same drill for a user who wants Grafana mounted bundle telemetry overlays
- [x] 18.5 Add a support-burden simulation: list the first 20 likely GitHub issues from early adopters and add docs/tests to prevent the top 10
- [x] 18.6 Add a "docs contradiction" report comparing README, docs home, package READMEs, integration pages, and OpenSpec status words
- [x] 18.7 Add performance budgets for curated examples and dense examples: first render time, interaction latency, memory ceiling, and screenshot stability
- [x] 18.8 Add a pre-release "red team" checklist that intentionally tries to break install, docs, embeds, mapper authoring, Grafana bundles, and hostile content handling

## 19. CI And Command Ergonomics

- [x] 19.1 Add or simplify npm scripts so public checks have obvious names and Node 24 enforcement
- [x] 19.2 Add `npm run ci:public-readiness` or equivalent to run docs lint, leak checks, package dry-run, representative parity, hostile corpus, artifact autopsy, and dependency triage
- [x] 19.3 Ensure GitHub CI uses the same scripts as local development, with no hidden workflow-only command path
- [x] 19.4 Add clear failure messages for docs preview, Zensical preview, harness, Grafana lab, and Grafana Containerlab-mode preconditions
- [x] 19.5 Add workflow summary output for public-readiness failures so remote CI is not harder to debug than local CI
- [x] 19.6 Keep expensive Grafana Containerlab-mode checks out of default PR CI unless explicitly labeled or manually triggered

## 20. Enterprise Trust And Governance

- [x] 20.1 Add or update `SECURITY.md` with vulnerability reporting path, supported scope, disclosure expectations, and response workflow
- [x] 20.2 Add or update `SUPPORT.md` with supported surfaces, best-effort surfaces, lab-only surfaces, unsupported internals, and no promised SLA
- [x] 20.3 Add or update `CONTRIBUTING.md` with setup, review expectations, coding standards, docs standards, test expectations, and conventional commit guidance
- [x] 20.4 Add issue templates for bug report, security-safe bug report pointer, feature request, docs issue, integration issue, and performance regression
- [x] 20.5 Add `CODEOWNERS` or an equivalent ownership document for core renderer, docs, harness, Grafana plugin, schemas, and release workflows
- [x] 20.6 Add a maintainer decision log or ADR index for public contract decisions such as schema, style keys, mapper, release, and integration boundaries
- [x] 20.7 Document project support boundaries without implying enterprise SLA or paid support
- [x] 20.8 Add repository hygiene checks for missing governance files before public readiness can pass

## 21. Compatibility, SemVer, And API Ownership

- [x] 21.1 Define SemVer policy for npm package, YAML schema, stylesheet keys, mapper schema, docs embed blocks, and Grafana plugin options
- [x] 21.2 Add a public/internal API boundary document for React exports, core compiler helpers, style metadata, schemas, harness internals, docs plugins, and Grafana APIs
- [x] 21.3 Add schema versioning and migration guidance for topology, stylesheet, attention, mapper, and layout documents
- [x] 21.4 Add backwards-compatibility fixtures from previously documented YAML examples and archived examples
- [x] 21.5 Add compatibility tests proving old YAML either renders compatibly or fails with explicit migration diagnostics
- [x] 21.6 Add TypeScript API report or equivalent exported-surface check for the public package
- [x] 21.7 Add docs embed API compatibility checks for MkDocs/Zensical block options
- [x] 21.8 Add Grafana panel option compatibility checks and dashboard migration notes
- [x] 21.9 Add changelog, release note, deprecation, and migration documentation requirements to the release checklist
- [x] 21.10 Add a compatibility matrix for Node, React, React Flow, Grafana, browser engines, MkDocs, Zensical, and operating systems

## 22. Performance, Reliability, And Accessibility

- [x] 22.1 Define performance tiers for tiny, curated, dense, and stress topologies with node/link counts and expected use cases
- [ ] 22.2 Add benchmark scenarios for first render, zoom/pan, selection, attention focus, layout, mapper overlays, docs embeds, harness, and Grafana panel refresh
- [x] 22.3 Define budgets for first render time, interaction latency, memory, screenshot stability, and maximum supported default topology size
- [x] 22.4 Add benchmark output artifacts or summaries that can be published in docs without local paths
- [x] 22.5 Add reliability tests for bad YAML, bad stylesheet, missing assets, unsupported style keys, bad mapper, missing telemetry, and renderer-limit failures
- [x] 22.6 Add error-boundary and diagnostic behavior docs for React, MkDocs, Zensical, harness, and Grafana
- [x] 22.7 Define keyboard and focus behavior for supported controls in docs embeds, React runtime, harness, and Grafana
- [ ] 22.8 Add accessibility checks for focus visibility, color contrast, non-color status cues, text legibility, reduced motion, and keyboard escape behavior
- [x] 22.9 Add accessibility posture docs that state what is supported now, what is best-effort, and what is not yet accessible
- [x] 22.10 Add telemetry/privacy docs for local storage, session state, Grafana panel state, mapper labels, and screenshots/videos

## 23. Architecture And Threat Model

- [x] 23.1 Add architecture overview showing compiler, schema validation, stylesheet resolution, renderer, style metadata, docs embeds, harness, Grafana plugin, and mounted-bundle data flow
- [x] 23.2 Add public/internal module boundary diagram and list
- [x] 23.3 Add threat model for YAML, SVG, Markdown-derived HTML, labels, image references, mapper templates, telemetry labels, docs embed options, local storage, and Grafana mounted files
- [x] 23.4 Link threat-model risks to hostile corpus tests, mounted-bundle backend tests, artifact autopsy, and dependency triage
- [x] 23.5 Add a "why not build internally" page explaining compounding value: schema, stylesheet, docs embeds, harness, mapper, examples, and operational integrations
- [x] 23.6 Add design-review checklist for new public API, style key, schema field, mapper capability, docs embed option, or integration surface

## 24. Validation

- [x] 24.1 Run `npm run sync:docs`
- [x] 24.2 Run docs lint and docs build
- [ ] 24.3 Run representative Playwright checks for curated examples
- [ ] 24.4 Run mapper authoring harness tests
- [ ] 24.5 Run TopoViewer object-attribute reference drift checks against schemas, TypeScript types, style metadata, mapper metadata, and YAML assist metadata
- [ ] 24.6 Run a Grafana smoke using a harness-authored `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml` bundle with no catalog edits or fixture sync
- [x] 24.7 Run package dry-run validation
- [ ] 24.8 Run hostile-input and mounted-bundle abuse tests
- [x] 24.9 Run artifact autopsy checks
- [x] 24.10 Run npm and Go dependency triage checks
- [ ] 24.11 Run promotional video generation command
- [ ] 24.12 Run compatibility/API report checks
- [ ] 24.13 Run performance and accessibility checks
- [x] 24.14 Run governance-file and support-boundary checks
- [ ] 24.15 Run architecture/threat-model traceability checks
- [ ] 24.16 Run automated security monitoring checks: Dependabot coverage, CodeQL/static analysis, secret scanning, container scanning, npm audit, Go vulnerability scanning, and security-health reporting
- [ ] 24.17 Run full `npm run ci`
- [ ] 24.18 Review the generated MkDocs and Zensical sites locally
- [ ] 24.19 Verify README video playback on GitHub after push
- [ ] 24.20 Review `spec-traceability.md` and verify every `spec.md` requirement has completed evidence, named deferral, or accepted-risk owner
- [ ] 24.21 Review `audit-traceability.md` and verify every `audit.md` finding has completed evidence, named deferral, or accepted-risk owner
- [ ] 24.22 Produce the final public adoption readiness report from task 0.6
- [ ] 24.23 Archive this change only after every spec requirement and audit finding is implemented, deferred to a named follow-up OpenSpec, or accepted with an explicit risk owner
