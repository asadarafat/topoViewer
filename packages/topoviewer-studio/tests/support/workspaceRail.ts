import { expect, type Locator, type Page } from '@playwright/test';

export type StudioWorkspaceName = 'Objects' | 'Edit' | 'Properties' | 'Style' | 'Viewport' | 'Mapper';

const workspaceRoles: Record<StudioWorkspaceName, { name: string; role: 'complementary' | 'region'; tab?: string }> = {
  Edit: { name: 'Edit workspace', role: 'complementary' },
  Mapper: { name: 'Telemetry mapper workspace', role: 'region' },
  Objects: { name: 'Objects', role: 'complementary' },
  Properties: { name: 'Edit workspace', role: 'complementary', tab: 'Edit' },
  Style: { name: 'Edit workspace', role: 'complementary', tab: 'Edit' },
  Viewport: { name: 'Viewport workspace', role: 'complementary' }
};

export async function openStudioWorkspace(page: Page, name: StudioWorkspaceName): Promise<Locator> {
  let rail = page.getByRole('tablist', { name: 'Workspace views' });
  if (!(await rail.isVisible().catch(() => false))) {
    const open = page.getByRole('button', { name: 'Open workspace panel' });
    if (await open.isVisible().catch(() => false)) await open.click();
    rail = page.getByRole('tablist', { name: 'Workspace views' });
  }
  const contract = workspaceRoles[name];
  const tab = rail.getByRole('tab', { name: contract.tab || name });
  if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  const workspace = page.getByRole(contract.role, { name: contract.name });
  await expect(workspace).toBeVisible();
  return workspace;
}

export async function openEditCodeDocument(page: Page, document: 'stylesheet' | 'topology'): Promise<Locator> {
  const workspace = await openStudioWorkspace(page, 'Edit');
  const representations = workspace.getByRole('group', { name: 'Edit representation' });
  const code = representations.getByRole('button', { name: 'Code' });
  if ((await code.getAttribute('aria-pressed')) !== 'true') await code.click();
  const tab = workspace.getByRole('tablist', { name: 'Code documents' }).getByRole('tab', { name: `${document}.yaml` });
  if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click();
  await expect(workspace.getByLabel(`${document} YAML editor`)).toBeVisible();
  return workspace;
}

export async function openMapperCode(page: Page): Promise<Locator> {
  const workspace = await openStudioWorkspace(page, 'Mapper');
  const representations = workspace.getByRole('group', { name: 'Mapper representation' });
  const code = representations.getByRole('button', { name: 'Code' });
  if ((await code.getAttribute('aria-pressed')) !== 'true') await code.click();
  await expect(workspace.getByLabel('mapper YAML editor')).toBeVisible();
  return workspace;
}
