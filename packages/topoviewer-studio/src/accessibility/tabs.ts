import type { KeyboardEvent } from 'react';

export function handleRovingTabKey(event: KeyboardEvent<HTMLElement>) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const tabList = event.currentTarget.closest<HTMLElement>('[role="tablist"]');
  if (!tabList) return;
  const tabs = [...tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')];
  const current = tabs.indexOf(event.currentTarget as HTMLButtonElement);
  if (current < 0 || !tabs.length) return;
  event.preventDefault();
  const next = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? tabs.length - 1
      : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[next].focus();
  tabs[next].click();
}
