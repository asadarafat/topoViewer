# Phase 2 Local Artifact Evidence

Date: 2026-07-01

## Build Command

Command:

```bash
npm run dist:mkdocs
```

Observed result:

```text
Successfully built mkdocs_topoviewer-0.1.0.tar.gz and mkdocs_topoviewer-0.1.0-py3-none-any.whl
Checking ... mkdocs_topoviewer-0.1.0-py3-none-any.whl: PASSED
Checking ... mkdocs_topoviewer-0.1.0.tar.gz: PASSED
```

The build command creates an isolated virtual environment under
`.artifacts/mkdocs-build-venv`, installs Python build tooling there, cleans
stale generated package files, and writes artifacts to `.artifacts/mkdocs-dist`.

## Artifact Inspection

Command:

```bash
npm run inspect:mkdocs
```

Observed result:

```text
wheel inspection passed: mkdocs_topoviewer-0.1.0-py3-none-any.whl (10 files)
sdist inspection passed: mkdocs_topoviewer-0.1.0.tar.gz (11 files)
```

The inspector validates:

- package metadata: name, version, license, Python requirement, dependencies,
  project URLs, and MkDocs entry point;
- vendored TopoViewer embed assets;
- wheel and sdist presence;
- absence of `build/`, `.egg-info/`, `__pycache__/`, and `.pyc` files in the
  produced artifacts.

## Artifact Names

```text
mkdocs_topoviewer-0.1.0-py3-none-any.whl
mkdocs_topoviewer-0.1.0.tar.gz
```

## Artifact Hashes

```text
4efdfadebe0489b0a94de621e88cb6d9370ef46a4b109091407c252d7ad36db6  mkdocs_topoviewer-0.1.0-py3-none-any.whl
50790188d88128480e5467b5ed1193497e57c1224f5799bb54ec6949c9ed3b00  mkdocs_topoviewer-0.1.0.tar.gz
```

## CI Lane Validation

Command:

```bash
npm run ci:build
npm run ci:package
```

Observed result:

```text
ci:build passed.
ci:package passed, including npm package artifact checks, Grafana plugin
artifact checks, MkDocs wheel+sdist build, and MkDocs artifact inspection.
```

## Local Wheel Import Smoke

Command:

```bash
python3 -m venv .artifacts/pypi-wheel-smoke-local
.artifacts/pypi-wheel-smoke-local/bin/python -m pip install .artifacts/mkdocs-dist/*.whl
.artifacts/pypi-wheel-smoke-local/bin/python - <<'PY'
from mkdocs_topoviewer.plugin import TopoViewerPlugin
if TopoViewerPlugin.__name__ != 'TopoViewerPlugin':
    raise SystemExit('TopoViewerPlugin import smoke failed')
print('mkdocs_topoviewer import smoke passed')
PY
```

Observed result:

```text
mkdocs_topoviewer import smoke passed
```
