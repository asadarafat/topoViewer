#!/usr/bin/env bash

print_topoviewer_grafana_lab_warning() {
  local lab_name="$1"
  local port_binding_note="$2"
  shift 2

  cat <<EOF

TopoViewer Grafana ${lab_name} warning
----------------------------------------
This is a disposable local lab, not a production Grafana configuration.

The lab enables anonymous Admin, uses disposable admin/admin credentials,
disables the login form, and loads an unsigned TopoViewer plugin build so local
validation is fast. Do not use this lab on a shared network or copy these
settings into a production Grafana deployment.

${port_binding_note}

Published local endpoints:
EOF

  for endpoint in "$@"; do
    echo "  - ${endpoint}"
  done

  echo
}
