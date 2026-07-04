#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAB_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
LAB_DIR="$(cd "${CLAB_DIR}/.." && pwd)"
REPO_DIR="$(cd "${LAB_DIR}/../.." && pwd)"
RUNTIME_ENV="${REPO_DIR}/.artifacts/grafana-containerlab.env"

source "${SCRIPT_DIR}/lab-warning.sh"

cd "${CLAB_DIR}"
while IFS='=' read -r key value; do
  [[ -z "${key}" || "${key}" == \#* ]] && continue
  if [[ -z "${!key+x}" ]]; then
    export "${key}=${value}"
  fi
done < .env

cd "${REPO_DIR}"
node scripts/require-node24.mjs
node labs/grafana-topoviewer/containerlab/scripts/check-ports.mjs
node labs/grafana-topoviewer/containerlab/scripts/check-tools.mjs
npm run grafana:panel:build

CLAB_BIN="${CONTAINERLAB_BIN:-}"
if [[ -z "${CLAB_BIN}" ]]; then
  CLAB_BIN="$(command -v containerlab || command -v clab || true)"
fi
if [[ -z "${CLAB_BIN}" ]]; then
  echo "Containerlab is required. Install containerlab or set CONTAINERLAB_BIN." >&2
  exit 1
fi

print_topoviewer_grafana_lab_warning \
  "Containerlab lab" \
  "Containerlab publishes Grafana and Prometheus host ports through Docker; keep this on a trusted local host or constrain access with host firewall rules." \
  "Grafana: http://127.0.0.1:3000" \
  "Prometheus: http://127.0.0.1:9090"

cd "${CLAB_DIR}"
"${CLAB_BIN}" deploy -t st.clab.yml

mkdir -p "$(dirname "${RUNTIME_ENV}")"
{
  echo "GRAFANA_HTTP_PORT=3000"
  echo "PROMETHEUS_HTTP_PORT=9090"
} > "${RUNTIME_ENV}"

echo "Grafana TopoViewer Panel: http://127.0.0.1:3000/d/network-telemetry-topoviewer/network-telemetry-topoviewer"
echo "Prometheus: http://127.0.0.1:9090"
echo "Runtime ports: ${RUNTIME_ENV}"
