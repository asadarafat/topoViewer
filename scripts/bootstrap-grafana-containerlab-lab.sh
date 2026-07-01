#!/usr/bin/env bash
set -euo pipefail

BUNDLE_NAME="${TOPOVIEWER_GRAFANA_CLAB_BUNDLE_NAME:-topoviewer-grafana-containerlab-lab}"
BUNDLE_VERSION="${TOPOVIEWER_GRAFANA_CLAB_BUNDLE_VERSION:-v0.1.0}"
BUNDLE_URL="${TOPOVIEWER_GRAFANA_CLAB_BUNDLE_URL:-https://github.com/asadarafat/topoviewer/releases/download/${BUNDLE_VERSION}/${BUNDLE_NAME}.tar.gz}"
DEST_DIR="${TOPOVIEWER_GRAFANA_CLAB_DEST_DIR:-${PWD}/${BUNDLE_NAME}}"
ARCHIVE_PATH="${TMPDIR:-/tmp}/${BUNDLE_NAME}.tar.gz"

missing_containerlab() {
  cat >&2 <<'EOF'
[topoviewer] Containerlab is required to run the Grafana lab.

Install it on a disposable Linux lab machine, then rerun this bootstrap:

  curl -sL https://containerlab.dev/setup | sudo -E bash -s "all"

That command runs an external install script with sudo. Read it first on any
machine you care about.
EOF
}

require_command() {
  local command="$1"
  local label="$2"
  if ! command -v "${command}" >/dev/null 2>&1; then
    echo "[topoviewer] ${label} is required." >&2
    exit 1
  fi
}

find_clab() {
  if [[ -n "${CONTAINERLAB_BIN:-}" ]] && command -v "${CONTAINERLAB_BIN}" >/dev/null 2>&1; then
    return 0
  fi
  command -v containerlab >/dev/null 2>&1 || command -v clab >/dev/null 2>&1
}

require_command curl curl
require_command tar tar
require_command docker Docker

if ! docker version --format '{{.Server.Version}}' >/dev/null 2>&1; then
  echo "[topoviewer] Docker is installed but not usable by this shell." >&2
  exit 1
fi

if ! find_clab; then
  missing_containerlab
  exit 1
fi

echo "[topoviewer] Downloading Grafana Containerlab bundle:"
echo "[topoviewer]   ${BUNDLE_URL}"
if ! curl -fL "${BUNDLE_URL}" -o "${ARCHIVE_PATH}"; then
  cat >&2 <<EOF
[topoviewer] Could not download the lab bundle.
[topoviewer] Expected release asset:
[topoviewer]   ${BUNDLE_URL}

If you are testing from a branch before the release asset exists, build it from
the repo with:

  npm run grafana:clab:bundle
EOF
  exit 1
fi

rm -rf "${DEST_DIR}"
mkdir -p "$(dirname "${DEST_DIR}")"
tar -xzf "${ARCHIVE_PATH}" -C "$(dirname "${DEST_DIR}")"

echo "[topoviewer] Bundle extracted to ${DEST_DIR}"
cd "${DEST_DIR}"
exec ./run.sh up
