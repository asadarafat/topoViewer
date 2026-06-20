#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${TOPOVIEWER_DOCS_VENV:-$ROOT_DIR/.venv-docs}"
HOST="${TOPOVIEWER_DOCS_HOST:-127.0.0.1}"
PORT="${TOPOVIEWER_DOCS_PORT:-8001}"
ACTION="${1:-serve}"

ensure_venv() {
    if [[ ! -x "$VENV_DIR/bin/python" ]]; then
        python3 -m venv "$VENV_DIR"
    fi

    "$VENV_DIR/bin/python" -m pip install --upgrade pip
    "$VENV_DIR/bin/python" -m pip install -e "$ROOT_DIR/packages/mkdocs-topoviewer" mkdocs-material
}

npm_node24() {
    node "$ROOT_DIR/scripts/run-node24.mjs" npm "$@"
}

prepare_docs() {
    npm_node24 run sync:docs

    if [[ "${TOPOVIEWER_DOCS_SKIP_VIEWER_BUILD:-0}" != "1" ]]; then
        npm_node24 run build
        npm_node24 run sync:mkdocs-assets
    fi
}

check_port() {
    node "$ROOT_DIR/scripts/check-port-free.mjs" "MkDocs" "$HOST" "$PORT"
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
        check_port
        ensure_venv
        if [[ "${TOPOVIEWER_DOCS_SKIP_PREP:-0}" != "1" ]]; then
            prepare_docs
        fi
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
  TOPOVIEWER_DOCS_PORT                 Serve port, default 8001
  TOPOVIEWER_DOCS_SKIP_PREP=1          Internal: skip sync/build before serving
  TOPOVIEWER_DOCS_SKIP_VIEWER_BUILD=1  Skip npm build and asset sync for docs-only review
EOF
        exit 2
        ;;
esac
