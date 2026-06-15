#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${TOPOVIEWER_DOCS_VENV:-$ROOT_DIR/.venv-docs}"
HOST="${TOPOVIEWER_DOCS_HOST:-127.0.0.1}"
PORT="${TOPOVIEWER_DOCS_PORT:-8000}"
ACTION="${1:-serve}"

ensure_venv() {
    if [[ ! -x "$VENV_DIR/bin/python" ]]; then
        python3 -m venv "$VENV_DIR"
    fi

    "$VENV_DIR/bin/python" -m pip install --upgrade pip
    "$VENV_DIR/bin/python" -m pip install -e "$ROOT_DIR/packages/mkdocs-topoviewer" mkdocs-material
}

prepare_docs() {
    npm run sync:docs

    if [[ "${TOPOVIEWER_DOCS_SKIP_VIEWER_BUILD:-0}" != "1" ]]; then
        npm run build
        npm run sync:mkdocs-assets
    fi
}

case "$ACTION" in
    setup)
        ensure_venv
        ;;
    build)
        ensure_venv
        prepare_docs
        "$VENV_DIR/bin/mkdocs" build --strict
        ;;
    serve)
        ensure_venv
        prepare_docs
        exec "$VENV_DIR/bin/mkdocs" serve --dev-addr "$HOST:$PORT"
        ;;
    clean)
        rm -rf "$VENV_DIR" "$ROOT_DIR/site"
        ;;
    *)
        cat >&2 <<EOF
Usage: $0 {setup|build|serve|clean}

Environment:
  TOPOVIEWER_DOCS_VENV                 Virtualenv path, default .venv-docs
  TOPOVIEWER_DOCS_HOST                 Serve host, default 127.0.0.1
  TOPOVIEWER_DOCS_PORT                 Serve port, default 8000
  TOPOVIEWER_DOCS_SKIP_VIEWER_BUILD=1  Skip npm build and asset sync for docs-only review
EOF
        exit 2
        ;;
esac
