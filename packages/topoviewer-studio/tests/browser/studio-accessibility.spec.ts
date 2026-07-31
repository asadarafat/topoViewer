import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { editStyleAttribute, openStyleWorkspace } from '../support/basicStyle';
import { invokeStudioHeaderAction } from '../support/headerActions';
import { activateStudioPaletteTemplate, openMapperCode, openPropertiesCodeDocument, openStudioWorkspace } from '../support/workbench';

async function expectNoBlockingViolations(page: Page, state: string) {
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations, `${state}\n${result.violations.map((violation) => `${violation.id}: ${violation.help}`).join('\n')}`).toEqual([]);
}

async function expectControlAffordances(root: Locator | Page, state: string) {
  const findings = await root.locator('button:visible').evaluateAll((buttons) =>
    buttons.flatMap((button) => {
      const box = button.getBoundingClientRect();
      const name = button.getAttribute('aria-label') || button.textContent?.trim() || 'unnamed button';
      const issues: string[] = [];
      if (box.width < 24 || box.height < 24) issues.push(`${name} target is ${box.width}x${box.height}`);
      if (!button.textContent?.trim() && !button.getAttribute('title') && !button.dataset.studioTooltip) {
        issues.push(`${name} has no tooltip`);
      }
      return issues;
    })
  );
  expect(findings, state).toEqual([]);
}

async function expandPaletteGroup(page: Page, name: string) {
  const add = await openStudioWorkspace(page, 'Add');
  const group = add.getByRole('button', { name: `${name} palette group` });
  if ((await group.getAttribute('aria-expanded')) !== 'true') await group.click();
}

async function focusMenuItemByKeyboard(menu: Locator, name: string) {
  const items = menu.getByRole('menuitem');
  const itemLabels = (await items.allTextContents()).map((label) => label.trim());
  const targetIndex = itemLabels.findIndex((label) => label === name);
  if (targetIndex < 0) throw new Error(`Menu item "${name}" is unavailable. Found: ${itemLabels.join(', ')}`);
  await menu.page().keyboard.press('Home');
  for (let index = 0; index < targetIndex; index += 1) {
    await menu.page().keyboard.press('ArrowDown');
  }
}

async function createByKeyboard(page: Page, template: string) {
  await openStudioWorkspace(page, 'Add');
  if (['callout', 'region', 'shape', 'text'].includes(template)) await expandPaletteGroup(page, 'Annotations');
  await page.getByTestId(`palette-${template}`).focus();
  await page.keyboard.press('Enter');
  if ((page.viewportSize()?.width || 1280) >= 900) {
    await expect(page.getByTestId('studio-canvas')).toBeFocused();
  } else {
    await expect(
      page.getByRole('complementary', { name: 'Properties workspace' })
    ).toBeVisible();
  }
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
  await expect(object).toHaveClass(/selected/);
  if (!additive) await expect(page.getByLabel('Workbench context')).toContainText(`node / ${id}`);
}

