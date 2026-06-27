#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_DIR="$(cd "${LAB_DIR}/../.." && pwd)"

cd "${LAB_DIR}"
docker compose --env-file .env down
rm -f "${REPO_DIR}/.artifacts/grafana-topoviewer-lab.env"
