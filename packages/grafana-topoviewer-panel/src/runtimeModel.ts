import yaml from 'js-yaml';
import { composeTopoViewerDocument, type TopoDocument } from 'topoviewer';
import { defaultHarnessFixture, getHarnessFixture, listHarnessFixtureIds } from './harnessFixtureCatalog';
import {
  DEFAULT_FIXTURE_ID,
  type GrafanaPanelDiagnostic,
  type GrafanaTopoViewerRuntimeModel,
  type TopoViewerGrafanaTelemetryOptions,
  type TopoViewerGrafanaPanelOptions
} from './types';

export interface NormalizedTopoViewerGrafanaPanelOptions extends Required<Omit<TopoViewerGrafanaPanelOptions, 'telemetry'>> {
  telemetry: Required<TopoViewerGrafanaTelemetryOptions>;
}

function parseYamlDocument(source: string, label: string): TopoDocument {
  const parsed = yaml.load(source);
  if (parsed === undefined || parsed === null) return {};
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a YAML mapping.`);
  }
  return parsed as TopoDocument;
}

function errorDiagnostic(code: string, message: string): GrafanaPanelDiagnostic {
  return { severity: 'error', code, message };
}

export function normalizePanelOptions(options: TopoViewerGrafanaPanelOptions | undefined): NormalizedTopoViewerGrafanaPanelOptions {
  return {
    fixtureId: options?.fixtureId || DEFAULT_FIXTURE_ID,
    themeMode: options?.themeMode || 'auto',
    showControls: options?.showControls ?? true,
    controlsOpen: options?.controlsOpen ?? false,
    telemetry: {
      enabled: options?.telemetry?.enabled ?? false,
      infoPercent: options?.telemetry?.infoPercent ?? 50,
      warningPercent: options?.telemetry?.warningPercent ?? 80,
      errorPercent: options?.telemetry?.errorPercent ?? 90
    }
  };
}

export function createRuntimeModel(options: TopoViewerGrafanaPanelOptions | undefined): GrafanaTopoViewerRuntimeModel {
  const normalized = normalizePanelOptions(options);
  const fixture = getHarnessFixture(normalized.fixtureId);
  if (!fixture) {
    return {
      diagnostics: [
        errorDiagnostic(
          'invalid-fixture-id',
          `Unknown TopoViewer fixture "${normalized.fixtureId}". Available fixtures: ${listHarnessFixtureIds().join(', ')}.`
        )
      ]
    };
  }

  try {
    const topology = parseYamlDocument(fixture.topologyYaml, `${fixture.name} topology`);
    const stylesheet = parseYamlDocument(fixture.stylesheetYaml, `${fixture.name} stylesheet`);
    const document = composeTopoViewerDocument(topology, stylesheet, {
      validationContext: `Grafana fixture ${fixture.id}`
    });
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
    const fallback = defaultHarnessFixture();
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
