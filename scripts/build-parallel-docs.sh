#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

bash "$ROOT_DIR/scripts/local-mkdocs.sh" build
TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD=1 bash "$ROOT_DIR/scripts/local-zensical.sh" build
node "$ROOT_DIR/scripts/run-node24.mjs" npm run validate:zensical
node "$ROOT_DIR/scripts/run-node24.mjs" npm run vscode:harness:build:node24
