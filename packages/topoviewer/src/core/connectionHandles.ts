export const SHAPE_CONNECTION_PORT_COUNT = 8;

export function shapeConnectionPortId(index: number): string {
  return `shape-port-${index + 1}`;
}

export function implicitShapeConnectionPortIds(): string[] {
  return Array.from({ length: SHAPE_CONNECTION_PORT_COUNT }, (_value, index) => shapeConnectionPortId(index));
}
