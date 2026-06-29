## 1. Audit And Taxonomy

- [ ] 1.1 Inventory current public pages, package READMEs, nav entries, examples, labs, and maintainer docs
- [ ] 1.2 Classify every major public surface as Supported, Experimental, Lab, Roadmap, or Maintainer
- [ ] 1.3 Identify stale status wording, especially Grafana, VS Code, Zensical, NetBox, and OpsMill/Infrahub
- [ ] 1.4 Identify pages that are too long for guide usage and should be split or demoted to reference
- [ ] 1.5 Identify generated test-catalog wording that should not appear in curated public examples

## 2. Public Information Architecture

- [ ] 2.1 Refactor MkDocs nav into Start, Author, Embed, Examples, Reference, Labs, and Maintainers
- [ ] 2.2 Regenerate Zensical nav from the same public IA without an extra duplicate top-level Zensical section
- [ ] 2.3 Move Monorepo, Release, Documentation Standard, and Production Hardening under Maintainers
- [ ] 2.4 Keep generated exhaustive reference/test catalog available but out of the primary learning path
- [ ] 2.5 Update docs home to route users by job: author, embed, operate, reference, maintain

## 3. README And First-Run Story

- [ ] 3.1 Refactor README first screen around the stable core promise
- [ ] 3.2 Add the smallest useful topology/style YAML snippets or a direct link to the first topology page
- [ ] 3.3 Add a concise support-status table for core package and integrations
- [ ] 3.4 Keep monorepo internals and roadmap details out of the README body
- [ ] 3.5 Verify all public URLs use the lowercase `/topoviewer/` route

## 4. Curated Examples

- [ ] 4.1 Create or promote a curated Examples landing page before the generated catalog
- [ ] 4.2 Include basic graph, CLOS fabric, real network, node styling, edge styling, and attention examples
- [ ] 4.3 For each curated example, explain what to copy, what it renders, and which YAML fields matter
- [ ] 4.4 Keep live viewport, topology YAML, stylesheet YAML, and attention YAML tabs where relevant
- [ ] 4.5 Ensure examples use production-grade icon sizing, label placement, edge attachment, and color choices

## 5. Promotional Demo Video

- [ ] 5.1 Define the promotional storyboard for YAML to graph across harness, MkDocs, Zensical, and Grafana
- [ ] 5.2 Add `scripts/record-promo-demo.mjs` or equivalent Playwright recording command
- [ ] 5.3 Make the script fail clearly when docs preview or Grafana lab surfaces are not running
- [ ] 5.4 Record deterministic dark-mode video under `.artifacts/promo/`
- [ ] 5.5 Capture a poster image suitable for README fallback
- [ ] 5.6 Document the GitHub asset-hosting workflow using a dedicated media issue or equivalent durable host
- [ ] 5.7 Upload the reviewed video and capture the GitHub-hosted media URL
- [ ] 5.8 Embed the hosted video or compatible fallback in README
- [ ] 5.9 Verify playback from the rendered GitHub README after push
- [ ] 5.10 Ensure public docs do not reference local `.artifacts` video paths

## 6. Guide And Reference Split

- [ ] 6.1 Split oversized authoring material into task-oriented guide pages and model reference pages
- [ ] 6.2 Keep Stylesheet guide practical at the top and full key table in reference section
- [ ] 6.3 Split Attention into quick use cases, topology declaration, API, and reference sections
- [ ] 6.4 Keep React page focused on embedding and move exhaustive API detail to TypeScript API reference
- [ ] 6.5 Add clear "next step" links at the end of major guide pages

## 7. Differentiation And Stability

- [ ] 7.1 Add factual "Why not Mermaid.js?" comparison
- [ ] 7.2 Add factual "Why not raw React Flow?" comparison
- [ ] 7.3 Add static image/SVG workflow comparison without naming unrelated projects unnecessarily
- [ ] 7.4 Mark stable, experimental, and internal YAML/style/API surfaces where users make dependency decisions
- [ ] 7.5 Align schema docs, stylesheet docs, YAML assist metadata, and TypeScript API docs

## 8. Quality Gates

- [ ] 8.1 Add docs lint for support-status labels on integration pages and package READMEs
- [ ] 8.2 Add docs lint for unexpected primary-nav categories and maintainer-page placement
- [ ] 8.3 Add link checks for published GitHub Pages paths and repo slug consistency
- [ ] 8.4 Add drift checks between README, docs home, and shared product fragments
- [ ] 8.5 Add representative visual parity checks for curated examples across harness, MkDocs, and Zensical
- [ ] 8.6 Add a promo-video smoke check that verifies README uses a hosted URL, not a local artifact path

## 9. Validation

- [ ] 9.1 Run `npm run sync:docs`
- [ ] 9.2 Run docs lint and docs build
- [ ] 9.3 Run representative Playwright checks for curated examples
- [ ] 9.4 Run promotional video generation command
- [ ] 9.5 Run full `npm run ci`
- [ ] 9.6 Review the generated MkDocs and Zensical sites locally
- [ ] 9.7 Verify README video playback on GitHub after push
- [ ] 9.8 Archive this change only after public IA, README, curated examples, promotional video, and quality gates are implemented
