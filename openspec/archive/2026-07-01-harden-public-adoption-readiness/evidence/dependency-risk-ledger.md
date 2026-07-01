# Dependency Risk Ledger

Audit date: 2026-06-30

This ledger records the current dependency/security baseline for public adoption
readiness. It separates shipped runtime risk from dev/tooling and experimental
integration risk so the repo does not accidentally claim production readiness
while advisories are known and unresolved.

## Commands

```bash
npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=moderate
npm run dependency:advisories
cd packages/grafana-topoviewer-panel && go test ./...
```

## Results

| Command | Result | Summary |
| --- | --- | --- |
| `npm audit --omit=dev --audit-level=moderate` | Passed | 0 production dependency advisories. |
| `npm audit --audit-level=moderate` | Failed | 6 advisories, all through Grafana plugin SDK transitive/dev paths. |
| `npm run dependency:advisories` | Passed | Production audit is clean; full-audit findings match documented temporary Grafana transitive risk paths. |
| `go test ./...` under `packages/grafana-topoviewer-panel` | Passed | `pkg/plugin` tests passed; root `pkg` has no tests. |

## npm Production Advisory Status

No current production dependency advisory is reported by
`npm audit --omit=dev --audit-level=moderate`.

The prior direct `dompurify <=3.4.10` advisory has been remediated by updating
the direct dependency path to `dompurify@3.4.11` through `package-lock.json`.

## Full npm Audit Advisories

| Package / Chain | Severity | Source | Current Disposition |
| --- | --- | --- | --- |
| `dompurify <=3.4.10` | Moderate | Nested under `@grafana/data` at `node_modules/@grafana/data/node_modules/dompurify` | Accepted temporary dev/plugin-SDK risk. Direct TopoViewer runtime copy is fixed. Needs Grafana-compatible package upgrade review before supported Grafana release claim. |
| `@grafana/data`, `@grafana/runtime`, `@grafana/ui` | High transitive chain | Grafana plugin SDK dependencies | Accepted temporary experimental integration risk. `npm audit fix --force` proposes `@grafana/*@11.4.8`, which conflicts with the pinned Grafana 13.1.0 test target and must not be applied blindly. |
| `react-use -> js-cookie <=3.0.5` | High | Transitive through Grafana packages | Accepted temporary experimental integration risk pending Grafana package compatibility review. |
| `esbuild 0.27.3 - 0.28.0` | Low | Tooling/dev-server path | Remediated by updating `vscode-topoviewer` direct dev dependency and lockfile to `esbuild@0.28.1`. |

The accepted temporary advisories are enforced by
`scripts/check-dependency-advisories.mjs`: new package names or unexpected
vulnerable install paths fail CI.

## Required Follow-Up

- Triage Grafana dependency versions against the pinned Grafana plugin toolchain
  and runtime compatibility matrix.
- Decide whether transitive Grafana advisories are shipped runtime risk,
  developer-tooling risk, or accepted temporary upstream risk.
- Add hostile SVG/HTML regression cases before claiming renderer hardening.
- Keep `scripts/check-dependency-advisories.mjs` aligned with this ledger so
  accepted temporary risks stay explicit and reviewable.
- Keep this ledger current whenever `package-lock.json`, Grafana packages, or
  sanitizer behavior changes.

## Production Claim Impact

Current state is improved but still not sufficient for a broad production-ready
public adoption claim. The core npm package has a clean production dependency
audit, but the experimental Grafana integration still carries documented
transitive advisories through its pinned SDK dependency set.
