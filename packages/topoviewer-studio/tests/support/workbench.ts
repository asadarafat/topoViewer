import { expect, type Locator, type Page } from '@playwright/test';

export type StudioWorkspaceName = 'Add' | 'Mapper' | 'Project' | 'Properties';

const edgeTemplateIds = new Set([
  'directional-link',
  'link',
  'parallel-link',
  'parent-link-pipe'
]);

const workspaceRoles: Record<StudioWorkspaceName, { name: string; open?: string; role: 'complementary' | 'navigation' | 'region' }> = {
  Add: { name: 'Add', open: 'Object drawer', role: 'complementary' },
  Mapper: { name: 'Telemetry mapper workspace', open: 'Telemetry rules', role: 'region' },
  Project: { name: 'Project source', role: 'navigation' },
  Properties: { name: 'Properties workspace', open: 'Style selectors', role: 'complementary' }
};

export async function openStudioWorkspace(page: Page, name: StudioWorkspaceName): Promise<Locator> {
  const contract = workspaceRoles[name];
  let workspace = page.getByRole(contract.role, { name: contract.name });
  if (await workspace.isVisible().catch(() => false)) return workspace;

  const source = await ensureProjectSource(page);
  if (name === 'Project') return source;

  const open = source.getByRole('button', { name: contract.open! });
  await expect(open).toBeVisible();
  await open.click();
  workspace = page.getByRole(contract.role, { name: contract.name });
  await expect(workspace).toBeVisible({ timeout: 10_000 });
  return workspace;
}

export async function closeStudioWorkspace(workspace: Locator): Promise<void> {
  const modalWorkspace = await workspace.locator(
    'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " MuiModal-root ")][1]'
  ).count() > 0;
  const activeModals = workspace.page().locator('.MuiModal-root:not(.MuiModal-hidden)');
  await workspace.getByRole('button', { name: 'Collapse workspace panel' }).click();
  await expect(workspace).toBeHidden();
  if (modalWorkspace) await expect(activeModals).toHaveCount(0);
}

export async function activateStudioPaletteTemplate(page: Page, templateId: string): Promise<void> {
  const add = await openStudioWorkspace(page, 'Add');
  await add.getByTestId(`palette-${templateId}`).click();
  if (!edgeTemplateIds.has(templateId)) {
    await waitForStudioCanvasGeometry(page);
    return;
  }

  const canvas = page.getByTestId('studio-canvas');
  await expect(canvas).toHaveAttribute('data-edge-authoring-mode', templateId);
  await expect(canvas.locator('.topoviewer--connectable')).toBeVisible();
  await waitForStudioCanvasGeometry(page);
}

export async function waitForStudioCanvasGeometry(page: Page): Promise<void> {
  const viewport = page.getByTestId('studio-canvas').locator('.react-flow__viewport');
  await expect(viewport).toBeVisible();
  await viewport.evaluate((element) => new Promise<void>((resolve) => {
    const startedAt = performance.now();
    let previous = '';
    let stableFrames = 0;

    const sample = () => {
      const canvas = element.closest('[data-testid="studio-canvas"]');
      const bounds = canvas?.getBoundingClientRect();
      const signature = [
        bounds?.x,
        bounds?.y,
        bounds?.width,
        bounds?.height,
        getComputedStyle(element).transform
      ].join(':');
      stableFrames = signature === previous ? stableFrames + 1 : 0;
      previous = signature;
      if (performance.now() - startedAt >= 180 && stableFrames >= 4) {
        resolve();
        return;
      }
      requestAnimationFrame(sample);
    };

    requestAnimationFrame(sample);
  }));
}

async function ensureProjectSource(page: Page): Promise<Locator> {
  let source = page.getByRole('navigation', { name: 'Project source' });
  if (await source.isVisible().catch(() => false)) return source;

  const closeContext = page.getByRole('button', { name: 'Collapse workspace panel' });
  if (await closeContext.isVisible().catch(() => false)) {
    await closeContext.click();
    await expect(closeContext).toBeHidden();
  }

  const trigger = page.getByRole('button', { name: 'Open project source' });
  await expect(source.or(trigger)).toBeVisible({ timeout: 10_000 });
  if (await source.isVisible().catch(() => false)) return source;
  await trigger.click();
  source = page.getByRole('navigation', { name: 'Project source' });
  await expect(source).toBeVisible();
  return source;
}

export async function openPropertiesCodeDocument(page: Page, document: 'stylesheet' | 'topology'): Promise<Locator> {
  const source = await ensureProjectSource(page);
  await source.getByRole('button', { name: `${document}.yaml` }).click();
  const workspace = page.getByTestId('studio-source-pane');
  await expect(workspace.locator('.monaco-editor')).toBeVisible();
  await expect(workspace.getByLabel(`${document} YAML editor`)).toHaveCount(1);
  return workspace;
}

export async function openMapperCode(page: Page): Promise<Locator> {
  const source = await ensureProjectSource(page);
  await source.getByRole('button', { name: 'mapper.yaml' }).click();
  const workspace = page.getByTestId('studio-source-pane');
  await expect(workspace.getByLabel('mapper YAML editor')).toBeVisible();
  return workspace;
}
