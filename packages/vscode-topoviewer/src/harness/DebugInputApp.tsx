import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './debug.css';

type DebugEvent = {
  id: number;
  kind: string;
  detail: string;
  time: string;
};

const buttonNames = ['Left', 'Middle', 'Right', 'Back', 'Forward'];

function formatTime() {
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false
  }).format(new Date());
}

function keyLabel(event: KeyboardEvent) {
  if (event.key === ' ') return 'Space';
  if (event.key === 'Escape') return 'Esc';
  if (event.key === 'Meta') return 'Cmd';
  if (event.key === 'ArrowUp') return '↑';
  if (event.key === 'ArrowRight') return '→';
  if (event.key === 'ArrowDown') return '↓';
  if (event.key === 'ArrowLeft') return '←';
  return event.key.length === 1 ? event.key.toUpperCase() : event.key;
}

function modifierPrefix(event: KeyboardEvent | PointerEvent | WheelEvent | MouseEvent) {
  return [
    event.metaKey ? 'Cmd' : '',
    event.ctrlKey ? 'Ctrl' : '',
    event.altKey ? 'Alt' : '',
    event.shiftKey ? 'Shift' : ''
  ].filter(Boolean);
}

function pointerDetail(event: PointerEvent | MouseEvent) {
  const pointerType = 'pointerType' in event ? event.pointerType : 'mouse';
  const button = event.button >= 0 ? buttonNames[event.button] || `Button ${event.button}` : 'Move';
  return `${pointerType} ${button} at ${Math.round(event.clientX)}, ${Math.round(event.clientY)}`;
}

function isPrintableKey(event: KeyboardEvent) {
  return event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey;
}

function useInputDebugRecorder() {
  const eventIdRef = useRef(0);
  const moveLoggedAtRef = useRef(0);
  const pointerFrameRef = useRef<number | undefined>();
  const pendingPointerRef = useRef<{ buttons: number; x: number; y: number } | undefined>();
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<DebugEvent>({
    id: 0,
    kind: 'Ready',
    detail: 'Press keys, click, drag, or scroll anywhere on this page.',
    time: formatTime()
  });
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [mouseButtons, setMouseButtons] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [typedText, setTypedText] = useState('');

  const record = useCallback((kind: string, detail: string) => {
    const nextEvent = {
      id: eventIdRef.current += 1,
      kind,
      detail,
      time: formatTime()
    };
    setLastEvent(nextEvent);
    setEvents((current) => [nextEvent, ...current].slice(0, 24));
  }, []);

  useEffect(() => {
    const pressed = new Set<string>();
    const syncPressedKeys = () => setPressedKeys([...pressed].sort((a, b) => a.localeCompare(b)));

    const syncPointer = (event: PointerEvent, immediate = false) => {
      pendingPointerRef.current = {
        buttons: event.buttons,
        x: event.clientX,
        y: event.clientY
      };
      const flushPointer = () => {
        pointerFrameRef.current = undefined;
        const pending = pendingPointerRef.current;
        if (!pending) return;
        setMouseButtons(pending.buttons);
        setPointer({ x: pending.x, y: pending.y });
      };
      if (immediate) {
        if (pointerFrameRef.current !== undefined) {
          cancelAnimationFrame(pointerFrameRef.current);
          pointerFrameRef.current = undefined;
        }
        flushPointer();
        return;
      }
      if (pointerFrameRef.current !== undefined) return;
      pointerFrameRef.current = requestAnimationFrame(flushPointer);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const label = keyLabel(event);
      pressed.add(label);
      syncPressedKeys();
      const chord = [...modifierPrefix(event), label].filter((value, index, list) => list.indexOf(value) === index).join(' + ');
      record(event.repeat ? 'Key repeat' : 'Key down', chord || label);
      if (isPrintableKey(event)) setTypedText((current) => `${current}${event.key}`);
      if (event.key === 'Backspace') setTypedText((current) => current.slice(0, -1));
      if (event.key === 'Enter') setTypedText((current) => `${current}\n`);
      if (event.key === 'Escape') setTypedText('');
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const label = keyLabel(event);
      pressed.delete(label);
      syncPressedKeys();
      record('Key up', label);
    };

    const onPointerDown = (event: PointerEvent) => {
      syncPointer(event, true);
      record('Pointer down', pointerDetail(event));
    };

    const onPointerUp = (event: PointerEvent) => {
      syncPointer(event, true);
      record('Pointer up', pointerDetail(event));
    };

    const onPointerMove = (event: PointerEvent) => {
      syncPointer(event);
      if (!event.buttons) return;
      const now = performance.now();
      if (now - moveLoggedAtRef.current < 120) return;
      moveLoggedAtRef.current = now;
      record('Drag move', pointerDetail(event));
    };

    const onClick = (event: MouseEvent) => record('Click', pointerDetail(event));
    const onWheel = (event: WheelEvent) => record('Wheel', `${event.deltaY > 0 ? 'Down' : 'Up'} ${Math.round(Math.abs(event.deltaY))}`);
    const onBlur = () => {
      pressed.clear();
      syncPressedKeys();
      setMouseButtons(0);
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('pointerup', onPointerUp, true);
    window.addEventListener('pointermove', onPointerMove, true);
    window.addEventListener('click', onClick, true);
    window.addEventListener('wheel', onWheel, { capture: true, passive: true });
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('pointerup', onPointerUp, true);
      window.removeEventListener('pointermove', onPointerMove, true);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('wheel', onWheel, true);
      window.removeEventListener('blur', onBlur);
      if (pointerFrameRef.current !== undefined) {
        cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = undefined;
      }
    };
  }, [record]);

  const activeButtons = useMemo(() => buttonNames.filter((_name, index) => mouseButtons & (1 << index)), [mouseButtons]);

  return {
    activeButtons,
    clear: () => {
      setEvents([]);
      setTypedText('');
      record('Clear', 'Event log cleared');
    },
    events,
    lastEvent,
    pointer,
    pressedKeys,
    typedText
  };
}

