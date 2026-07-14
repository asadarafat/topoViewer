import { describe, expect, it } from 'vitest';
import { shapeConnectionPorts } from '../../src/components/shapeConnectionHandles';

function activePorts(shape: Parameters<typeof shapeConnectionPorts>[0], polygonPoints?: string) {
  return shapeConnectionPorts(shape, polygonPoints).filter((port) => port.active);
}

describe('shape-aware connection ports', () => {
  it('exposes four cardinal ports for rectangular and circular nodes', () => {
    expect(activePorts('roundRectangle')).toMatchObject([
      { id: 'shape-port-1', x: 50, y: 0 },
      { id: 'shape-port-2', x: 100, y: 50 },
      { id: 'shape-port-3', x: 50, y: 100 },
      { id: 'shape-port-4', x: 0, y: 50 }
    ]);
    expect(activePorts('circle')).toHaveLength(4);
  });

  it('follows polygon geometry for hexagons and octagons', () => {
    expect(activePorts('hexagon')).toHaveLength(6);
    expect(activePorts('octagon')).toHaveLength(8);
  });

  it('keeps eight stable compatibility IDs when visible geometry changes', () => {
    const square = shapeConnectionPorts('square');
    const hexagon = shapeConnectionPorts('hexagon');
    expect(square).toHaveLength(8);
    expect(hexagon.map((port) => port.id)).toEqual(square.map((port) => port.id));
    expect(square.filter((port) => port.active)).toHaveLength(4);
  });

  it('uses custom polygon points without creating an unbounded number of handles', () => {
    const points = '50,0 75,8 96,28 100,50 96,72 75,92 50,100 25,92 4,72 0,50 4,28 25,8';
    expect(activePorts('polygon', points)).toHaveLength(8);
    expect(shapeConnectionPorts('polygon', points)).toHaveLength(8);
  });
});
