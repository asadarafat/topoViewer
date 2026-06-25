#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCS_HOST="${TOPOVIEWER_DOCS_HOST:-127.0.0.1}"
DOCS_PORT="${TOPOVIEWER_DOCS_PORT:-8001}"
ZENSICAL_HOST="${TOPOVIEWER_ZENSICAL_HOST:-127.0.0.1}"
ZENSICAL_PORT="${TOPOVIEWER_ZENSICAL_PORT:-8002}"

check_port() {
    local label="$1"
    local host="$2"
    local port="$3"
    node "$ROOT_DIR/scripts/check-port-free.mjs" "$label" "$host" "$port"
}

npm_repo() {
    node "$ROOT_DIR/scripts/require-node24.mjs"
    npm "$@"
}

prepare_preview() {
    bash "$ROOT_DIR/scripts/local-mkdocs.sh" setup
    bash "$ROOT_DIR/scripts/local-zensical.sh" setup

    npm_repo run sync:docs

    if [[ "${TOPOVIEWER_DOCS_SKIP_VIEWER_BUILD:-0}" != "1" || "${TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD:-0}" != "1" ]]; then
        npm_repo run build
    fi

    if [[ "${TOPOVIEWER_DOCS_SKIP_VIEWER_BUILD:-0}" != "1" ]]; then
        npm_repo run sync:mkdocs-assets
    fi

    npm_repo run sync:zensical-docs
    npm_repo run sync:zensical-assets
}

cleanup() {
    trap - EXIT INT TERM
    for pid in "${MKDOCS_PID:-}" "${ZENSICAL_PID:-}"; do
        if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done
    for pid in "${MKDOCS_PID:-}" "${ZENSICAL_PID:-}"; do
        if [[ -n "$pid" ]]; then
            wait "$pid" 2>/dev/null || true
        fi
    done
}

check_port "MkDocs" "$DOCS_HOST" "$DOCS_PORT"
check_port "Zensical" "$ZENSICAL_HOST" "$ZENSICAL_PORT"

prepare_preview

echo "[topoviewer] MkDocs:   http://$DOCS_HOST:$DOCS_PORT/TopoViewer/"
echo "[topoviewer] Zensical: http://$ZENSICAL_HOST:$ZENSICAL_PORT/TopoViewer/zensical/"

trap 'cleanup; exit 130' INT
trap 'cleanup; exit 143' TERM
trap cleanup EXIT

(
    export TOPOVIEWER_DOCS_HOST="$DOCS_HOST"
    export TOPOVIEWER_DOCS_PORT="$DOCS_PORT"
    export TOPOVIEWER_DOCS_SKIP_PREP=1
    bash "$ROOT_DIR/scripts/local-mkdocs.sh" serve
) &
MKDOCS_PID=$!

(
    export TOPOVIEWER_ZENSICAL_HOST="$ZENSICAL_HOST"
    export TOPOVIEWER_ZENSICAL_PORT="$ZENSICAL_PORT"
    export TOPOVIEWER_ZENSICAL_SKIP_PREP=1
    bash "$ROOT_DIR/scripts/local-zensical.sh" serve
) &
ZENSICAL_PID=$!

status=0
while true; do
    if ! kill -0 "$MKDOCS_PID" 2>/dev/null; then
        wait "$MKDOCS_PID" || status=$?
        echo "[topoviewer] MkDocs server exited; stopping Zensical." >&2
        break
    fi
    if ! kill -0 "$ZENSICAL_PID" 2>/dev/null; then
        wait "$ZENSICAL_PID" || status=$?
        echo "[topoviewer] Zensical server exited; stopping MkDocs." >&2
        break
    fi
    sleep 1
done

cleanup
exit "$status"
