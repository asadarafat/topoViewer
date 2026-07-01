# Phase 4 Workflow Dry-Run Evidence

Date: 2026-07-01

## Push

Pushed branch:

```text
development
```

Pushed commit:

```text
1548bc98c071b09ce9baec89a7ae730498c0ad0d
```

## PyPI Dry-Run Dispatch

Command:

```bash
gh workflow run pypi-publish.yml \
  --repo asadarafat/topoviewer \
  --ref development \
  -f version=0.1.0 \
  -F dry_run=true
```

Workflow run:

```text
https://github.com/asadarafat/topoviewer/actions/runs/28538858872
```

Result:

```text
Manual PyPI Publish completed successfully.
```

Completed proof points:

- verified `packages/mkdocs-topoviewer/pyproject.toml` version `0.1.0`;
- checked production PyPI and found `mkdocs-topoviewer==0.1.0` unpublished;
- skipped immutable-version rejection because this was a dry-run;
- ran `npm run ci:build`;
- built wheel and sdist;
- inspected wheel and sdist;
- installed the built wheel and imported `mkdocs_topoviewer.plugin:TopoViewerPlugin`;
- uploaded Python package artifacts as workflow artifacts;
- stopped before upload because `dry_run=true`.

Skipped by design:

- real PyPI upload through Trusted Publishing/OIDC.

## Push-Triggered Workflow Follow-Up

The push-triggered Docs workflow initially failed after the new dist path moved
from `.artifacts/wheels` to `.artifacts/mkdocs-dist`. The failing step still
installed `.artifacts/wheels/*.whl`.

Fix:

```text
.github/workflows/docs.yml now installs .artifacts/mkdocs-dist/*.whl
```

Local validation:

```text
npm run wheel:mkdocs
python venv install from .artifacts/mkdocs-dist/*.whl
import mkdocs_topoviewer.plugin:TopoViewerPlugin
```
