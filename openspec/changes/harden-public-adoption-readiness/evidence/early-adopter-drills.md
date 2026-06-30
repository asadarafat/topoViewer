# Early-Adopter Drill Report

Purpose: simulate the first adoption journeys using only public docs, README,
package READMEs, and documented commands. The goal is to identify where a user
would need source-code knowledge.

## Drill 1: Fresh Checkout General User

| Step | Public instruction used | Result | Source-code knowledge required |
|---|---|---|---|
| Clone | Root README first result | `git clone`, `npm ci`, `npm run docs:preview` are documented. | No |
| Open docs | README local URLs | MkDocs, Zensical, and harness URLs are documented under `/topoviewer/`. | No |
| Find first topology | README and docs home | Routes to First Topology and Browser Harness. | No |
| Understand support status | README support table and docs status labels | Major surfaces are labeled. | No |

Finding: this path is acceptable after package install status remains clearly
pre-publish until npm publication is real.

## Drill 2: React Embedding User

| Step | Public instruction used | Result | Source-code knowledge required |
|---|---|---|---|
| Check package status | README and React page | Package is labeled Pre-Publish Supported; users are warned before npm publish. | No |
| Embed component | React usage page | Props, diagnostics, SSR, loading, caching, and error handling are documented. | No |
| Check API ownership | TypeScript API and Compatibility pages | Export status and SemVer rules are visible. | No |
| Validate YAML | Validate YAML and Object Attributes pages | Schema and semantic lint path is documented. | No |

Finding: npm publication remains the adoption blocker. Manual publish tasks
cover this before a stable public claim.

## Drill 3: MkDocs/Zensical Docs Embedding User

| Step | Public instruction used | Result | Source-code knowledge required |
|---|---|---|---|
| Add MkDocs plugin | MkDocs page | Plugin install and fenced block are documented. | No |
| Use Zensical | Zensical page | Adapter model and same authored options are documented. | No |
| Check option compatibility | Compatibility page | Fenced-block options and default behavior are documented. | No |
| Debug rendering drift | Debug Rendering and Production pages | Render parity expectation is documented. | No |

Finding: docs embed adoption is viable, but visual parity screenshots remain a
release-readiness task.

## Drill 4: Grafana Mounted Bundle User

| Step | Public instruction used | Result | Source-code knowledge required |
|---|---|---|---|
| Author bundle | Browser Harness and Grafana pages | Topology/style/mapper bundle workflow is documented. | No for documented flow |
| Mount files | Grafana page | Canonical suffixes and Docker mount shape are documented. | No |
| Select bundle | Grafana page | Dynamic bundle selection and coverage concepts are documented. | No |
| Map telemetry | Grafana mapper reference | Attribute-level mapper docs and examples exist. | No |

Finding: the workflow is production-shaped, but harness mapper rule-builder UX
is still a major adoption gap and remains open in task 8.

## Remaining Source-Knowledge Leaks

| Leak | Status |
|---|---|
| Fixture sync vocabulary appears in maintainer/lab contexts | Acceptable when labeled demo/CI-only. |
| Full mapper authoring still benefits from knowing available topology IDs and style keys | Open harness mapper UX tasks. |
| Promo video workflow not yet available from README | Open promo video tasks. |
| Visual parity evidence is not yet attached to each curated example | Open curated screenshot/render parity tasks. |
