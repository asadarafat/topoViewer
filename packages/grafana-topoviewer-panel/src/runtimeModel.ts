import yaml from 'js-yaml';
import { composeTopoViewerDocument, rendererLimitViolations, type TopoDocument } from 'topoviewer';
import { defaultDemoFixture, getDemoFixture, listDemoFixtureIds } from './demoFixtureCatalog';
import { normalizeInteractionOptions } from './interactionState';
import { parseTopoViewerMapperYaml } from './mapperParser';
import {
  DEFAULT_MOUNTED_BUNDLE_ROOT,
  DEFAULT_FIXTURE_ID,
  type GrafanaTopoViewerSourceMode,
  type GrafanaPanelDiagnostic,
  type GrafanaMountedBundlePayload,
  type GrafanaTopoViewerRuntimeModel,
  type TopoViewerGrafanaInteractionOptions,
  type TopoViewerGrafanaMountedBundleOptions,
  type TopoViewerGrafanaTelemetryOptions,
  type TopoViewerGrafanaPanelOptions
} from './types';

export interface NormalizedTopoViewerGrafanaPanelOptions extends Required<
  Omit<TopoViewerGrafanaPanelOptions, 'telemetry' | 'interaction' | 'mountedBundle'>
> {
  telemetry: Required<TopoViewerGrafanaTelemetryOptions>;
  interaction: Required<TopoViewerGrafanaInteractionOptions>;
  mountedBundle: Required<TopoViewerGrafanaMountedBundleOptions>;
}

interface ParsedYamlDocument {
  document?: TopoDocument;
  diagnostics: GrafanaPanelDiagnostic[];
}

interface YamlExceptionWithMark {
  mark?: {
    line?: number;
    column?: number;
  };
}

function yamlSourceDiagnostic(
  code: string,
  label: string,
  document: string,
  error: unknown
): GrafanaPanelDiagnostic {
  const mark = (error as YamlExceptionWithMark | undefined)?.mark;
  const line = typeof mark?.line === 'number' ? mark.line + 1 : undefined;
  const column = typeof mark?.column === 'number' ? mark.column + 1 : undefined;
  const location = line && column ? ` at ${document} line ${line}, column ${column}` : '';
  return {
    severity: 'error',
    code,
    document,
    line,
    column,
    message: `Unable to parse ${label}${location}: ${error instanceof Error ? error.message : String(error)}.`
  };
}

function parseYamlDocument(source: string, label: string, document: string): ParsedYamlDocument {
  try {
    const parsed = yaml.load(source);
    if (parsed === undefined || parsed === null) return { document: {}, diagnostics: [] };
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        diagnostics: [{
          severity: 'error',
          code: 'yaml-document-invalid',
          document,
          message: `${label} must be a YAML mapping.`
        }]
      };
    }
    return { document: parsed as TopoDocument, diagnostics: [] };
  } catch (error) {
    return {
      diagnostics: [yamlSourceDiagnostic('yaml-parse-error', label, document, error)]
    };
  }
}

function errorDiagnostic(code: string, message: string): GrafanaPanelDiagnostic {
  return { severity: 'error', code, message };
}

function renderabilityDiagnostics(document: TopoDocument): GrafanaPanelDiagnostic[] {
  const graph = document.graph || {};
  const graphObjectCount = (
    (graph.nodes?.length || 0) +
    (graph.links?.length || 0) +
    (graph.paths?.length || 0) +
    (graph.regions?.length || 0)
  );
  const diagnostics: GrafanaPanelDiagnostic[] = [];
  if (graphObjectCount === 0) {
    diagnostics.push({
      severity: 'error',
      code: 'empty-graph',
      path: 'graph',
      message: 'Mounted TopoViewer source contains no graph objects; add at least one node, link, path, or region before rendering.'
    });
  }
  rendererLimitViolations(document).forEach((message) => {
    diagnostics.push({
      severity: 'error',
      code: 'renderer-limit',
      path: 'limits',
      message
    });
  });
  return diagnostics;
}

function inferredSourceMode(options: TopoViewerGrafanaPanelOptions | undefined): GrafanaTopoViewerSourceMode {
  if (options?.sourceMode) return options.sourceMode;

  const hasMountedBundleConfig = Boolean(
    options?.mountedBundle?.selectedBundleId ||
    options?.mountedBundle?.bundleRoot ||
    options?.mountedBundle?.manifestPath
  );
  if (options?.fixtureId && !hasMountedBundleConfig) return 'fixture';
  return 'mountedBundle';
}

export function normalizePanelOptions(options: TopoViewerGrafanaPanelOptions | undefined): NormalizedTopoViewerGrafanaPanelOptions {
  return {
    sourceMode: inferredSourceMode(options),
    fixtureId: options?.fixtureId || DEFAULT_FIXTURE_ID,
    mountedBundle: {
      bundleRoot: options?.mountedBundle?.bundleRoot || DEFAULT_MOUNTED_BUNDLE_ROOT,
      manifestPath: options?.mountedBundle?.manifestPath || '',
      selectedBundleId: options?.mountedBundle?.selectedBundleId || ''
    },
    themeMode: options?.themeMode || 'auto',
    showControls: options?.showControls ?? true,
    controlsOpen: options?.controlsOpen ?? false,
    telemetry: {
      enabled: options?.telemetry?.enabled ?? false,
      infoPercent: options?.telemetry?.infoPercent ?? 50,
      warningPercent: options?.telemetry?.warningPercent ?? 80,
      errorPercent: options?.telemetry?.errorPercent ?? 90
    },
    interaction: normalizeInteractionOptions(options?.interaction)
  };
}

