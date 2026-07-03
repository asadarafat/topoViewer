#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAB_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
LAB_DIR="$(cd "${CLAB_DIR}/.." && pwd)"
REPO_DIR="$(cd "${LAB_DIR}/../.." && pwd)"

CLAB_BIN="${CONTAINERLAB_BIN:-}"
if [[ -z "${CLAB_BIN}" ]]; then
  CLAB_BIN="$(command -v containerlab || command -v clab || true)"
fi
if [[ -z "${CLAB_BIN}" ]]; then
  echo "Containerlab is not installed; nothing was destroyed." >&2
  rm -f "${REPO_DIR}/.artifacts/grafana-containerlab.env"
  exit 0
fi

cd "${CLAB_DIR}"
while IFS='=' read -r key value; do
  [[ -z "${key}" || "${key}" == \#* ]] && continue
  if [[ -z "${!key+x}" ]]; then
    export "${key}=${value}"
  fi
done < .env
"${CLAB_BIN}" destroy -t st.clab.yml --cleanup
rm -f "${REPO_DIR}/.artifacts/grafana-containerlab.env"
