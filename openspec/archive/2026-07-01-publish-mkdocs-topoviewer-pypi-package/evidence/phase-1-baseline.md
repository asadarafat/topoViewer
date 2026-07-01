# Phase 1 Baseline Evidence

Date: 2026-07-01

## PyPI Availability

Command:

```bash
python3 -m pip index versions mkdocs-topoviewer
```

Observed result:

```text
ERROR: No matching distribution found for mkdocs-topoviewer
```

Version-specific registry probe:

```bash
curl -sS -o /tmp/mkdocs-topoviewer-pypi-0.1.0.json -w '%{http_code}\n' \
  https://pypi.org/pypi/mkdocs-topoviewer/0.1.0/json
```

Observed result:

```text
404
```

## Naming Contract

| Surface | Name | Status |
| --- | --- | --- |
| npm distribution | `topoviewer` | unchanged |
| PyPI distribution | `mkdocs-topoviewer` | reserved for the MkDocs adapter |
| Python import package | `mkdocs_topoviewer` | unchanged |
| MkDocs plugin key | `topoviewer` | unchanged |

## Public Docs Guardrail

Command:

```bash
npm run install:check
```

Observed result:

```text
install dry-run passed for local release tarball command:
npm install /tmp/topoviewer-pack/topoviewer-0.1.0.tgz @xyflow/react react react-dom
```

This confirms public user-facing docs still do not advertise
`pip install mkdocs-topoviewer` as a live path before PyPI publication, while
maintainer/package docs can discuss the target package name.
