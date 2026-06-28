import { getBackendSrv } from '@grafana/runtime';
import {
  DEFAULT_MOUNTED_BUNDLE_ROOT,
  GRAFANA_TOPOVIEWER_PLUGIN_ID,
  type GrafanaMountedBundleIndex,
  type GrafanaMountedBundlePayload
} from './types';

function resourceUrl(path: string, query: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const suffix = params.toString();
  return `/api/plugins/${GRAFANA_TOPOVIEWER_PLUGIN_ID}/resources/${path}${suffix ? `?${suffix}` : ''}`;
}

export function normalizeMountedBundleRoot(bundleRoot: string | undefined): string {
  const next = bundleRoot?.trim();
  return next || DEFAULT_MOUNTED_BUNDLE_ROOT;
}

export async function fetchMountedBundleIndex(
  bundleRoot: string | undefined,
  manifestPath?: string
): Promise<GrafanaMountedBundleIndex> {
  return getBackendSrv().get<GrafanaMountedBundleIndex>(
    resourceUrl('bundles', { root: normalizeMountedBundleRoot(bundleRoot), manifest: manifestPath?.trim() })
  );
}

export async function fetchMountedBundle(
  bundleRoot: string | undefined,
  bundleId: string,
  manifestPath?: string
): Promise<GrafanaMountedBundlePayload> {
  return getBackendSrv().get<GrafanaMountedBundlePayload>(
    resourceUrl('bundle', { root: normalizeMountedBundleRoot(bundleRoot), manifest: manifestPath?.trim(), id: bundleId })
  );
}
