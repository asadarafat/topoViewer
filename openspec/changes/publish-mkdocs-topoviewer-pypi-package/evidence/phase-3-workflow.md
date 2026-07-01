# Phase 3 Workflow Evidence

Date: 2026-07-01

## Workflow

Added workflow:

```text
.github/workflows/pypi-publish.yml
```

The workflow is intentionally manual and does not publish on every push.

## Dispatch Inputs

| Input | Purpose |
| --- | --- |
| `version` | Must match `packages/mkdocs-topoviewer/pyproject.toml`. |
| `dry_run` | Defaults to `true`; validates without uploading to PyPI. |

## Release Gates

The workflow:

- runs on Node.js 24 and Python 3.12;
- verifies package name, requested version, and MkDocs plugin entry point;
- checks whether the requested PyPI version already exists;
- rejects real publish for an immutable already-published version;
- runs `npm run ci:build` so vendored MkDocs assets are current;
- runs `npm run dist:mkdocs`;
- runs `npm run inspect:mkdocs`;
- installs the built wheel in an isolated smoke venv and imports
  `mkdocs_topoviewer.plugin:TopoViewerPlugin`;
- uploads wheel and sdist as workflow artifacts;
- stops before upload when `dry_run=true`.

## Trusted Publishing Setup

Real publish uses PyPI Trusted Publishing through GitHub OIDC:

| PyPI setting | Value |
| --- | --- |
| PyPI project | `mkdocs-topoviewer` |
| GitHub repository | `asadarafat/topoviewer` |
| Workflow file | `pypi-publish.yml` |
| Environment | `pypi-publish` |

No `PYPI_TOKEN` repository secret is required or expected. The next step is to
commit and push this workflow, dispatch it with `dry_run=true`, and record the
workflow URL before configuring or using real PyPI publication.