function createMountedBundleRuntimeModel(
  normalized: NormalizedTopoViewerGrafanaPanelOptions,
  mountedBundle: GrafanaMountedBundlePayload | undefined
): GrafanaTopoViewerRuntimeModel {
  if (!mountedBundle) {
    return {
      diagnostics: [{
        severity: 'info',
        code: 'mounted-bundle-loading',
        message: `Waiting for a mounted TopoViewer bundle under ${normalized.mountedBundle.bundleRoot}.`
      }]
    };
  }

  try {
    const topologyParse = parseYamlDocument(mountedBundle.topologyYaml, `${mountedBundle.bundle.name} topology`, 'topology');
    const stylesheetParse = parseYamlDocument(mountedBundle.stylesheetYaml, `${mountedBundle.bundle.name} stylesheet`, 'stylesheet');
    const sourceDiagnostics = [
      ...topologyParse.diagnostics,
      ...stylesheetParse.diagnostics
    ];
    if (sourceDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      return {
        mountedBundle,
        diagnostics: [
          ...(mountedBundle.diagnostics || []),
          ...sourceDiagnostics
        ]
      };
    }
    const mapperParse = parseTopoViewerMapperYaml(mountedBundle.mapperYaml, `${mountedBundle.bundle.name} mapper`);
    if (mapperParse.diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      return {
        mountedBundle,
        diagnostics: [
          ...(mountedBundle.diagnostics || []),
          ...mapperParse.diagnostics
        ]
      };
    }
    const document = composeTopoViewerDocument(topologyParse.document || {}, stylesheetParse.document || {}, {
      validationContext: `Grafana mounted bundle ${mountedBundle.bundle.id}`
    });
    const renderDiagnostics = renderabilityDiagnostics(document);
    if (renderDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      return {
        mountedBundle,
        document,
        mapper: mapperParse.mapper,
        diagnostics: [
          ...(mountedBundle.diagnostics || []),
          ...renderDiagnostics
        ]
      };
    }
    return {
      mountedBundle,
      document,
      mapper: mapperParse.mapper,
      diagnostics: mountedBundle.diagnostics || [],
      topoviewerProps: {
        document,
        className: 'topoviewer-parity-theme',
        controlPanelToggle: {
          enabled: normalized.showControls,
          open: normalized.controlsOpen
        }
      }
    };
  } catch (error) {
    return {
      mountedBundle,
      diagnostics: [
        ...(mountedBundle.diagnostics || []),
        errorDiagnostic(
          'mounted-bundle-parse-error',
          `Unable to render mounted bundle "${mountedBundle.bundle.id}": ${error instanceof Error ? error.message : String(error)}.`
        )
      ]
    };
  }
}

export function createRuntimeModel(
  options: TopoViewerGrafanaPanelOptions | undefined,
  mountedBundle?: GrafanaMountedBundlePayload
): GrafanaTopoViewerRuntimeModel {
  const normalized = normalizePanelOptions(options);
  if (normalized.sourceMode === 'mountedBundle') {
    return createMountedBundleRuntimeModel(normalized, mountedBundle);
  }

  const fixture = getDemoFixture(normalized.fixtureId);
  if (!fixture) {
    return {
      diagnostics: [
        errorDiagnostic(
          'invalid-fixture-id',
          `Unknown TopoViewer fixture "${normalized.fixtureId}". Available fixtures: ${listDemoFixtureIds().join(', ')}.`
        )
      ]
    };
  }

  try {
    const topologyParse = parseYamlDocument(fixture.topologyYaml, `${fixture.name} topology`, 'topology');
    const stylesheetParse = parseYamlDocument(fixture.stylesheetYaml, `${fixture.name} stylesheet`, 'stylesheet');
    const sourceDiagnostics = [
      ...topologyParse.diagnostics,
      ...stylesheetParse.diagnostics
    ];
    if (sourceDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      return {
        fixture,
        diagnostics: sourceDiagnostics
      };
    }
    const document = composeTopoViewerDocument(topologyParse.document || {}, stylesheetParse.document || {}, {
      validationContext: `Grafana fixture ${fixture.id}`
    });
    const renderDiagnostics = renderabilityDiagnostics(document);
    if (renderDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      return {
        fixture,
        document,
        diagnostics: renderDiagnostics
      };
    }
    return {
      fixture,
      document,
      diagnostics: [],
      topoviewerProps: {
        document,
        className: 'topoviewer-parity-theme',
        controlPanelToggle: {
          enabled: normalized.showControls,
          open: normalized.controlsOpen
        }
      }
    };
  } catch (error) {
    const fallback = defaultDemoFixture();
    return {
      fixture,
      diagnostics: [
        errorDiagnostic(
          'fixture-parse-error',
          `Unable to render Grafana fixture "${fixture.id}": ${error instanceof Error ? error.message : String(error)}.`
        ),
        {
          severity: 'info',
          code: 'fallback-fixture',
          message: `Fallback fixture remains ${fallback.id}; fix the generated fixture projection and rerun validation.`
        }
      ]
    };
  }
}
