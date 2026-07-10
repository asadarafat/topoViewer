import { useEffect, useRef, type KeyboardEvent } from 'react';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

function focusableElements(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(focusableSelector)]
    .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
}

interface DialogFocusOptions {
  active?: boolean;
  initialFocus?: string;
  onDismiss?: () => void;
  restoreFocus?: boolean;
}

export function useDialogFocus<T extends HTMLElement>({
  active = true,
  initialFocus,
  onDismiss,
  restoreFocus = true
}: DialogFocusOptions = {}) {
  const dialogRef = useRef<T>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return undefined;
    returnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const frame = requestAnimationFrame(() => {
      const container = dialogRef.current;
      if (!container) return;
      const requested = initialFocus ? container.querySelector<HTMLElement>(initialFocus) : null;
      (requested || focusableElements(container)[0] || container).focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      const target = returnFocusRef.current;
      if (restoreFocus && target?.isConnected) queueMicrotask(() => target.focus());
    };
  }, [active, initialFocus, restoreFocus]);

  function onDialogKeyDown(event: KeyboardEvent<T>) {
    if (event.key === 'Escape' && onDismiss) {
      event.preventDefault();
      event.stopPropagation();
      onDismiss();
      return;
    }
    if (event.key !== 'Tab') return;
    const container = dialogRef.current;
    if (!container) return;
    const elements = focusableElements(container);
    if (!elements.length) {
      event.preventDefault();
      container.focus();
      return;
    }
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return { dialogRef, onDialogKeyDown };
}

export function focusFirstAvailable(container: HTMLElement | null) {
  const first = container ? focusableElements(container)[0] : undefined;
  first?.focus();
  return Boolean(first);
}
