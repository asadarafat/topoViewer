# Phase 5 Trusted Publishing Setup Evidence

Date: 2026-07-01

## Current State

The GitHub side is ready for PyPI Trusted Publishing:

| Field | Value |
| --- | --- |
| Repository | `asadarafat/topoviewer` |
| Branch used for dry-run | `development` |
| Workflow file | `pypi-publish.yml` |
| GitHub environment | `pypi-publish` |
| Workflow permission | `id-token: write` |
| Publish action | `pypa/gh-action-pypi-publish@release/v1` |
| Artifact directory | `.artifacts/mkdocs-dist` |

GitHub environment verification:

```text
name: pypi-publish
url: https://github.com/asadarafat/topoviewer/deployments/activity_log?environments_filter=pypi-publish
created_at: 2026-07-01T18:24:14Z
```

PyPI project state:

```bash
curl -sS -o /tmp/mkdocs-topoviewer-pypi-project.json -w '%{http_code}\n' \
  https://pypi.org/pypi/mkdocs-topoviewer/json
```

Observed result:

```text
404
```

So `mkdocs-topoviewer` still needs a PyPI pending publisher before the first
real publish.

## Required PyPI Pending Publisher

Because `mkdocs-topoviewer` does not exist on PyPI yet, configure a **pending
publisher** from the PyPI account publishing page.

Use these values:

| PyPI pending publisher field | Value |
| --- | --- |
| PyPI project name | `mkdocs-topoviewer` |
| Owner | `asadarafat` |
| Repository name | `topoviewer` |
| Workflow filename | `pypi-publish.yml` |
| Environment name | `pypi-publish` |

Do not create or store a `PYPI_TOKEN` GitHub secret. The workflow uses OIDC and
the PyPA publish action.

## Manual Owner Action

Owner action still required:

1. Open <https://pypi.org/manage/account/publishing/>.
2. Choose GitHub Actions as the trusted publisher.
3. Add the pending publisher using the values above.
4. Confirm the pending publisher appears in the account publishing page.

After that, Phase 6 can dispatch:

```bash
gh workflow run pypi-publish.yml \
  --repo asadarafat/topoviewer \
  --ref development \
  -f version=0.1.0 \
  -F dry_run=false
```

The first successful publish will create the PyPI project and convert the
pending publisher into a normal trusted publisher.

## Source Notes

PyPI documents Trusted Publishing as OIDC-based publishing that avoids
long-lived API tokens. For packages that do not exist yet, PyPI supports a
pending publisher that creates the project on first successful use; the pending
publisher does not reserve the project name before that publish.
