#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCS_HOST="${TOPOVIEWER_DOCS_HOST:-127.0.0.1}"
DOCS_PORT="${TOPOVIEWER_DOCS_PORT:-8001}"

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

check_port "Docs preview" "$DOCS_HOST" "$DOCS_PORT"
npm_repo run docs:build:parallel
exec node "$ROOT_DIR/scripts/serve-docs-site.mjs"