async function emitExternalChange(page: Page) {
  await page.evaluate(async () => {
    const trigger = (window as typeof window & { __topoviewerStudioExternalChange?: () => Promise<void> }).__topoviewerStudioExternalChange;
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
  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toHaveAccessibleName('node router-1');
  await expectNoBlockingViolations(page, 'selected object and properties');
  const inspector = await openStyleWorkspace(page);
  await editStyleAttribute(inspector, 'Shape');
  await expect(inspector.getByRole('combobox', { name: 'Shape' })).toBeVisible();
  await expectNoBlockingViolations(page, 'inline style value editor');
  await expectControlAffordances(page, 'inline style value editor');
  await expect(inspector.getByRole('menu')).toHaveCount(0);

  await expectNoBlockingViolations(page, 'layers');
  const projectSource = await openStudioWorkspace(page, 'Project');
  const layers = projectSource.getByRole('button', { name: /^Layers \d+$/ });
  if ((await layers.getAttribute('aria-expanded')) !== 'true') await layers.click();
  await projectSource
    .getByRole('button', { name: /^.* layer actions$/ })
    .first()
    .click();
  await page.getByRole('menuitem', { name: 'Delete layer' }).click();
  await expectNoBlockingViolations(page, 'layer deletion confirmation');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();

  const codeWorkspace = await openPropertiesCodeDocument(page, 'topology');
  await expectNoBlockingViolations(page, 'topology source workspace');
  await expect(codeWorkspace.getByLabel('topology YAML editor')).toHaveCount(1);

  await openStudioWorkspace(page, 'Mapper');
  await mapper.getByRole('textbox', { name: 'Metric' }).fill('topology_health');
  await mapper.getByRole('button', { name: 'Create rule' }).click();
  await expectNoBlockingViolations(page, 'telemetry mapper');
  await expectControlAffordances(page, 'telemetry mapper controls');
  const mapperSource = await openMapperCode(page);
  await expectNoBlockingViolations(page, 'telemetry mapper source workspace');
  await expectControlAffordances(mapperSource, 'telemetry mapper source controls');
  await openStudioWorkspace(page, 'Mapper');
  await mapper.getByRole('button', { name: 'Mapper actions' }).click();
  await page.getByRole('menuitem', { name: 'Remove mapper' }).click();
  await expectNoBlockingViolations(page, 'mapper removal confirmation');
  await page.getByRole('alertdialog', { name: 'Remove telemetry mapper' }).getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Collapse workspace panel' }).click();

  await page.getByRole('button', { name: 'Project menu' }).click();
  await expectNoBlockingViolations(page, 'project menu');
  await page.getByRole('dialog', { name: 'Projects' }).getByRole('button', { name: 'Actions for Backbone topology' }).click();
  await page.getByRole('menu', { name: 'Backbone topology project actions' }).getByRole('menuitem', { name: 'Delete' }).click();
  await expectNoBlockingViolations(page, 'project deletion confirmation');
  await page
    .getByRole('alertdialog', { name: /Delete/ })
    .getByRole('button', { name: 'Cancel' })
    .click();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Open export panel' }).click();
  await expectNoBlockingViolations(page, 'export dialog');
  await expectControlAffordances(page, 'export controls');
  await page.keyboard.press('Escape');

  await invokeStudioHeaderAction(page, 'Presentation mode');
  await expectNoBlockingViolations(page, 'presentation mode');
});

test('keeps selected-object style authoring accessible', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const inspector = await openStyleWorkspace(page);
  await expect(inspector.getByRole('button', { name: 'Open topology source' })).toBeVisible();
  await expect(inspector.getByRole('group', { name: 'Properties representation' })).toHaveCount(0);
  await expectNoBlockingViolations(page, 'Visual style workspace');
  await expectControlAffordances(inspector, 'Basic style controls');
  await editStyleAttribute(inspector, 'Background color');
  await expectNoBlockingViolations(page, 'selected object Basic style editor');
});

