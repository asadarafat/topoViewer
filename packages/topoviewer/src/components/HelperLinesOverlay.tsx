import { useViewport } from '@xyflow/react';
import type { HelperLineState } from './helperLines';

function hasLines(lines: HelperLineState): boolean {
  return Boolean(lines.vertical || lines.horizontal);
}

export function HelperLinesOverlay({ lines }: { lines: HelperLineState }) {
  const viewport = useViewport();
  if (!hasLines(lines)) return null;

  const verticalX = lines.vertical ? lines.vertical.value * viewport.zoom + viewport.x : undefined;
  const horizontalY = lines.horizontal ? lines.horizontal.value * viewport.zoom + viewport.y : undefined;

  return (
    <div className="topoviewer-helper-lines" aria-hidden="true">
      {verticalX !== undefined ? (
        <div
          className="topoviewer-helper-line topoviewer-helper-line-vertical"
          data-helper-line-kind={lines.vertical?.kind}
          style={{ transform: `translateX(${verticalX}px)` }}
        />
      ) : null}
      {horizontalY !== undefined ? (
        <div
          className="topoviewer-helper-line topoviewer-helper-line-horizontal"
          data-helper-line-kind={lines.horizontal?.kind}
          style={{ transform: `translateY(${horizontalY}px)` }}
        />
      ) : null}
    </div>
  );
}
