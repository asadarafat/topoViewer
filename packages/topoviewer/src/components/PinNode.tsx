import { Handle, Position } from '@xyflow/react';

export function PinNode() {
  return (
    <div className="topoviewer-pin" aria-hidden="true">
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
