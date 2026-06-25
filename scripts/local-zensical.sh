#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${TOPOVIEWER_ZENSICAL_VENV:-$ROOT_DIR/.venv-zensical}"
HOST="${TOPOVIEWER_ZENSICAL_HOST:-127.0.0.1}"
PORT="${TOPOVIEWER_ZENSICAL_PORT:-8002}"
CONFIG="${TOPOVIEWER_ZENSICAL_CONFIG:-$ROOT_DIR/zensical.toml}"
ZENSICAL_VERSION="${TOPOVIEWER_ZENSICAL_VERSION:-0.0.45}"
ACTION="${1:-serve}"
ZENSICAL_DOCS_DIR="$ROOT_DIR/.artifacts/zensical-docs"

python_version() {
    "$1" -c 'import sys; print(".".join(map(str, sys.version_info[:3])))'
}

python_supports_zensical() {
    "$1" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)' >/dev/null 2>&1
}

select_python() {
    if [[ -n "${TOPOVIEWER_ZENSICAL_PYTHON:-}" ]]; then
        if ! command -v "$TOPOVIEWER_ZENSICAL_PYTHON" >/dev/null 2>&1; then
            echo "[topoviewer] TOPOVIEWER_ZENSICAL_PYTHON is not executable: $TOPOVIEWER_ZENSICAL_PYTHON" >&2
            exit 1
        fi
        if ! python_supports_zensical "$TOPOVIEWER_ZENSICAL_PYTHON"; then
            echo "[topoviewer] Zensical requires Python >=3.10, but TOPOVIEWER_ZENSICAL_PYTHON is $(python_version "$TOPOVIEWER_ZENSICAL_PYTHON")." >&2
            exit 1
        fi
        command -v "$TOPOVIEWER_ZENSICAL_PYTHON"
        return
    fi

    for candidate in python3.13 python3.12 python3.11 python3.10 python3; do
        if command -v "$candidate" >/dev/null 2>&1 && python_supports_zensical "$candidate"; then
            command -v "$candidate"
            return
        fi
    done

    echo "[topoviewer] Zensical $ZENSICAL_VERSION requires Python >=3.10. Install Python 3.10+ or set TOPOVIEWER_ZENSICAL_PYTHON=/path/to/python." >&2
    exit 1
}

ensure_venv() {
    local python_bin
    python_bin="$(select_python)"

    if [[ -x "$VENV_DIR/bin/python" ]] && ! python_supports_zensical "$VENV_DIR/bin/python"; then
        echo "[topoviewer] Recreating $VENV_DIR because it uses Python $(python_version "$VENV_DIR/bin/python")." >&2
        rm -rf "$VENV_DIR"
    fi

    if [[ ! -x "$VENV_DIR/bin/python" ]]; then
        "$python_bin" -m venv "$VENV_DIR"
    fi

    "$VENV_DIR/bin/python" -m pip install --upgrade pip
    "$VENV_DIR/bin/python" -m pip install "zensical==$ZENSICAL_VERSION"
}

npm_repo() {
    node "$ROOT_DIR/scripts/require-node24.mjs"
    npm "$@"
}

prepare_zensical() {
    npm_repo run sync:docs
    npm_repo run sync:zensical-docs

    if [[ "${TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD:-0}" != "1" ]]; then
        npm_repo run build
    fi
    npm_repo run sync:zensical-assets
}

check_port() {
    node "$ROOT_DIR/scripts/check-port-free.mjs" "Zensical" "$HOST" "$PORT"
}

case "$ACTION" in
    setup)
        ensure_venv
        ;;
    build)
        ensure_venv
        prepare_zensical
        "$VENV_DIR/bin/zensical" build --clean --config-file "$CONFIG"
        ;;
    serve)
        check_port
        ensure_venv
        if [[ "${TOPOVIEWER_ZENSICAL_SKIP_PREP:-0}" != "1" ]]; then
            prepare_zensical
        fi
        exec "$VENV_DIR/bin/zensical" serve --config-file "$CONFIG" --dev-addr "$HOST:$PORT"
        ;;
    clean)
        rm -rf "$VENV_DIR" "$ROOT_DIR/site/docs/zensical" "$ZENSICAL_DOCS_DIR"
        ;;
    *)
        cat >&2 <<EOF
Usage: $0 {setup|build|serve|clean}

Environment:
  TOPOVIEWER_ZENSICAL_VENV                Virtualenv path, default .venv-zensical
  TOPOVIEWER_ZENSICAL_HOST                Serve host, default 127.0.0.1
  TOPOVIEWER_ZENSICAL_PORT                Serve port, default 8002
  TOPOVIEWER_ZENSICAL_CONFIG              Config path, default zensical.toml
  TOPOVIEWER_ZENSICAL_VERSION             Zensical version, default 0.0.45
  TOPOVIEWER_ZENSICAL_PYTHON              Python 3.10+ executable for the Zensical virtualenv
  TOPOVIEWER_ZENSICAL_SKIP_PREP=1         Internal: skip sync/build before serving
  TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD=1 Skip npm build and only sync existing embed assets
EOF
        exit 2
        ;;
esac
