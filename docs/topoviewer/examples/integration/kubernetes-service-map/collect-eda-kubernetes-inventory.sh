#!/usr/bin/env bash
set -euo pipefail

workload_namespace="${1:-eda-system}"
domain_namespace="${2:-eda}"
output_dir="${3:-eda-kubernetes-inventory}"
resource_pattern="${4:-networktopolog|toponode}"
kubectl_cmd="${KUBECTL:-kubectl}"

if ! command -v "${kubectl_cmd%% *}" >/dev/null 2>&1; then
  echo "kubectl is required. Set KUBECTL='docker exec <control-plane> kubectl' when kubectl is bundled in a container." >&2
  exit 1
fi
k() { $kubectl_cmd --request-timeout=10s "$@"; }

mkdir -p "$output_dir"

k get namespace "$workload_namespace" >/dev/null
k get namespace "$domain_namespace" >/dev/null

k get services -n "$workload_namespace" -o json \
  > "$output_dir/services.json"

k get deployments -n "$workload_namespace" -o json \
  > "$output_dir/deployments.json"

k get pods -n "$workload_namespace" -o json \
  > "$output_dir/pods.json"

k get services,deployments,pods -n "$workload_namespace" -o wide \
  > "$output_dir/workload-summary.txt"

k api-resources --verbs=list --namespaced=true -o name \
  | grep -Ei "$resource_pattern" \
  | sort -u > "$output_dir/eda-namespaced-resource-types.txt" || true

k api-resources --verbs=list --namespaced=false -o name \
  | grep -Ei "$resource_pattern" \
  | sort -u > "$output_dir/eda-cluster-resource-types.txt" || true

while IFS= read -r resource_type; do
  [ -n "$resource_type" ] || continue
  safe_name="${resource_type//[^a-zA-Z0-9_.-]/_}"
  k get "$resource_type" -n "$domain_namespace" -o json \
    > "$output_dir/${safe_name}.json" || true
done < "$output_dir/eda-namespaced-resource-types.txt"

while IFS= read -r resource_type; do
  [ -n "$resource_type" ] || continue
  safe_name="${resource_type//[^a-zA-Z0-9_.-]/_}"
  k get "$resource_type" -o json \
    > "$output_dir/${safe_name}.json" || true
done < "$output_dir/eda-cluster-resource-types.txt"

echo "Wrote inventory snapshots to $output_dir"
