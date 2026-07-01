#!/usr/bin/env bash
set -euo pipefail

ACTION="${1:-status}"
CLIENT1="${TOPOVIEWER_CLAB_CLIENT1:-clab-topoviewer-grafana-client1}"
CLIENT2="${TOPOVIEWER_CLAB_CLIENT2:-clab-topoviewer-grafana-client2}"
CLIENT1_TARGET="${TOPOVIEWER_CLAB_CLIENT1_TARGET:-192.0.2.13}"
CLIENT2_TARGET="${TOPOVIEWER_CLAB_CLIENT2_TARGET:-192.0.2.10}"
PING_INTERVAL="${TOPOVIEWER_CLAB_TRAFFIC_INTERVAL:-0.02}"
PING_SIZE="${TOPOVIEWER_CLAB_TRAFFIC_SIZE:-1400}"

function require_container() {
  local container="$1"
  if ! docker inspect "${container}" >/dev/null 2>&1; then
    echo "Container ${container} is not running. Start the lab first." >&2
    exit 1
  fi
}

function start_sender() {
  local container="$1"
  local target="$2"
  require_container "${container}"
  docker exec "${container}" sh -lc "
    if [ -f /tmp/topoviewer-traffic.pid ]; then
      kill \$(cat /tmp/topoviewer-traffic.pid) >/dev/null 2>&1 || true
      rm -f /tmp/topoviewer-traffic.pid
    fi
    nohup sh -c 'while true; do ping -s ${PING_SIZE} -i ${PING_INTERVAL} ${target} >/dev/null 2>&1; sleep 1; done' >/tmp/topoviewer-traffic.log 2>&1 &
    echo \$! > /tmp/topoviewer-traffic.pid
  "
}

function stop_sender() {
  local container="$1"
  require_container "${container}"
  docker exec "${container}" sh -lc "
    if [ -f /tmp/topoviewer-traffic.pid ]; then
      kill \$(cat /tmp/topoviewer-traffic.pid) >/dev/null 2>&1 || true
      rm -f /tmp/topoviewer-traffic.pid
    fi
    pkill -f 'ping -s ${PING_SIZE}' >/dev/null 2>&1 || true
  "
}

function status_sender() {
  local container="$1"
  require_container "${container}"
  docker exec "${container}" sh -lc "
    if [ -f /tmp/topoviewer-traffic.pid ] && kill -0 \$(cat /tmp/topoviewer-traffic.pid) >/dev/null 2>&1; then
      echo '${container}: traffic running pid='\"\$(cat /tmp/topoviewer-traffic.pid)\"
    else
      echo '${container}: traffic stopped'
    fi
  "
}

case "${ACTION}" in
  start)
    start_sender "${CLIENT1}" "${CLIENT1_TARGET}"
    start_sender "${CLIENT2}" "${CLIENT2_TARGET}"
    echo "Started bidirectional TopoViewer lab traffic."
    ;;
  stop)
    stop_sender "${CLIENT1}"
    stop_sender "${CLIENT2}"
    echo "Stopped TopoViewer lab traffic."
    ;;
  status)
    status_sender "${CLIENT1}"
    status_sender "${CLIENT2}"
    ;;
  *)
    echo "Usage: $0 {start|stop|status}" >&2
    exit 1
    ;;
esac
