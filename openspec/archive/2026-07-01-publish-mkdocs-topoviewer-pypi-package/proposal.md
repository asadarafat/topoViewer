## Why

The public adoption readiness change made the npm install path real, but it
intentionally left the MkDocs Python package in a guarded state:

```bash
pip install mkdocs-topoviewer
```

still fails because `mkdocs-topoviewer` is not published on PyPI yet. Public
docs therefore cannot honestly present MkDocs as a normal installable surface.

This change closes that missing readiness gap without changing the package
boundary:

- npm package: `topoviewer`
- PyPI distribution: `mkdocs-topoviewer`
- Python import package: `mkdocs_topoviewer`
- MkDocs plugin key: `topoviewer`

The underscore import package is intentional because Python modules cannot use
hyphenated names. The user-facing PyPI distribution remains
`mkdocs-topoviewer`.

## What Changes

Make the MkDocs adapter publishable and verifiably installable:

- add a manual PyPI publish workflow for `mkdocs-topoviewer`;
- use PyPI Trusted Publishing/OIDC rather than storing PyPI tokens in the repo
  or GitHub secrets;
- add preflight gates for version matching, artifact build, wheel/sdist
  inspection, and metadata validation;
- add a clean-environment install smoke for `pip install mkdocs-topoviewer`;
- publish `mkdocs-topoviewer==0.1.0` after the local and workflow dry-runs pass;
- switch public MkDocs docs from local editable install guidance to the verified
  PyPI install command only after the package is live;
- update guardrails so docs cannot drift back to unpublished or local-only
  install flows.

## Capabilities

### New Capabilities

- `mkdocs-python-install-path`: public MkDocs users can install the adapter from
  PyPI and use the `topoviewer` MkDocs plugin without cloning this repository or
  running npm.

## Continuation From Public Readiness

This is a continuation of:

```text
openspec/archive/2026-07-01-harden-public-adoption-readiness/
```

That archived change recorded the missing PyPI package in:

```text
evidence/mkdocs-python-package-decision.md
```

The archived readiness decision was correct at the time: do not advertise
`pip install mkdocs-topoviewer` before the package exists. This change provides
the implementation path that lets the docs safely advertise it.

## Impact

- `.github/workflows/pypi-publish.yml`
- `packages/mkdocs-topoviewer/pyproject.toml`
- `packages/mkdocs-topoviewer/README.md`
- `packages/topoviewer/content/pages/embed/mkdocs.md`
- generated docs under `docs/topoviewer/embed/mkdocs.md`
- release and monorepo maintainer docs
- install-command and release-artifact guardrails
- package inspection scripts and CI release lanes

## Non-Goals

- Do not rename the npm package.
- Do not publish a Python distribution named `topoviewer`.
- Do not require PyPI API tokens or checked-in credentials.
- Do not publish on every push.
- Do not make MkDocs depend on npm, Vite, React, or TypeScript at user build
  time.
- Do not merge `packages/topoviewer` and `packages/mkdocs-topoviewer`.
