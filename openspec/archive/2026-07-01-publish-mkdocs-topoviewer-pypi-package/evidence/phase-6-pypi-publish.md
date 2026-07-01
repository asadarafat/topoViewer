# Phase 6 PyPI Publish Evidence

Date: 2026-07-01

## Workflow

Real publish workflow:

```text
https://github.com/asadarafat/topoviewer/actions/runs/28545559951
```

Workflow result:

```text
status: completed
conclusion: success
branch: development
commit: b3662b148d2518d565901d0aaed6b5c31ae760e9
created_at: 2026-07-01T20:25:44Z
updated_at: 2026-07-01T20:29:25Z
```

The workflow completed:

- requested version verification;
- PyPI version availability check;
- package and MkDocs asset build;
- wheel and sdist build;
- artifact inspection;
- built wheel import validation;
- artifact upload to GitHub Actions;
- PyPI upload through Trusted Publishing/OIDC.

## PyPI Project

Package URL:

```text
https://pypi.org/project/mkdocs-topoviewer/0.1.0/
```

PyPI JSON checks:

```text
https://pypi.org/pypi/mkdocs-topoviewer/json -> 200 mkdocs-topoviewer 0.1.0
https://pypi.org/pypi/mkdocs-topoviewer/0.1.0/json -> 200 mkdocs-topoviewer 0.1.0
```

`pip index` check:

```text
mkdocs-topoviewer (0.1.0)
Available versions: 0.1.0
```

## Published Artifacts

```text
mkdocs_topoviewer-0.1.0-py3-none-any.whl
  package_type: bdist_wheel
  python_version: py3
  size: 216218
  sha256: 4efdfadebe0489b0a94de621e88cb6d9370ef46a4b109091407c252d7ad36db6
  url: https://files.pythonhosted.org/packages/6a/c4/32426b02c7a2d206e5857c0851f194e6f856c64f61c3c6e885ccbf1c0039/mkdocs_topoviewer-0.1.0-py3-none-any.whl

mkdocs_topoviewer-0.1.0.tar.gz
  package_type: sdist
  python_version: source
  size: 214334
  sha256: 50790188d88128480e5467b5ed1193497e57c1224f5799bb54ec6949c9ed3b00
  url: https://files.pythonhosted.org/packages/26/56/aa3b6ea51915fdc79fd5aee3497f63439bc945f01af088db3421ed0df8b4/mkdocs_topoviewer-0.1.0.tar.gz
```

## Notes

The first attempted real publish was cancelled before upload because the PyPI
pending publisher was configured for pending project `topoviewer` instead of
`mkdocs-topoviewer`.

Cancelled run:

```text
https://github.com/asadarafat/topoviewer/actions/runs/28545296676
```

After the pending publisher was corrected to `mkdocs-topoviewer`, the real
publish succeeded through PyPI Trusted Publishing/OIDC.

## Immutable Version Guard

The publish workflow checks the production PyPI JSON endpoint before upload:

```text
https://pypi.org/pypi/mkdocs-topoviewer/{version}/json
```

For real publishes, the workflow rejects before build/upload when PyPI reports
the requested version is already present:

```yaml
if: ${{ inputs.dry_run == false && steps.pypi_version.outputs.published == 'true' }}
```

`mkdocs-topoviewer==0.1.0` is now present on production PyPI, so a second real
publish for `0.1.0` would hit that rejection path. This was verified by
workflow inspection and production PyPI version lookup rather than by creating
an intentionally failed release run.
