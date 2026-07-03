#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAB_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
LAB_DIR="$(cd "${CLAB_DIR}/.." && pwd)"
REPO_DIR="$(cd "${LAB_DIR}/../.." && pwd)"
ARTIFACT_DIR="${REPO_DIR}/.artifacts/grafana-containerlab"
RUNTIME_ENV="${REPO_DIR}/.artifacts/grafana-containerlab.env"

bash "${SCRIPT_DIR}/down.sh"
rm -rf "${ARTIFACT_DIR}"
rm -f "${RUNTIME_ENV}"

echo "Cleaned Grafana TopoViewer Panel Containerlab runtime artifacts."
