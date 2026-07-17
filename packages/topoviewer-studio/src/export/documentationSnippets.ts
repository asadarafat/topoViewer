import type { StudioExportSnapshot } from '../contracts/export';

export type DocumentationSnippetKind = 'mkdocs' | 'static';

function sourcePaths(snapshot: StudioExportSnapshot) {
  const { topology, stylesheet, mapper } = snapshot.project.documents;
  return {
    mapper: mapper?.path,
    stylesheet: stylesheet.path,
    topology: topology.path
  };
}

export function createDocumentationSnippet(snapshot: StudioExportSnapshot, kind: DocumentationSnippetKind): string {
  const paths = sourcePaths(snapshot);
  if (kind === 'mkdocs') return ['```topoviewer', `topology: ${paths.topology}`, `stylesheet: ${paths.stylesheet}`, ...(paths.mapper ? [`mapper: ${paths.mapper}`] : []), 'height: 520px', 'controls: true', '```', ''].join('\n');

  const mapper = paths.mapper ? `\n  data-mapper="${paths.mapper}"` : '';
  return [
    '<link rel="stylesheet" href="/assets/topoviewer/topoviewer-embed.css">',
    '<script defer src="/assets/topoviewer/topoviewer-embed.iife.js"></script>',
    '',
    '<div',
    '  class="topoviewer-embed"',
    `  data-topology="${paths.topology}"`,
    `  data-stylesheet="${paths.stylesheet}"${mapper}`,
    '  data-controls="true"',
    '  style="height: 520px;"',
    '></div>',
    ''
  ].join('\n');
}
