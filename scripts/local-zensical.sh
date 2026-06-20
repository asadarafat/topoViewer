#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${TOPOVIEWER_ZENSICAL_VENV:-$ROOT_DIR/.venv-zensical}"
HOST="${TOPOVIEWER_ZENSICAL_HOST:-127.0.0.1}"
PORT="${TOPOVIEWER_ZENSICAL_PORT:-8002}"
CONFIG="${TOPOVIEWER_ZENSICAL_CONFIG:-$ROOT_DIR/zensical.toml}"
ZENSICAL_VERSION="${TOPOVIEWER_ZENSICAL_VERSION:-0.0.45}"
ACTION="${1:-serve}"

ensure_venv() {
    if [[ ! -x "$VENV_DIR/bin/python" ]]; then
        python3 -m venv "$VENV_DIR"
    fi

    "$VENV_DIR/bin/python" -m pip install --upgrade pip
    "$VENV_DIR/bin/python" -m pip install "zensical==$ZENSICAL_VERSION"
}

npm_node24() {
    node "$ROOT_DIR/scripts/run-node24.mjs" npm "$@"
}

prepare_zensical() {
    npm_node24 run sync:docs
    npm_node24 run sync:zensical-docs

    if [[ "${TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD:-0}" != "1" ]]; then
        npm_node24 run build
    fi
    npm_node24 run sync:zensical-assets
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
        rm -rf "$VENV_DIR" "$ROOT_DIR/site/zensical"
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
  TOPOVIEWER_ZENSICAL_SKIP_PREP=1         Internal: skip sync/build before serving
  TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD=1 Skip npm build and only sync existing embed assets
EOF
        exit 2
        ;;
esac
