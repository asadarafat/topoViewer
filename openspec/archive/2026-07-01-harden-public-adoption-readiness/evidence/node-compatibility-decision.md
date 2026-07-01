# Node Compatibility Decision

Decision date: 2026-07-01

Decision: keep Node.js 24 LTS as the `0.1.0` package and repository boundary.

Rationale:

- The repo already uses Node 24 consistently for local CI parity and GitHub
  Actions.
- The root and `topoviewer` package both declare `>=24 <25`.
- The package is still pre-1.0, so avoiding a multi-Node support matrix keeps
  early-adopter validation smaller and more honest.
- Browser runtime behavior is still the product value; Node support here covers
  installation, bundling, docs, harness, and integration tooling.

Accepted risk:

- Some enterprise users on Node 20 or 22 may defer adoption.
- This should be revisited before a stable-core `1.0.0` release or if early
  adopters report Node-version friction.

Documentation:

- `packages/topoviewer/content/pages/reference/compatibility.md` now explains
  that Node 24 is intentional for `0.1.0` and that broader Node 20/22/24 support
  is not currently claimed.

