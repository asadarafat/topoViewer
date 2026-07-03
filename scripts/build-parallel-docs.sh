#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

node "$ROOT_DIR/scripts/require-node24.mjs"
rm -rf "$ROOT_DIR/site"
bash "$ROOT_DIR/scripts/local-mkdocs.sh" build
TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD=1 bash "$ROOT_DIR/scripts/local-zensical.sh" build
npm run validate:zensical
npm run vscode:harness:build
npm run pages:redirects
npm run docs:prune
