#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAB_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

exec bash "${CLAB_DIR}/traffic.sh" "$@"
