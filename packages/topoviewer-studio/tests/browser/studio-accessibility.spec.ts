import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { editStyleAttribute, openStyleWorkspace } from '../support/basicStyle';
import { openStudioWorkspace } from '../support/workspaceRail';

async function expectNoBlockingViolations(page: Page, state: string) {
  const result = await new AxeBuilder({ page }).analyze();
  expect(
    result.violations,
    `${state}\n${result.violations.map((violation) => `${violation.id}: ${violation.help}`).join('\n')}`
  ).toEqual([]);
}

async function expectControlAffordances(root: Locator | Page, state: string) {
  const findings = await root.locator('button:visible').evaluateAll((buttons) => buttons.flatMap((button) => {
    const box = button.getBoundingClientRect();
    const name = button.getAttribute('aria-label') || button.textContent?.trim() || 'unnamed button';
    const issues: string[] = [];
    if (box.width < 24 || box.height < 24) issues.push(`${name} target is ${box.width}x${box.height}`);
    if (!button.textContent?.trim() && !button.getAttribute('title') && !button.dataset.studioTooltip) {
      issues.push(`${name} has no tooltip`);
    }
    return issues;
  }));
  expect(findings, state).toEqual([]);
}

async function expandPaletteGroup(page: Page, name: string) {
  const group = page.getByRole('button', { name: `${name} palette group` });
  if (await group.getAttribute('aria-expanded') !== 'true') await group.click();
}

async function createByKeyboard(page: Page, template: string) {
  await openStudioWorkspace(page, 'Objects');
  if (['callout', 'region', 'shape', 'text'].includes(template)) await expandPaletteGroup(page, 'Annotations');
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
  test.setTimeout(90_000);
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
  await expectNoBlockingViolations(page, 'empty shell');
  await expectControlAffordances(page, 'empty shell controls');

  await createByKeyboard(page, 'router');
  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toHaveAccessibleName('node New Router');
  await expectNoBlockingViolations(page, 'selected object and properties');
  const inspector = await openStyleWorkspace(page);
  await editStyleAttribute(inspector, 'Shape');
  await expect(inspector.getByRole('combobox', { name: 'Shape' })).toBeVisible();
  await expectNoBlockingViolations(page, 'inline style value editor');
  await expectControlAffordances(page, 'inline style value editor');
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

  const mapper = await openStudioWorkspace(page, 'Mapper');
  await mapper.getByRole('textbox', { name: 'Metric' }).fill('topology_health');
  await mapper.getByRole('button', { name: 'Create rule' }).click();
  await expectNoBlockingViolations(page, 'telemetry mapper');
  await expectControlAffordances(page, 'telemetry mapper controls');
  await mapper.getByRole('button', { name: 'Mapper actions' }).click();
  await page.getByRole('menuitem', { name: 'Remove mapper' }).click();
  await expectNoBlockingViolations(page, 'mapper removal confirmation');
  await page.getByRole('alertdialog', { name: 'Remove telemetry mapper' }).getByRole('button', { name: 'Cancel' }).click();
  await mapper.getByRole('button', { name: 'Collapse workspace panel' }).click();

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

test('keeps selected-object style authoring accessible', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const inspector = await openStyleWorkspace(page);
  await expect(inspector.getByRole('tab')).toHaveText(['Basic', 'YAML']);
  await expectNoBlockingViolations(page, 'Basic style workspace');
  await expectControlAffordances(inspector, 'Basic style controls');
  await editStyleAttribute(inspector, 'Background color');
  await expectNoBlockingViolations(page, 'selected object Basic style editor');
});

