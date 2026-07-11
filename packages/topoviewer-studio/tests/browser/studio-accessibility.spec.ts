import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function expectNoBlockingViolations(page: Page, state: string) {
  const result = await new AxeBuilder({ page }).analyze();
  expect(
    result.violations,
    `${state}\n${result.violations.map((violation) => `${violation.id}: ${violation.help}`).join('\n')}`
  ).toEqual([]);
}

async function expectControlAffordances(page: Page, state: string) {
  const findings = await page.locator('button:visible').evaluateAll((buttons) => buttons.flatMap((button) => {
    const box = button.getBoundingClientRect();
    const name = button.getAttribute('aria-label') || button.textContent?.trim() || 'unnamed button';
    const issues: string[] = [];
    if (box.width < 24 || box.height < 24) issues.push(`${name} target is ${box.width}x${box.height}`);
    if (!button.textContent?.trim() && !button.getAttribute('title')) issues.push(`${name} has no tooltip`);
    return issues;
  }));
  expect(findings, state).toEqual([]);
}

async function createByKeyboard(page: Page, template: string) {
  await page.getByTestId(`palette-${template}`).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('studio-canvas')).toBeFocused();
}

function liveAnnouncement(page: Page) {
  return page.locator('.studio-visually-hidden[aria-live="polite"]');
}

async function selectByKeyboard(page: Page, id: string, additive = false) {
  const object = page.locator(`.react-flow__node[data-id="${id}"]`);
  await object.focus();
  if (additive) await page.keyboard.down('Control');
  await page.keyboard.press('Enter');
  if (additive) await page.keyboard.up('Control');
}

async function emitExternalChange(page: Page) {
  await page.evaluate(async () => {
    const trigger = (window as typeof window & { __topoviewerStudioExternalChange?: () => Promise<void> })
      .__topoviewerStudioExternalChange;
    if (!trigger) throw new Error('External-change test host is unavailable.');
    await trigger();
  });
}

test('passes automated accessibility checks in every major authoring state', async ({ page }) => {
  await page.goto('/');
  await expectNoBlockingViolations(page, 'empty shell');
  await expectControlAffordances(page, 'empty shell controls');

  await createByKeyboard(page, 'router');
  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toHaveAccessibleName('node New Router');
  await expectNoBlockingViolations(page, 'selected object and Inspector');
  const inspector = page.getByRole('complementary', { name: 'Inspector' });
  await inspector.getByRole('tab', { name: 'Styles' }).click();
  await inspector.locator('[data-field-path="shape"]').getByRole('button', { name: 'Shape actions' }).click();
  await expectNoBlockingViolations(page, 'Inspector field action menu');
  await expectControlAffordances(page, 'Inspector tabs and field actions');
  await page.keyboard.press('ArrowDown');
  await expect(inspector.getByRole('menuitem', { name: 'Write default' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(inspector.getByRole('menu')).toHaveCount(0);

  await page.getByRole('button', { name: 'Layers', exact: true }).click();
  await expectNoBlockingViolations(page, 'layers');
  await page.getByRole('button', { name: /^Delete .* layer$/ }).first().click();
  await expectNoBlockingViolations(page, 'layer deletion confirmation');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  await expect(page.getByRole('region', { name: 'Workspace drawer' })).toBeVisible();
  await expectNoBlockingViolations(page, 'source workspace');
  await page.getByRole('region', { name: 'Workspace drawer' }).getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'Open telemetry mapper' }).click();
  await page.getByRole('button', { name: 'Enable telemetry mapper' }).click();
  await expectNoBlockingViolations(page, 'telemetry mapper');
  await expectControlAffordances(page, 'telemetry mapper controls');
  await page.getByRole('button', { name: 'Remove mapper' }).click();
  await expectNoBlockingViolations(page, 'mapper removal confirmation');
  await page.getByRole('alertdialog', { name: 'Remove telemetry mapper' }).getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { exact: true, name: 'Close' }).click();

  await page.getByRole('button', { name: 'Project menu' }).click();
  await expectNoBlockingViolations(page, 'project menu');
  await page.getByRole('dialog', { name: 'Project menu' }).getByRole('button', { name: 'Delete' }).click();
  await expectNoBlockingViolations(page, 'project deletion confirmation');
  await page.getByRole('alertdialog', { name: /Delete/ }).getByRole('button', { name: 'Cancel' }).click();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Open export panel' }).click();
  await expectNoBlockingViolations(page, 'export dialog');
  await expectControlAffordances(page, 'export controls');
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Enter presentation mode' }).click();
  await expectNoBlockingViolations(page, 'presentation mode');
});