export function DebugInputOverlay() {
  const {
    activeButtons,
    clear,
    events,
    lastEvent,
    pointer,
    pressedKeys,
    typedText
  } = useInputDebugRecorder();

  return (
    <aside className="topoviewer-debug-overlay" aria-label="Live input debug overlay">
      <div className="topoviewer-debug-overlay-header">
        <span>Live input</span>
        <button type="button" onClick={clear}>Clear</button>
      </div>
      <div className="topoviewer-debug-overlay-last">
        <strong>{lastEvent.kind}</strong>
        <p>{lastEvent.detail}</p>
        <small>{lastEvent.time}</small>
      </div>
      <dl className="topoviewer-debug-overlay-meta">
        <div>
          <dt>Keys</dt>
          <dd>{pressedKeys.length ? pressedKeys.join(' + ') : 'None'}</dd>
        </div>
        <div>
          <dt>Mouse</dt>
          <dd>{activeButtons.length ? activeButtons.join(' + ') : 'No button'} · {Math.round(pointer.x)}, {Math.round(pointer.y)}</dd>
        </div>
        <div>
          <dt>Typed</dt>
          <dd>{typedText ? typedText.replace(/\n/g, ' ↵ ') : 'Empty'}</dd>
        </div>
      </dl>
      <ol className="topoviewer-debug-overlay-log">
        {events.slice(0, 7).map((event) => (
          <li key={event.id}>
            <time>{event.time}</time>
            <strong>{event.kind}</strong>
            <span>{event.detail}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

export function DebugInputApp() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const {
    activeButtons,
    clear,
    events,
    lastEvent,
    pointer,
    pressedKeys,
    typedText
  } = useInputDebugRecorder();

  useEffect(() => {
    stageRef.current?.focus();
  }, []);

  return (
    <main className="topoviewer-debug-shell">
      <section className="topoviewer-debug-stage" ref={stageRef} tabIndex={0} aria-label="Input debug capture stage">
        <div className="topoviewer-debug-hero">
          <div className="topoviewer-debug-kicker">TopoViewer harness debug</div>
          <h1>Keyboard and mouse recorder</h1>
          <p>Use this page while recording to show exactly what is pressed, clicked, dragged, or typed.</p>
        </div>
        <div className="topoviewer-debug-grid">
          <article className="topoviewer-debug-card topoviewer-debug-last">
            <span>Last event</span>
            <strong>{lastEvent.kind}</strong>
            <p>{lastEvent.detail}</p>
            <small>{lastEvent.time}</small>
          </article>
          <article className="topoviewer-debug-card">
            <span>Pressed keys</span>
            <div className="topoviewer-debug-chips">
              {pressedKeys.length ? pressedKeys.map((key) => <kbd key={key}>{key}</kbd>) : <em>None</em>}
            </div>
          </article>
          <article className="topoviewer-debug-card">
            <span>Mouse</span>
            <strong>{activeButtons.length ? activeButtons.join(' + ') : 'No button'}</strong>
            <p>{Math.round(pointer.x)}, {Math.round(pointer.y)}</p>
          </article>
          <article className="topoviewer-debug-card topoviewer-debug-text">
            <span>Typed text</span>
            <pre>{typedText || 'Start typing. Backspace edits. Esc clears.'}</pre>
          </article>
        </div>
        <article className="topoviewer-debug-card topoviewer-debug-log">
          <div className="topoviewer-debug-log-header">
            <span>Recent events</span>
            <button type="button" onClick={() => {
              clear();
              stageRef.current?.focus();
            }}>Clear</button>
          </div>
          <ol>
            {events.map((event) => (
              <li key={event.id}>
                <time>{event.time}</time>
                <strong>{event.kind}</strong>
                <span>{event.detail}</span>
              </li>
            ))}
          </ol>
        </article>
      </section>
    </main>
  );
}
