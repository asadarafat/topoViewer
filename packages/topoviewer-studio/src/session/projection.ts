import {
  composeTopoViewerDocument,
  lintTopoDocument,
  validateTopoDocument,
  type TopoDocument
} from 'topoviewer';
import type { StudioDiagnostic, StudioDocumentKind } from '../contracts/project';
import { validateStudioAssetContent } from '../security/assetSecurity';
import { parseStudioSource, sourceRangeAtPath } from './yamlSource';
import type { ParsedStudioSource, StudioYamlPath } from './types';

export type ParsedSources = Partial<Record<StudioDocumentKind, ParsedStudioSource>> & {
  topology: ParsedStudioSource;
  stylesheet: ParsedStudioSource;
};

export type ProjectionResult =
  | { diagnostics: StudioDiagnostic[]; ok: false }
  | { diagnostics: StudioDiagnostic[]; document: TopoDocument; ok: true; sources: ParsedSources };

export function pathSegments(path: string): StudioYamlPath {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
    .map((segment) => /^\d+$/.test(segment) ? Number(segment) : segment);
}

function locationForPath(sources: ParsedSources, path: StudioYamlPath) {
  for (const kind of ['topology', 'stylesheet'] as const) {
    if (!sources[kind].document.hasIn(path)) continue;
    const range = sourceRangeAtPath(sources[kind], path);
    return range ? {
      column: range.column,
      document: kind,
      endColumn: range.endColumn,
      endLine: range.endLine,
      line: range.line
    } : { document: kind };
  }
  return { document: 'topology' as const };
}

function firstValidationPath(message: string): string | undefined {
  const suffix = message.split(' is invalid: ')[1] || message;
  const match = suffix.match(/^([^:;]+):/);
  return match?.[1] && match[1] !== '<root>' ? match[1] : undefined;
}

function validateMapper(source: ParsedStudioSource | undefined): StudioDiagnostic[] {
  if (!source) return [];
  const diagnostics: StudioDiagnostic[] = [];
  const value = source.value;
  if (value.version !== 1) {
    diagnostics.push({ code: 'invalid-mapper-version', document: 'mapper', message: 'Mapper YAML must set version: 1.', path: ['version'], severity: 'error' });
  }
  if (!Array.isArray(value.rules) && !Array.isArray(value.mappings)) {
    diagnostics.push({ code: 'invalid-mapper-rules', document: 'mapper', message: 'Mapper YAML must define a rules or mappings list.', path: ['rules'], severity: 'error' });
  }
  return diagnostics.map((diagnostic) => {
    const range = diagnostic.path ? sourceRangeAtPath(source, diagnostic.path) : undefined;
    return range ? { ...diagnostic, column: range.column, line: range.line } : diagnostic;
  });
}

function studioContentSecurityDiagnostics(document: TopoDocument, sources: ParsedSources): StudioDiagnostic[] {
  const diagnostics: StudioDiagnostic[] = [];
  for (const [key, icon] of Object.entries(document.icons || {})) {
    const path = ['icons', key, icon.src ? 'src' : 'svg'] satisfies StudioYamlPath;
    if (icon.src) {
      diagnostics.push({
        code: 'studio-implicit-image-fetch',
        message: `Icon "${key}" uses src. Studio does not fetch image references implicitly; use a glyph or reviewed inline SVG.`,
        path,
        severity: 'error',
        ...locationForPath(sources, path)
      });
    }
    if (icon.svg) {
      try {
        validateStudioAssetContent({
          bytes: new TextEncoder().encode(icon.svg),
          mediaType: 'image/svg+xml',
          name: `inline/${key.replace(/[^a-z0-9._-]+/gi, '-') || 'icon'}.svg`
        });
      } catch (error) {
        diagnostics.push({
          code: 'studio-unsafe-inline-svg',
          message: error instanceof Error ? error.message : String(error),
          path,
          severity: 'error',
          ...locationForPath(sources, path)
        });
      }
    }
  }
  for (const [index, callout] of (document.diagram?.callouts || []).entries()) {
    const markdown = Array.isArray(callout.markdown) ? callout.markdown.join('\n') : String(callout.markdown || '');
    if (/!\[[^\]]*\]\(\s*(?:https?:|\/\/|data:)/i.test(markdown)) {
      const path = ['diagram', 'callouts', index, 'markdown'] satisfies StudioYamlPath;
      diagnostics.push({
        code: 'studio-implicit-markdown-image-fetch',
        message: `Callout "${callout.id || index}" contains a remote or embedded Markdown image. Studio does not fetch it implicitly.`,
        path,
        severity: 'error',
        ...locationForPath(sources, path)
      });
    }
  }
  return diagnostics;
}

export function buildProjection(
  textByKind: Partial<Record<StudioDocumentKind, string>>,
  reusableSources?: Partial<Record<StudioDocumentKind, ParsedStudioSource>>
): ProjectionResult {
  const parsedSources: Partial<Record<StudioDocumentKind, ParsedStudioSource>> = {};
  const parseDiagnostics: StudioDiagnostic[] = [];
  for (const kind of ['topology', 'stylesheet', 'mapper'] as const) {
    const text = textByKind[kind];
    if (text === undefined && kind === 'mapper') continue;
    const reusable = reusableSources?.[kind];
    if (reusable?.text === text) {
      parsedSources[kind] = reusable;
      continue;
    }
    const parsed = parseStudioSource(kind, text || '{}\n');
    if (!parsed.ok) parseDiagnostics.push(...parsed.diagnostics);
    else parsedSources[kind] = parsed.source;
  }
  if (parseDiagnostics.length > 0 || !parsedSources.topology || !parsedSources.stylesheet) {
    return { diagnostics: parseDiagnostics, ok: false };
  }
  const sources = parsedSources as ParsedSources;

  const mapperDiagnostics = validateMapper(sources.mapper);
  if (mapperDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    return { diagnostics: mapperDiagnostics, ok: false };
  }

  let document: TopoDocument;
  try {
    const composed = composeTopoViewerDocument(
      sources.topology.value as TopoDocument,
      sources.stylesheet.value as TopoDocument,
      { validate: false }
    );
    document = validateTopoDocument(composed, 'TopoViewer Studio projection');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const path = firstValidationPath(message);
    const segments = path ? pathSegments(path) : [];
    return {
      diagnostics: [{
        code: 'invalid-topoviewer-document',
        message,
        path: segments,
        severity: 'error',
        ...locationForPath(sources, segments)
      }],
      ok: false
    };
  }

  const diagnostics = lintTopoDocument(document, { requireNames: false }).map((issue) => {
    const path = issue.path ? pathSegments(issue.path) : [];
    return {
      code: issue.code,
      message: issue.message,
      path,
      severity: issue.severity,
      ...locationForPath(sources, path)
    } satisfies StudioDiagnostic;
  });
  const securityDiagnostics = studioContentSecurityDiagnostics(document, sources);
  const allDiagnostics = [...diagnostics, ...mapperDiagnostics, ...securityDiagnostics];
  if (allDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    return { diagnostics: allDiagnostics, ok: false };
  }
  return { diagnostics: allDiagnostics, document, ok: true, sources };
}
