#!/usr/bin/env bash
set -euo pipefail

workload_namespace="${1:-eda-system}"
domain_namespace="${2:-eda}"
output_dir="${3:-.artifacts/eda-kubernetes-inventory}"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl is required." >&2
  exit 1
fi

mkdir -p "$output_dir"

kubectl get namespace "$workload_namespace" >/dev/null
kubectl get namespace "$domain_namespace" >/dev/null

kubectl get services -n "$workload_namespace" -o json \
  > "$output_dir/services.json"

kubectl get deployments -n "$workload_namespace" -o json \
  > "$output_dir/deployments.json"

kubectl get pods -n "$workload_namespace" -o json \
  > "$output_dir/pods.json"

kubectl get services,deployments,pods -n "$workload_namespace" -o wide \
  > "$output_dir/workload-summary.txt"

kubectl api-resources --verbs=list --namespaced=true -o name \
  | grep -Ei 'networktopolog|toponode' \
  | sort -u > "$output_dir/eda-namespaced-resource-types.txt" || true

kubectl api-resources --verbs=list --namespaced=false -o name \
  | grep -Ei 'networktopolog|toponode' \
  | sort -u > "$output_dir/eda-cluster-resource-types.txt" || true

while IFS= read -r resource_type; do
  [ -n "$resource_type" ] || continue
  safe_name="${resource_type//[^a-zA-Z0-9_.-]/_}"
  kubectl get "$resource_type" -n "$domain_namespace" -o json \
    > "$output_dir/${safe_name}.json" || true
done < "$output_dir/eda-namespaced-resource-types.txt"

while IFS= read -r resource_type; do
  [ -n "$resource_type" ] || continue
  safe_name="${resource_type//[^a-zA-Z0-9_.-]/_}"
  kubectl get "$resource_type" -o json \
    > "$output_dir/${safe_name}.json" || true
done < "$output_dir/eda-cluster-resource-types.txt"

echo "Wrote inventory snapshots to $output_dir"
