#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_DIR="$ROOT_DIR/packages/mkdocs-topoviewer"
DIST_DIR="$ROOT_DIR/.artifacts/mkdocs-dist"
VENV_DIR="$ROOT_DIR/.artifacts/mkdocs-build-venv"

rm -rf \
  "$DIST_DIR" \
  "$PACKAGE_DIR/build" \
  "$PACKAGE_DIR"/*.egg-info \
  "$PACKAGE_DIR/mkdocs_topoviewer.egg-info" \
  "$PACKAGE_DIR/mkdocs_topoviewer/__pycache__"

mkdir -p "$DIST_DIR"

if [[ ! -x "$VENV_DIR/bin/python" ]]; then
  python3 -m venv "$VENV_DIR"
fi

"$VENV_DIR/bin/python" -m pip install --quiet --upgrade pip build twine
"$VENV_DIR/bin/python" -m build "$PACKAGE_DIR" --sdist --wheel --outdir "$DIST_DIR"
"$VENV_DIR/bin/python" -m twine check "$DIST_DIR"/*