test('supports the Visual and shared source candidate workflow without pointer input', async ({ page }) => {
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

  const stylesheetYamlButton = page
    .getByRole('navigation', { name: 'Project source' })
    .getByRole('button', { name: 'stylesheet.yaml' });
  await stylesheetYamlButton.focus();
  await stylesheetYamlButton.press('Enter');
  const source = page.getByTestId('studio-source-pane');
  await expect(source.getByLabel('stylesheet YAML editor')).toBeVisible();
  await expectNoBlockingViolations(page, 'keyboard Style YAML workspace');

  await source.getByRole('button', { name: 'Search stylesheet YAML' }).focus();
  await page.keyboard.press('Enter');
  await expect(source.getByRole('textbox', { name: 'Find', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');

  const apply = source.getByRole('button', { name: 'Apply stylesheet' });
  await apply.focus();
  await page.keyboard.press('Enter');
  await expect(source.getByRole('button', { name: 'Apply stylesheet' })).toHaveCount(0);

  await openStyleWorkspace(page);
  await editStyleAttribute(inspector, 'Background color');
  color = inspector.locator('[data-field-path="backgroundColor"] input[type="text"]');
  await color.fill('#476f91');
  await color.press('Enter');
  await expect(inspector.getByText(/Valid Style draft/)).toBeVisible();

  await stylesheetYamlButton.focus();
  await stylesheetYamlButton.press('Enter');
  const revert = source.getByRole('button', { name: 'Revert stylesheet' });
  await revert.focus();
  await page.keyboard.press('Enter');
  await expect(source.getByRole('button', { name: 'Revert stylesheet' })).toHaveCount(0);
  await expectNoBlockingViolations(page, 'reverted Visual and shared source style candidate');
});

test('supports the primary authoring workflow without pointer input', async ({ page }) => {
  await page.goto('/');
  await createByKeyboard(page, 'router');
  await expect(liveAnnouncement(page)).toContainText('Create router-1');
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
  await expect(liveAnnouncement(page)).toContainText('Resize');
  const resizedBox = await selectedNode.boundingBox();
  const viewportScale = await page.locator('.react-flow__viewport').evaluate((viewport) => {
    const transform = getComputedStyle(viewport).transform;
    return transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a;
  });
  expect(resizedBox).toBeTruthy();
  expect(((resizedBox?.width || 0) - (originalBox?.width || 0)) / viewportScale).toBeCloseTo(10, 0);
  expect(((resizedBox?.height || 0) - (originalBox?.height || 0)) / viewportScale).toBeCloseTo(10, 0);

  await selectByKeyboard(page, 'router-1');
  await selectByKeyboard(page, 'router-2', true);
  await createByKeyboard(page, 'region');
  await selectByKeyboard(page, 'router-1');
  await page.keyboard.press('Shift+F10');
  const menu = page.getByRole('menu', { name: 'Selection actions' });
  await expect(menu).toBeVisible();
  await focusMenuItemByKeyboard(menu, 'Release from region');
  await expect(page.getByRole('menuitem', { name: 'Release from region' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(menu).toBeHidden();
  await expect(liveAnnouncement(page)).toContainText('Release from region');

  await openStudioWorkspace(page, 'Mapper');
  await page.getByRole('textbox', { name: 'Metric' }).focus();
  await page.keyboard.type('node_health');
  await page.getByRole('button', { name: 'Create rule' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: /node-health-node/ })).toBeVisible();
  await expect(liveAnnouncement(page)).toContainText('Created mapper with rule');

  await page.getByRole('button', { name: 'Collapse workspace panel' }).click();
  await page.getByRole('button', { name: 'Save project' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.studio-saved-state')).toContainText('Saved', { timeout: 10_000 });
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
    await activateStudioPaletteTemplate(page, 'link');
    await expect(source).toBeVisible();
    await expect(targetHandle).toBeVisible();
    await source.hover();
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

  await createByKeyboard(page, 'callout');
  await expect(page.locator('.react-flow__node[data-id="callout-1"]')).toBeVisible();
  await createByKeyboard(page, 'callout');
  await expect(page.locator('.react-flow__node[data-id="callout-2"]')).toBeVisible();
  await activateStudioPaletteTemplate(page, 'link');
  const calloutSource = page.locator('.react-flow__node[data-id="callout-1"] .react-flow__handle-right');
  const calloutTarget = page.locator('.react-flow__node[data-id="callout-2"] .react-flow__handle-left');
  await expect(calloutSource).toBeVisible();
  await expect(calloutTarget).toBeVisible();
  await calloutSource.hover();
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

test('contains and restores focus across source navigation, dialogs, and presentation', async ({ page }) => {
  await page.goto('/');
  await createByKeyboard(page, 'router');

  const sourceNavigator = page.getByRole('navigation', { name: 'Project source' });
  const topologySource = sourceNavigator.getByRole('button', { name: 'topology.yaml' });
  const stylesheetSource = sourceNavigator.getByRole('button', { name: 'stylesheet.yaml' });
  await topologySource.focus();
  await topologySource.press('Enter');
  await expect(page.getByLabel('topology YAML editor')).toBeVisible();
  await stylesheetSource.focus();
  await stylesheetSource.press('Enter');
  await expect(page.getByLabel('stylesheet YAML editor')).toBeVisible();

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
  await expect(page.getByRole('dialog', { name: 'Projects' }).getByRole('button', { name: 'New project' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(projectTrigger).toBeFocused();

  const moreActions = page.getByRole('button', { name: 'More Studio actions' });
  await moreActions.focus();
  await page.keyboard.press('Enter');
  const presentation = page.getByRole('menuitem', { name: 'Presentation mode' });
  await expect(presentation).toBeFocused();
  const presentationIcon = presentation.locator('svg');
  await expect(presentationIcon).toBeVisible();
  await expect(presentationIcon).toHaveAttribute('aria-hidden', 'true');
  await page.keyboard.press('Enter');
  const exit = page.getByRole('button', { name: 'Exit presentation mode' });
  await expect(exit).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(moreActions).toBeFocused();
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
  await mapper.getByRole('button', { name: 'New rule' }).click();
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
  await createByKeyboard(page, 'router');
  await page.getByRole('button', { name: 'Collapse workspace panel' }).click();
  const objectProperties = await openStudioWorkspace(page, 'Properties');
  const name = objectProperties.getByRole('textbox', { name: 'Visible label' });
  await name.fill('Internationalized edge gateway with a deliberately long translated-like object name');
  await name.press('Enter');
  await expectNoBlockingViolations(page, 'dark reduced-motion 200-percent reflow');
  const transition = await objectProperties.evaluate(
    (element) => getComputedStyle(element).transitionDuration
  );
  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  }));
  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(Number.parseFloat(transition)).toBeLessThanOrEqual(0.00001);

  await expectControlAffordances(page, 'narrow controls');

  await page.emulateMedia({ colorScheme: 'light', forcedColors: 'active', reducedMotion: 'reduce' });
  await expectNoBlockingViolations(page, 'forced colors');
  const focused = page.getByRole('dialog', { name: 'Properties workspace drawer' }).getByRole('button').first();
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
