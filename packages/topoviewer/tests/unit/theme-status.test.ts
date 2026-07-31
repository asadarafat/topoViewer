import { describe, expect, it } from 'vitest';
import {
  buildTopoStatusLegend,
  compileTopoGraph,
  lintTopoDocument,
  resolveTopoStatus,
  topoViewerThemeStyle,
  TOPOVIEWER_DARK_THEME,
  TOPOVIEWER_LIGHT_THEME,
  type TopoDocument
} from '../../src';

describe('TopoViewer theme contract', () => {
  it('publishes immutable light and dark token sets', () => {
    expect(Object.isFrozen(TOPOVIEWER_DARK_THEME)).toBe(true);
    expect(Object.isFrozen(TOPOVIEWER_LIGHT_THEME)).toBe(true);
    expect(TOPOVIEWER_DARK_THEME.background).not.toBe(TOPOVIEWER_LIGHT_THEME.background);
    expect(Object.keys(TOPOVIEWER_DARK_THEME)).toEqual(Object.keys(TOPOVIEWER_LIGHT_THEME));
  });

  it('projects explicit modes and host overrides to CSS variables', () => {
    expect(topoViewerThemeStyle('light')).toMatchObject({
      '--topoviewer-bg': TOPOVIEWER_LIGHT_THEME.background,
      '--topoviewer-fg': TOPOVIEWER_LIGHT_THEME.foreground
    });
    expect(topoViewerThemeStyle('dark', { accent: '#ff00aa' })).toMatchObject({
      '--topoviewer-bg': TOPOVIEWER_DARK_THEME.background,
      '--topoviewer-accent': '#ff00aa'
    });
    expect(topoViewerThemeStyle('system', { accent: '#ff00aa' })).toEqual({
      '--topoviewer-accent': '#ff00aa'
    });
  });
});

describe('TopoViewer status contract', () => {
  it('normalizes aliases with labels before data and severity before status', () => {
    expect(resolveTopoStatus({ labels: { severity: 'error', status: 'ready' }, data: { severity: 'minor' } })).toBe('critical');
    expect(resolveTopoStatus({ labels: { status: 'ready' }, data: { severity: 'critical' } })).toBe('normal');
    expect(resolveTopoStatus({ data: { status: 'degraded' } })).toBe('warning');
    expect(resolveTopoStatus({ data: { health: 'degraded' } })).toBe('warning');
    expect(resolveTopoStatus({ labels: { status: 'maintenance' } })).toBe('unknown');
  });

  it('uses normalized status for default markers while preserving explicit style', () => {
    const graph = compileTopoGraph({
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'derived', labels: { status: 'degraded' }, layers: ['physical'] },
          { id: 'explicit', labels: { status: 'critical' }, layers: ['physical'] }
        ]
      },
      stylesheet: [
        { selector: 'node[id = "explicit"]', style: { statusColor: 'rebeccapurple' } }
      ]
    }, ['physical']);

    expect(graph.nodes.find((node) => node.id === 'derived')?.data.statusStyle)
      .toMatchObject({ backgroundColor: 'var(--topoviewer-warning)' });
    expect(graph.nodes.find((node) => node.id === 'explicit')?.data.statusStyle)
      .toMatchObject({ backgroundColor: 'rebeccapurple' });
  });

  it('builds deterministic legend entries with non-color cues', () => {
    const graph = compileTopoGraph({
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'normal-a', labels: { status: 'ready' }, layers: ['physical'] },
          { id: 'warning-a', labels: { status: 'degraded' }, layers: ['physical'] },
          { id: 'critical-a', labels: { severity: 'critical' }, layers: ['physical'] }
        ]
      }
    }, ['physical']);

    expect(buildTopoStatusLegend(graph)).toEqual([
      { severity: 'critical', label: 'Critical', cue: '!', count: 1 },
      { severity: 'warning', label: 'Warning', cue: 'W', count: 1 },
      { severity: 'normal', label: 'Normal', cue: 'OK', count: 1 }
    ]);
  });

  it('keeps TVDS lint guidance opt-in', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [{ id: 'router-a', labels: { status: 'critical' }, layers: ['physical'] }]
      },
      stylesheet: [
        {
          selector: 'node[labels.status = "critical"]',
          style: { backgroundColor: '#ff0000' }
        },
        {
          selector: 'node',
          style: { backgroundColor: '#ffffff', labelColor: '#777777' }
        }
      ]
    };

    expect(lintTopoDocument(document).some((item) => item.code.startsWith('tvds-'))).toBe(false);
    const issues = lintTopoDocument(document, { profile: 'tvds' });
    expect(issues).toContainEqual(expect.objectContaining({ code: 'tvds-status-color-only', severity: 'warning' }));
    expect(issues).toContainEqual(expect.objectContaining({ code: 'tvds-low-contrast', severity: 'warning' }));
  });
});
