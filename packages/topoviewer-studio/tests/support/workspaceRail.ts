import { expect, type Locator, type Page } from '@playwright/test';

export type StudioWorkspaceName = 'Add' | 'Mapper' | 'Project' | 'Properties';

const workspaceRoles: Record<StudioWorkspaceName, { name: string; role: 'complementary' | 'navigation' | 'region'; tab?: string }> = {
  Add: { name: 'Add', role: 'complementary' },
  Mapper: { name: 'Telemetry mapper workspace', role: 'region' },
  Project: { name: 'Project navigator', role: 'navigation' },
  Properties: { name: 'Properties workspace', role: 'complementary' }
};

export async function openStudioWorkspace(page: Page, name: StudioWorkspaceName): Promise<Locator> {
  const contract = workspaceRoles[name];
  let workspace = page.getByRole(contract.role, { name: contract.name });
  let rail = page.getByRole('tablist', { name: 'Workspace views' });
  if (!(await workspace.isVisible().catch(() => false))) {
    const open = page.getByRole('button', { name: 'Open workspace panel' });
    if (await open.isVisible().catch(() => false)) await open.click();
    rail = page.getByRole('tablist', { name: 'Workspace views' });
  }
  const tab = rail.getByRole('tab', { name: contract.tab || name });
  if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  workspace = page.getByRole(contract.role, { name: contract.name });
  await expect(workspace).toBeVisible({ timeout: 10_000 });
  return workspace;
}

export async function activateStudioPaletteTemplate(page: Page, templateId: string): Promise<void> {
  const add = await openStudioWorkspace(page, 'Add');
  await add.getByTestId(`palette-${templateId}`).click();
}

export async function openPropertiesCodeDocument(page: Page, document: 'stylesheet' | 'topology'): Promise<Locator> {
  const workspace = await openStudioWorkspace(page, 'Properties');
  const representations = workspace.getByRole('group', { name: 'Properties representation' });
  const code = representations.getByRole('button', { name: 'Code' });
  if ((await code.getAttribute('aria-pressed')) !== 'true') await code.click();
  const tab = workspace.getByRole('tablist', { name: 'Code documents' }).getByRole('tab', { name: `${document}.yaml` });
  if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click();
  await expect(workspace.locator('.monaco-editor')).toBeVisible();
  await expect(workspace.getByLabel(`${document} YAML editor`)).toHaveCount(1);
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