test('supports the primary authoring workflow without pointer input', async ({ page }) => {
  await page.goto('/');
  await createByKeyboard(page, 'node');
  await expect(liveAnnouncement(page)).toContainText('Create New Node');
  await createByKeyboard(page, 'node');

  await selectByKeyboard(page, 'node-1');
  await selectByKeyboard(page, 'node-2', true);
  await expect(liveAnnouncement(page)).toContainText('2 objects selected');
  await expect(page.getByRole('button', { name: 'Connect selected nodes' })).toBeEnabled();
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);
  await expect(liveAnnouncement(page)).toContainText('Create link');

  await selectByKeyboard(page, 'node-1');
  await page.getByRole('tab', { name: 'Styles' }).click();
  const width = page.getByRole('spinbutton', { name: 'Body width' });
  const originalWidth = Number(await width.inputValue());
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Alt+Shift+ArrowRight');
  await page.keyboard.press('Alt+Shift+ArrowDown');
  await expect.poll(async () => Number(await width.inputValue())).toBe(originalWidth + 10);
  await expect(liveAnnouncement(page)).toContainText('Resize');

  await selectByKeyboard(page, 'node-1');
  await selectByKeyboard(page, 'node-2', true);
  await createByKeyboard(page, 'region');
  await selectByKeyboard(page, 'node-1');
  await page.keyboard.press('Shift+F10');
  const menu = page.getByRole('menu', { name: 'Selection actions' });
  await expect(menu).toBeVisible();
  for (let index = 0; index < 4; index += 1) await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Release from region' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(menu).toBeHidden();
  await expect(liveAnnouncement(page)).toContainText('Release from region');

  await page.getByRole('button', { name: 'Open telemetry mapper' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Enable telemetry mapper' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('textbox', { name: 'Metric' }).focus();
  await page.keyboard.type('node_health');
  await page.getByRole('button', { name: 'Create rule' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: /node-health-node/ })).toBeVisible();
  await expect(liveAnnouncement(page)).toContainText('Created mapper rule');

  await page.getByRole('button', { exact: true, name: 'Close' }).click();
  await page.getByRole('button', { name: 'Save project' }).focus();
  await page.keyboard.press('Enter');
  await expect(liveAnnouncement(page)).toContainText('Project saved');
});

test('announces parallel and invalid native connection targets without color dependence', async ({ page }) => {
  await page.goto('/');
  await createByKeyboard(page, 'node');
  await createByKeyboard(page, 'node');
  const source = page.locator('.react-flow__node[data-id="node-1"] .topoviewer-node-handle-default');
  const target = page.locator('.react-flow__node[data-id="node-2"] .topoviewer-node-handle-default-target');

  async function dragConnection(targetHandle = target) {
    const sourceBox = await source.boundingBox();
    const targetBox = await targetHandle.boundingBox();
    if (!sourceBox || !targetBox) throw new Error('Connection handles are not measurable.');
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
  }

  await dragConnection();
  await expect(liveAnnouncement(page)).toContainText('Valid connection from node-1 to node-2');
  await page.mouse.up();
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);

  await dragConnection();
  await page.mouse.up();
  await expect(page.locator('.react-flow__edge')).toHaveCount(2);

  await page.getByTestId('palette-callout').dragTo(page.getByTestId('studio-canvas'), { targetPosition: { x: 140, y: 320 } });
  await page.getByTestId('palette-callout').dragTo(page.getByTestId('studio-canvas'), { targetPosition: { x: 440, y: 320 } });
  const calloutSource = page.locator('.react-flow__node[data-id="callout-1"] .react-flow__handle-right');
  const calloutTarget = page.locator('.react-flow__node[data-id="callout-2"] .react-flow__handle-left');
  const calloutSourceBox = await calloutSource.boundingBox();
  const calloutTargetBox = await calloutTarget.boundingBox();
  if (!calloutSourceBox || !calloutTargetBox) throw new Error('Callout handles are not measurable.');
  await page.mouse.move(calloutSourceBox.x + calloutSourceBox.width / 2, calloutSourceBox.y + calloutSourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(calloutTargetBox.x + calloutTargetBox.width / 2, calloutTargetBox.y + calloutTargetBox.height / 2, { steps: 8 });
  await expect(liveAnnouncement(page)).toContainText('Invalid connection from callout-1 to callout-2');
  await page.mouse.up();
  await expect(page.locator('.react-flow__edge')).toHaveCount(2);
});

