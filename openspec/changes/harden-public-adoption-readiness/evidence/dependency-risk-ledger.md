# Dependency Risk Ledger

Audit date: 2026-06-30

This ledger records the current dependency/security baseline for public adoption
readiness. It is not a fix record. It makes the current risk visible so the repo
does not accidentally claim production readiness while dependency advisories are
known and unresolved.

## Commands

```bash
npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=moderate
cd packages/grafana-topoviewer-panel && go test ./...
```

## Results

| Command | Result | Summary |
| --- | --- | --- |
| `npm audit --omit=dev --audit-level=moderate` | Failed | 1 moderate advisory affecting `dompurify`. |
| `npm audit --audit-level=moderate` | Failed | 7 advisories: `dompurify`, Grafana transitive dependencies, `react-use`, `js-cookie`, and `esbuild`. |
| `go test ./...` under `packages/grafana-topoviewer-panel` | Passed | `pkg/plugin` tests passed; root `pkg` has no tests. |

## npm Production Advisory

| Package | Severity | Source | Current Disposition |
| --- | --- | --- | --- |
| `dompurify <=3.4.10` | Moderate | Direct production dependency | Needs upgrade and hostile-content regression review before any production-ready claim. |

The production audit reports:

- `DOMPurify: Permanent ALLOWED_ATTR pollution via setConfig() bypassing the hook clone-guard`

## Full npm Audit Advisories

| Package / Chain | Severity | Source | Current Disposition |
| --- | --- | --- | --- |
| `dompurify <=3.4.10` | Moderate/high set across advisories | Direct and Grafana transitive dependency | Needs coordinated upgrade review. Direct package can likely move first; Grafana transitive copy may depend on Grafana package compatibility. |
| `@grafana/data`, `@grafana/runtime`, `@grafana/ui` | High transitive chain | Grafana plugin dependencies | `npm audit fix --force` proposes a breaking downgrade/upgrade path. Requires Grafana plugin compatibility testing, not blind fix. |
| `react-use -> js-cookie <=3.0.5` | High | Transitive through Grafana packages | Requires Grafana package compatibility review. |
| `esbuild 0.27.3 - 0.28.0` | Low | Tooling/dev-server path | Lower shipped-runtime risk, but still needs upgrade or accepted-risk note because dev server exposure matters for public contributors. |

## Required Follow-Up

- Upgrade direct `dompurify` and add hostile SVG/HTML regression cases before
  claiming renderer hardening.
- Triage Grafana dependency versions against the pinned Grafana plugin toolchain
  and runtime compatibility matrix.
- Decide whether transitive Grafana advisories are shipped runtime risk,
  developer-tooling risk, or accepted temporary upstream risk.
- Upgrade `esbuild` if compatible, or document why the dev-server advisory is
  acceptable for local-only use.
- Keep this ledger current whenever `package-lock.json`, Grafana packages, or
  sanitizer behavior changes.

## Production Claim Impact

Current state is not sufficient for a production-ready public adoption claim.
The repo can continue improving adoption ergonomics, but release notes and
README language must avoid implying that all dependency advisories are cleared.
