import { strToU8, zipSync } from 'fflate';
import { parse } from 'yaml';
import { composeTopoViewerDocument, type TopoDocument } from 'topoviewer';
import type { StudioAssetContent } from '../contracts/host';
import type { StudioExportSnapshot } from '../contracts/export';
import { canonicalArchivePath, fileHash, fixedZipTime } from '../archive/projectArchive';

interface GrafanaBundleFile {
  bytes: Uint8Array;
  path: string;
}

function bundleId(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-|-$/g, '') || 'topoviewer-bundle'
  );
}

function parsedYaml(text: string, label: string): Record<string, unknown> {
  const value = parse(text) as unknown;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must contain a YAML object.`);
  return value as Record<string, unknown>;
}

export function validateGrafanaBundleSnapshot(snapshot: StudioExportSnapshot) {
  const topology = parsedYaml(snapshot.project.documents.topology.text, 'Topology source');
  const stylesheet = parsedYaml(snapshot.project.documents.stylesheet.text, 'Stylesheet source');
  composeTopoViewerDocument(topology as TopoDocument, stylesheet as TopoDocument, {
    validationContext: 'Studio Grafana bundle'
  });
  const mapperSource = snapshot.project.documents.mapper;
  if (!mapperSource) throw new Error('Grafana bundle export requires mapper YAML.');
  const mapper = parsedYaml(mapperSource.text, 'Mapper source');
  if (mapper.version !== 1 || (!Array.isArray(mapper.rules) && !Array.isArray(mapper.mappings))) {
    throw new Error('Grafana mapper must declare version 1 and a rules or mappings array.');
  }
  return {
    mapperSource,
    stylesheetSource: snapshot.project.documents.stylesheet,
    topologySource: snapshot.project.documents.topology
  };
}

export function encodeGrafanaBundle(snapshot: StudioExportSnapshot, assets: StudioAssetContent[] = []): StudioAssetContent {
  const source = validateGrafanaBundleSnapshot(snapshot);
  const id = bundleId(snapshot.project.name);
  const files: GrafanaBundleFile[] = [
    {
      bytes: strToU8(source.topologySource.text),
      path: `${id}/${id}.topo.tv.yaml`
    },
    {
      bytes: strToU8(source.stylesheetSource.text),
      path: `${id}/${id}.style.tv.yaml`
    },
    {
      bytes: strToU8(source.mapperSource.text),
      path: `${id}/${id}.mapper.tv.yaml`
    },
    ...assets.map((asset) => ({
      bytes: Uint8Array.from(asset.bytes),
      path: `${id}/${canonicalArchivePath(asset.name)}`
    }))
  ].sort((left, right) => left.path.localeCompare(right.path));
  if (new Set(files.map((file) => file.path)).size !== files.length) throw new Error('Grafana bundle paths must be unique.');
  const manifestPath = `${id}/manifest.json`;
  const manifest = strToU8(
    `${JSON.stringify(
      {
        bundle: { id, name: snapshot.project.name },
        files: files.map((file) => ({
          contentHash: fileHash(file.bytes),
          path: file.path.slice(id.length + 1),
          size: file.bytes.byteLength
        })),
        format: 'topoviewer-grafana-bundle',
        sourceRevision: snapshot.sourceRevision,
        version: 1
      },
      null,
      2
    )}\n`
  );
  const bytes = zipSync(Object.fromEntries([[manifestPath, manifest], ...files.map((file) => [file.path, file.bytes] as const)]), { level: 6, mtime: fixedZipTime });
  return { bytes, mediaType: 'application/zip', name: `${id}.grafana.zip` };
}