test('contains and restores focus across dialogs, drawers, tabs, and presentation', async ({ page }) => {
  await page.goto('/');
  await createByKeyboard(page, 'node');

  const sourceTrigger = page.getByRole('button', { name: 'Open workspace drawer' });
  await sourceTrigger.focus();
  await page.keyboard.press('Enter');
  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  const yamlTab = drawer.getByRole('tab', { exact: true, name: 'YAML' });
  await yamlTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(drawer.getByRole('tab', { name: 'Diagnostics' })).toBeFocused();
  await drawer.getByRole('button', { name: 'Close' }).click();
  await expect(sourceTrigger).toBeFocused();

  const exportTrigger = page.getByRole('button', { name: 'Open export panel' });
  await exportTrigger.focus();
  await page.keyboard.press('Enter');
  const exportDialog = page.getByRole('dialog', { name: 'Export project' });
  await expect(exportDialog.getByRole('button', { name: 'Close export panel' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(exportDialog.getByRole('button', { name: 'Export PNG' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(exportTrigger).toBeFocused();

  const projectTrigger = page.getByRole('button', { name: 'Project menu' });
  await projectTrigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Project menu' }).getByRole('button', { name: 'New' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(projectTrigger).toBeFocused();

  const presentation = page.getByRole('button', { name: 'Enter presentation mode' });
  await presentation.focus();
  await page.keyboard.press('Enter');
  const exit = page.getByRole('button', { name: 'Exit presentation mode' });
  await expect(exit).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(presentation).toBeFocused();
});

test('associates validation errors and exposes non-color status text', async ({ page }) => {
  await page.goto('/');
  await createByKeyboard(page, 'node');
  await page.getByRole('tab', { name: 'Styles' }).click();
  const width = page.getByRole('spinbutton', { name: 'Body width' });
  await width.fill('1.2');
  await width.blur();
  await expect(width).toHaveAttribute('aria-invalid', 'true');
  const errorId = await width.getAttribute('aria-errormessage');
  expect(errorId).toBeTruthy();
  await expect(page.locator(`#${errorId}`)).toContainText('whole number');

  await page.getByRole('button', { name: 'Open telemetry mapper' }).click();
  await page.getByRole('button', { name: 'Enable telemetry mapper' }).click();
  await expect(page.getByText('mapper.yaml enabled')).toBeVisible();
  await expect(page.getByText(/Rules: 0/)).toBeVisible();
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');
});

test('passes dark, reduced-motion, forced-color, zoom, narrow, and long-label checks', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ height: 900, width: 640 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open object palette' }).click();
  await createByKeyboard(page, 'router');
  await page.getByRole('button', { name: 'Close object palette' }).click();
  await page.getByRole('button', { name: 'Open Inspector' }).click();
  const name = page.getByRole('textbox', { name: 'Name' });
  await name.fill('Internationalized edge gateway with a deliberately long translated-like object name');
  await name.press('Enter');
  await expectNoBlockingViolations(page, 'dark reduced-motion 200-percent reflow');
  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    transition: getComputedStyle(document.querySelector('.studio-template') as Element).transitionDuration
  }));
  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(Number.parseFloat(layout.transition)).toBeLessThanOrEqual(0.00001);

  await expectControlAffordances(page, 'narrow controls');

  await page.emulateMedia({ colorScheme: 'light', forcedColors: 'active', reducedMotion: 'reduce' });
  await expectNoBlockingViolations(page, 'forced colors');
  const focused = page.getByRole('button', { name: 'Open export panel' });
  await focused.focus();
  await expect(focused).toHaveCSS('outline-style', 'solid');
});

test('checks the external-change conflict dialog as an announced modal state', async ({ page }) => {
  await page.goto('/?__studio-test-state=external-change');
  await createByKeyboard(page, 'node');
  await emitExternalChange(page);
  const dialog = page.getByRole('dialog', { name: 'Project changed outside Studio' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Inspect diff' })).toBeFocused();
  await expectNoBlockingViolations(page, 'external-change conflict');
});
