import { describe, expect, it } from 'vitest';
import { linkDirectionGeometryForPath, pathToPolylinePoints, trimPolylinePathEnd } from '../../src/core/linkDirectionGeometry';

function pathNumbers(path: string): number[] {
  return (path.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || []).map(Number);
}

describe('link direction geometry', () => {
  it('splits a straight physical link into two opposing strokes with center and start gaps', () => {
    const geometry = linkDirectionGeometryForPath('M 0,0 L 200,0', { x: 0, y: 0 }, 20, 40);

    expect(geometry).toBeDefined();
    expect(pathNumbers(geometry!.sourceToTarget.path)).toEqual([20, 0, 80, 0]);
    expect(pathNumbers(geometry!.targetToSource.path)).toEqual([180, 0, 120, 0]);
    expect(geometry!.sourceToTarget.normal).toEqual({ x: -0, y: 1 });
  });

  it('keeps direction strokes inside an already offset physical link corridor', () => {
    const geometry = linkDirectionGeometryForPath('M 0,0 L 200,0', { x: 0, y: 14 }, 20, 40);

    expect(pathNumbers(geometry!.sourceToTarget.path)).toEqual([20, 14, 80, 14]);
    expect(pathNumbers(geometry!.targetToSource.path)).toEqual([180, 14, 120, 14]);
  });

  it('samples curved parent routes so direction strokes follow the parent curve', () => {
    const points = pathToPolylinePoints('M 0,0 Q 100,80 200,0');
    const geometry = linkDirectionGeometryForPath('M 0,0 Q 100,80 200,0', { x: 0, y: 0 }, 12, 32);

    expect(points.length).toBeGreaterThan(8);
    expect(geometry).toBeDefined();
    expect(geometry!.sourceToTarget.path.split('L').length).toBeGreaterThan(2);
    expect(geometry!.targetToSource.path.split('L').length).toBeGreaterThan(2);
    expect(geometry!.sourceToTarget.center.y).toBeGreaterThan(0);
    expect(geometry!.targetToSource.center.y).toBeGreaterThan(0);
  });

  it('samples cubic parent routes used by smooth routed edges', () => {
    const points = pathToPolylinePoints('M 0,0 C 60,90 140,90 200,0');
    const geometry = linkDirectionGeometryForPath('M 0,0 C 60,90 140,90 200,0', { x: 0, y: 0 }, 12, 36);

    expect(points.length).toBeGreaterThan(12);
    expect(geometry).toBeDefined();
    expect(geometry!.sourceToTarget.path.split('L').length).toBeGreaterThan(2);
    expect(geometry!.targetToSource.path.split('L').length).toBeGreaterThan(2);
    expect(geometry!.sourceToTarget.center.y).toBeGreaterThan(0);
    expect(geometry!.targetToSource.center.y).toBeGreaterThan(0);
  });

  it('parses routed orthogonal paths for taxi and segment-like edges', () => {
    const geometry = linkDirectionGeometryForPath('M 0,0 L 80,0 L 80,120 L 200,120', { x: 0, y: 0 }, 10, 30);

    expect(geometry).toBeDefined();
    expect(geometry!.sourceToTarget.path).toContain('L 80,0');
    expect(geometry!.targetToSource.path).toContain('L 80,120');
  });

  it('parses horizontal and vertical path commands from routed edges', () => {
    const points = pathToPolylinePoints('M 0,0 H 80 V 120 H 200');
    const geometry = linkDirectionGeometryForPath('M 0,0 H 80 V 120 H 200', { x: 0, y: 0 }, 10, 30);

    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 120 },
      { x: 200, y: 120 }
    ]);
    expect(geometry).toBeDefined();
    expect(geometry!.sourceToTarget.path).toContain('L 80,0');
    expect(geometry!.targetToSource.path).toContain('L 80,120');
  });

  it('trims only the visible end of a directional stroke before the marker body', () => {
    expect(pathNumbers(trimPolylinePathEnd('M 20,0 L 80,0', 12))).toEqual([20, 0, 68, 0]);
    expect(pathNumbers(trimPolylinePathEnd('M 180,0 L 120,0', 12))).toEqual([180, 0, 132, 0]);
  });
});
