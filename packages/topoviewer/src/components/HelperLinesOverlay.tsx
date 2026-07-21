import { useViewport } from '@xyflow/react';
import { useEffect, useRef } from 'react';
import { emptyHelperLineState, helperLineStatesEqual, type HelperLineState } from './helperLines';

export interface HelperLineStore {
  clear(): void;
  getSnapshot(): HelperLineState;
  set(lines: HelperLineState): void;
  subscribe(listener: () => void): () => void;
}

export function createHelperLineStore(): HelperLineStore {
  let snapshot = emptyHelperLineState;
  const listeners = new Set<() => void>();
  const set = (lines: HelperLineState) => {
    if (helperLineStatesEqual(snapshot, lines)) return;
    snapshot = lines;
    listeners.forEach((listener) => listener());
  };
  return {
    clear: () => set(emptyHelperLineState),
    getSnapshot: () => snapshot,
    set,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

function hasLines(lines: HelperLineState): boolean {
  return Boolean(lines.vertical || lines.horizontal);
}

export function HelperLinesOverlay({ store }: { store: HelperLineStore }) {
  const viewport = useViewport();
  const viewportRef = useRef(viewport);
  const rootRef = useRef<HTMLDivElement>(null);
  viewportRef.current = viewport;

  useEffect(() => {
    let renderFrame: number | undefined;
    const render = () => {
      const lines = store.getSnapshot();
      const currentViewport = viewportRef.current;
      const root = rootRef.current;
      if (!root) return;
      root.hidden = !hasLines(lines);
      const syncLine = (
        orientation: 'horizontal' | 'vertical',
        line: HelperLineState['horizontal'] | HelperLineState['vertical'],
        transform: string
      ) => {
        let element = root.querySelector<HTMLDivElement>(`.topoviewer-helper-line-${orientation}`);
        if (!line) {
          element?.remove();
          return;
        }
        if (!element) {
          element = document.createElement('div');
          element.className = `topoviewer-helper-line topoviewer-helper-line-${orientation}`;
          root.append(element);
        }
        element.dataset.helperLineKind = line.kind;
        element.style.transform = transform;
      };
      const verticalX = lines.vertical ? lines.vertical.value * currentViewport.zoom + currentViewport.x : 0;
      const horizontalY = lines.horizontal ? lines.horizontal.value * currentViewport.zoom + currentViewport.y : 0;
      syncLine('vertical', lines.vertical, `translate3d(${verticalX}px, 0, 0)`);
      syncLine('horizontal', lines.horizontal, `translate3d(0, ${horizontalY}px, 0)`);
    };
    const scheduleRender = () => {
      if (renderFrame !== undefined) return;
      renderFrame = requestAnimationFrame(() => {
        renderFrame = undefined;
        render();
      });
    };
    render();
    const unsubscribe = store.subscribe(scheduleRender);
    return () => {
      unsubscribe();
      if (renderFrame !== undefined) cancelAnimationFrame(renderFrame);
    };
  }, [store, viewport]);

  return (
    <div className="topoviewer-helper-lines" aria-hidden="true" hidden ref={rootRef} />
  );
}
