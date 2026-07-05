import { useEffect } from 'react';

interface RenderProfileEvent {
  component: string;
  count: number;
  detail?: Record<string, unknown>;
  timestamp: number;
}

interface RenderProfileState {
  counts: Record<string, number>;
  events: RenderProfileEvent[];
}

type ProfileWindow = Window & {
  __topoviewerRenderProfile?: RenderProfileState;
  __topoviewerRenderProfileEnabled?: boolean;
};

const maxEvents = 300;

function profileWindow(): ProfileWindow | undefined {
  return typeof window === 'undefined' ? undefined : window as ProfileWindow;
}

export function isRenderProfileEnabled() {
  const target = profileWindow();
  if (!target) return false;
  if (target.__topoviewerRenderProfileEnabled) return true;
  try {
    return new URLSearchParams(target.location.search).get('profile') === '1';
  } catch {
    return false;
  }
}

export function recordRenderProfile(component: string, detail?: Record<string, unknown>) {
  const target = profileWindow();
  if (!target || !isRenderProfileEnabled()) return;
  const state = target.__topoviewerRenderProfile || { counts: {}, events: [] };
  const count = (state.counts[component] || 0) + 1;
  state.counts[component] = count;
  state.events.push({
    component,
    count,
    detail,
    timestamp: Date.now()
  });
  if (state.events.length > maxEvents) {
    state.events.splice(0, state.events.length - maxEvents);
  }
  target.__topoviewerRenderProfile = state;
}

export function useRenderProfile(component: string, detail?: Record<string, unknown>) {
  useEffect(() => {
    recordRenderProfile(component, detail);
  });
}
