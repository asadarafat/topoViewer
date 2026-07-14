import { useEffect, type RefObject } from 'react';

const COARSE_PIXEL_DELTA = 40;
const LINE_DELTA_PIXELS = 40;
const SETTLE_DELAY_MS = 400;

function wheelDeltaPixels(event: WheelEvent, viewportHeight: number) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * LINE_DELTA_PIXELS;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * viewportHeight * 0.9;
  return event.deltaY;
}

function shouldSmooth(event: WheelEvent) {
  if (event.defaultPrevented || event.ctrlKey || event.deltaY === 0) return false;
  if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return false;
  return event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL || Math.abs(event.deltaY) >= COARSE_PIXEL_DELTA;
}

/** Smooths coarse mouse-wheel steps while preserving native trackpad scrolling. */
export function useCoarseWheelScroll<T extends HTMLElement>(ref: RefObject<T | null>, enabled = true) {
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return undefined;
    const scrollElement: T = element;

    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let smoothing = false;
    let targetScrollTop = scrollElement.scrollTop;

    function settle() {
      smoothing = false;
      targetScrollTop = scrollElement.scrollTop;
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = undefined;
    }

    function cancel() {
      if (!smoothing) return;
      const currentScrollTop = scrollElement.scrollTop;
      settle();
      scrollElement.scrollTo({ behavior: 'auto', top: currentScrollTop });
    }

    function handleWheel(event: WheelEvent) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !shouldSmooth(event)) {
        cancel();
        return;
      }

      const maximum = Math.max(0, scrollElement.scrollHeight - scrollElement.clientHeight);
      const maximumStep = scrollElement.clientHeight * 0.9;
      const rawDelta = wheelDeltaPixels(event, scrollElement.clientHeight);
      const delta = Math.max(-maximumStep, Math.min(maximumStep, rawDelta));
      const origin = smoothing ? targetScrollTop : scrollElement.scrollTop;
      const nextTarget = Math.max(0, Math.min(maximum, origin + delta));
      if (nextTarget === origin) return;

      event.preventDefault();
      smoothing = true;
      targetScrollTop = nextTarget;
      scrollElement.scrollTo({ behavior: 'smooth', top: targetScrollTop });
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, SETTLE_DELAY_MS);
    }

    function handleScroll() {
      if (!smoothing) targetScrollTop = scrollElement.scrollTop;
    }

    scrollElement.addEventListener('wheel', handleWheel, { passive: false });
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    scrollElement.addEventListener('pointerdown', cancel, { passive: true });
    scrollElement.addEventListener('keydown', cancel);
    return () => {
      if (settleTimer) clearTimeout(settleTimer);
      scrollElement.removeEventListener('wheel', handleWheel);
      scrollElement.removeEventListener('scroll', handleScroll);
      scrollElement.removeEventListener('pointerdown', cancel);
      scrollElement.removeEventListener('keydown', cancel);
    };
  }, [enabled, ref]);
}
