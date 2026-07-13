import { expect, type Locator, type Page } from '@playwright/test';

export type StudioWorkspaceName = 'Topo' | 'Object' | 'Style' | 'Viewport' | 'Mapper';

const workspaceRoles: Record<StudioWorkspaceName, { name: string; role: 'complementary' | 'region' }> = {
  Mapper: { name: 'Telemetry mapper workspace', role: 'region' },
  Object: { name: 'Object properties', role: 'complementary' },
  Style: { name: 'Style workspace', role: 'complementary' },
  Topo: { name: 'Object palette', role: 'complementary' },
  Viewport: { name: 'Viewport workspace', role: 'complementary' }
};

export async function openStudioWorkspace(page: Page, name: StudioWorkspaceName): Promise<Locator> {
  let rail = page.getByRole('tablist', { name: 'Workspace views' });
  if (!await rail.isVisible().catch(() => false)) {
    const open = page.getByRole('button', { name: 'Open workspace panel' });
    if (await open.isVisible().catch(() => false)) await open.click();
    rail = page.getByRole('tablist', { name: 'Workspace views' });
  }
  const tab = rail.getByRole('tab', { name });
  if (await tab.getAttribute('aria-selected') !== 'true') await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  const contract = workspaceRoles[name];
  const workspace = page.getByRole(contract.role, { name: contract.name });
  await expect(workspace).toBeVisible();
  return workspace;
}