test('supports the Basic and YAML candidate workflow without pointer input', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const leaf = page.locator('.react-flow__node[data-id="leaf1"]');
  await leaf.focus();
  await page.keyboard.press('Enter');
  const inspector = await openStyleWorkspace(page);

  await editStyleAttribute(inspector, 'Background color');
  let color = inspector.locator('[data-field-path="backgroundColor"] input[type="text"]');
  await color.fill('#315f82');
  await color.press('Enter');
  await expect(inspector.getByText(/Valid Style draft/)).toBeVisible();

  const basicTab = inspector.getByRole('tab', { name: 'Basic' });
  const yamlTab = inspector.getByRole('tab', { name: 'YAML' });
  await basicTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(yamlTab).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(yamlTab).toHaveAttribute('aria-selected', 'true');
  await expect(inspector.getByLabel('stylesheet YAML editor')).toBeVisible();
  await expectNoBlockingViolations(page, 'keyboard Style YAML workspace');

  const matchingRule = inspector.getByRole('button', { name: 'Go to matching object rule' });
  await expect(matchingRule).toBeEnabled();
  await matchingRule.focus();
  await page.keyboard.press('Enter');
  await expect(inspector.getByLabel('stylesheet YAML editor')).toBeFocused();

  await inspector.getByRole('button', { name: 'Search Style YAML' }).focus();
  await page.keyboard.press('Enter');
  await expect(inspector.getByRole('textbox', { name: 'Find', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');

  await basicTab.focus();
  await page.keyboard.press('Enter');
  await expect(basicTab).toHaveAttribute('aria-selected', 'true');

  const apply = inspector.getByRole('button', { name: 'Apply' });
  await apply.focus();
  await page.keyboard.press('Enter');
  await expect(inspector.getByText('Stylesheet applied')).toBeVisible();

  await editStyleAttribute(inspector, 'Background color');
  color = inspector.locator('[data-field-path="backgroundColor"] input[type="text"]');
  await color.fill('#476f91');
  await color.press('Enter');
  await expect(inspector.getByText(/Valid Style draft/)).toBeVisible();

  const revert = inspector.getByRole('button', { name: 'Revert' });
  await revert.focus();
  await page.keyboard.press('Enter');
  await expect(inspector.getByText('Stylesheet applied')).toBeVisible();
  await expectNoBlockingViolations(page, 'reverted Basic and YAML style candidate');
});

test('supports the primary authoring workflow without pointer input', async ({ page }) => {
  await page.goto('/');
  await createByKeyboard(page, 'router');
  await expect(liveAnnouncement(page)).toContainText('Create New Router');
  await createByKeyboard(page, 'router');

  await selectByKeyboard(page, 'router-1');
  await selectByKeyboard(page, 'router-2', true);
  await expect(liveAnnouncement(page)).toContainText('2 objects selected');
  const edgeCount = await page.locator('.react-flow__edge').count();
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  await expect(page.locator('.react-flow__edge')).toHaveCount(edgeCount + 1);
  await expect(liveAnnouncement(page)).toContainText('Create link');

  await selectByKeyboard(page, 'router-1');
  const selectedNode = page.locator('.react-flow__node[data-id="router-1"]');
  const originalBox = await selectedNode.boundingBox();
  expect(originalBox).toBeTruthy();
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Alt+Shift+ArrowRight');
  await expect.poll(async () => (await selectedNode.boundingBox())?.width).toBe((originalBox?.width || 0) + 10);
  await expect.poll(async () => (await selectedNode.boundingBox())?.height).toBe((originalBox?.height || 0) + 10);
  await expect(liveAnnouncement(page)).toContainText('Resize');

  await selectByKeyboard(page, 'router-1');
  await selectByKeyboard(page, 'router-2', true);
  await createByKeyboard(page, 'region');
  await selectByKeyboard(page, 'router-1');
  await page.keyboard.press('Shift+F10');
  const menu = page.getByRole('menu', { name: 'Selection actions' });
  await expect(menu).toBeVisible();
  for (let index = 0; index < 4; index += 1) await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Release from region' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(menu).toBeHidden();
  await expect(liveAnnouncement(page)).toContainText('Release from region');

  const mapper = await openStudioWorkspace(page, 'Mapper');
  await page.getByRole('textbox', { name: 'Metric' }).focus();
  await page.keyboard.type('node_health');
  await page.getByRole('button', { name: 'Create rule' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: /node-health-node/ })).toBeVisible();
  await expect(liveAnnouncement(page)).toContainText('Created mapper with rule');

  await mapper.getByRole('button', { name: 'Collapse workspace panel' }).click();
  await page.getByRole('button', { name: 'Save project' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved', { timeout: 10_000 });
  await expect(liveAnnouncement(page)).toContainText('Project saved');
});

test('announces parallel and invalid native connection targets without color dependence', async ({ page }) => {
  await page.goto('/');
  await createByKeyboard(page, 'router');
  await createByKeyboard(page, 'router');
  const initialEdgeCount = await page.locator('.react-flow__edge').count();
  const source = page.locator('.react-flow__node[data-id="router-1"] .topoviewer-node-shape-handle.source[data-shape-active="true"]').nth(1);
  const target = page.locator('.react-flow__node[data-id="router-2"] .topoviewer-node-shape-handle.source[data-shape-active="true"]').nth(3);

  async function dragConnection(targetHandle = target) {
    await openStudioWorkspace(page, 'Objects');
    await page.getByTestId('palette-link').click();
    const sourceBox = await source.boundingBox();
    const targetBox = await targetHandle.boundingBox();
    if (!sourceBox || !targetBox) throw new Error('Connection handles are not measurable.');
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
  }

  await dragConnection();
  await expect(liveAnnouncement(page)).toContainText('Valid link connection from router-1 to router-2');
  await page.mouse.up();
  await expect(page.locator('.react-flow__edge')).toHaveCount(initialEdgeCount + 1);

  await dragConnection();
  await page.mouse.up();
  await expect(page.locator('.react-flow__edge')).toHaveCount(initialEdgeCount + 2);

  await expandPaletteGroup(page, 'Annotations');
  const calloutTemplate = page.getByTestId('palette-callout');
  await calloutTemplate.scrollIntoViewIfNeeded();
  await calloutTemplate.click();
  await expect(page.locator('.react-flow__node[data-id="callout-1"]')).toBeVisible();
  await calloutTemplate.click();
  await expect(page.locator('.react-flow__node[data-id="callout-2"]')).toBeVisible();
  await page.getByTestId('palette-link').click();
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
  await expect(page.locator('.react-flow__edge')).toHaveCount(initialEdgeCount + 2);
});

test('contains and restores focus across dialogs, drawers, tabs, and presentation', async ({ page }) => {
  await page.goto('/');
  await createByKeyboard(page, 'router');

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
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const inspector = await openStyleWorkspace(page);
  await editStyleAttribute(inspector, 'Body width');
  const width = page.getByRole('spinbutton', { name: 'Body width' });
  await width.fill('1.2');
  await width.blur();
  await expect(width).toHaveAttribute('aria-invalid', 'true');
  const errorId = await width.getAttribute('aria-errormessage');
  expect(errorId).toBeTruthy();
  await expect(page.locator(`#${errorId}`)).toContainText('whole number');

  const mapper = await openStudioWorkspace(page, 'Mapper');
  const ruleCount = mapper.getByText(/^\d+ rules?$/);
  const beforeRules = Number.parseInt((await ruleCount.textContent()) || '0', 10);
  await mapper.getByRole('textbox', { name: 'Metric' }).fill('node_health');
  await mapper.getByRole('button', { name: 'Create rule' }).click();
  await expect(mapper.getByText('Mapper ready')).toBeVisible();
  await expect(ruleCount).toHaveText(`${beforeRules + 1} rules`);
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');
});

test('passes dark, reduced-motion, forced-color, zoom, narrow, and long-label checks', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ height: 900, width: 640 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open workspace panel' }).click();
  await createByKeyboard(page, 'router');
  await page.getByRole('button', { name: 'Close workspace panel' }).click();
  const objectProperties = await openStudioWorkspace(page, 'Properties');
  const name = objectProperties.getByRole('textbox', { name: 'Name' });
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
  await createByKeyboard(page, 'router');
  await emitExternalChange(page);
  const dialog = page.getByRole('dialog', { name: 'Project changed outside Studio' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Inspect diff' })).toBeFocused();
  await expectNoBlockingViolations(page, 'external-change conflict');
});
