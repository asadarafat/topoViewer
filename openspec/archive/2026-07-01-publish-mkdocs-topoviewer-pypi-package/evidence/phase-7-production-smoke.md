# Phase 7 Production PyPI Smoke Evidence

Date: 2026-07-01

## Clean Import Smoke

Command shape:

```bash
tmpdir=$(mktemp -d)
python3 -m venv "$tmpdir/venv"
"$tmpdir/venv/bin/python" -m pip install --quiet --upgrade pip
"$tmpdir/venv/bin/python" -m pip install --quiet mkdocs-topoviewer
"$tmpdir/venv/bin/python" - <<'PY'
import importlib.metadata
from mkdocs_topoviewer.plugin import TopoViewerPlugin
print('version', importlib.metadata.version('mkdocs-topoviewer'))
print('plugin', TopoViewerPlugin.__name__)
PY
rm -rf "$tmpdir"
```

Observed output:

```text
version 0.1.0
plugin TopoViewerPlugin
```

## Clean MkDocs Site Smoke

Added script:

```text
scripts/smoke-mkdocs-pypi-install.py
```

Added command:

```bash
npm run install:check:mkdocs
```

The script creates a temporary virtualenv, installs
`mkdocs-topoviewer==0.1.0` from production PyPI, creates a minimal MkDocs site,
enables the `topoviewer` plugin, renders one fenced `topoviewer` block, and
asserts the generated site contains:

- the TopoViewer embed container;
- page-relative topology and stylesheet references;
- `assets/topoviewer/topoviewer-embed.css`;
- `assets/topoviewer/topoviewer-mkdocs.css`;
- `assets/topoviewer/topoviewer-embed.iife.js`.

Observed output:

```text
mkdocs-topoviewer==0.1.0 PyPI MkDocs smoke passed
```

This smoke does not require npm, the TopoViewer repository checkout, or a local
editable Python install inside the temporary MkDocs project.
