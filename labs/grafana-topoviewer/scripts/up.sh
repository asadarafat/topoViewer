#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_DIR="$(cd "${LAB_DIR}/../.." && pwd)"
RUNTIME_ENV="${REPO_DIR}/.artifacts/grafana-topoviewer-lab.env"

cd "${REPO_DIR}"
node labs/grafana-topoviewer/scripts/check-versions.mjs
node labs/grafana-topoviewer/scripts/check-port.mjs
npm run grafana:panel:build

cd "${LAB_DIR}"
docker compose --env-file .env up -d
mkdir -p "$(dirname "${RUNTIME_ENV}")"
{
  echo "GRAFANA_HTTP_PORT=${GRAFANA_HTTP_PORT:-3000}"
  echo "PROMETHEUS_HTTP_PORT=${PROMETHEUS_HTTP_PORT:-9090}"
  echo "TELEMETRY_INJECTOR_HTTP_PORT=${TELEMETRY_INJECTOR_HTTP_PORT:-9108}"
} > "${RUNTIME_ENV}"
echo "Grafana TopoViewer topology bundles: http://127.0.0.1:${GRAFANA_HTTP_PORT:-3000}/d/topoviewer-phase-4/topoviewer-phase-4-mounted-bundles"
echo "Grafana TopoViewer fixture parity: http://127.0.0.1:${GRAFANA_HTTP_PORT:-3000}/d/topoviewer-phase-1/topoviewer-phase-1"
echo "Grafana TopoViewer legacy weathermap: http://127.0.0.1:${GRAFANA_HTTP_PORT:-3000}/d/topoviewer-phase-2/topoviewer-phase-2-weathermap"
echo "Prometheus: http://127.0.0.1:${PROMETHEUS_HTTP_PORT:-9090}"
echo "Telemetry injector: http://127.0.0.1:${TELEMETRY_INJECTOR_HTTP_PORT:-9108}/scenario"
echo "Runtime ports: ${RUNTIME_ENV}"
