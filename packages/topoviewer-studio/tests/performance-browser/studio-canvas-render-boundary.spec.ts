import { expect, test, type Locator, type Page } from '@playwright/test';
import { openStudioWorkspace } from '../support/workbench';

async function renderCount(canvas: Locator) {
  return Number(await canvas.getAttribute('data-render-count'));
}

async function stableRenderCount(page: Page, canvas: Locator) {
  let previous = await renderCount(canvas);
  for (let sample = 0; sample < 4; sample += 1) {
    await page.waitForTimeout(50);
    const current = await renderCount(canvas);
    if (current === previous && sample > 0) return current;
    previous = current;
  }
  return previous;
}

test('keeps canvas renders inside the canvas capability boundary', async ({ page }) => {
  await page.goto('./?__studio-test-state=mapper-coverage');
  const canvas = page.getByTestId('studio-canvas');
  const router = page.locator('.react-flow__node[data-id="leaf1"]');
  await expect(canvas).toBeVisible();
  await expect(router).toBeVisible();
  await page.waitForTimeout(400);

  const initial = await stableRenderCount(page, canvas);
  await openStudioWorkspace(page, 'Mapper');
  const afterPanelSwitch = await stableRenderCount(page, canvas);

  await router.click();
  const afterSelection = await stableRenderCount(page, canvas);

  const dragSurface = router.locator('.topoviewer-node-icon');
  const dragBox = await dragSurface.boundingBox();
  if (!dragBox) throw new Error('Canvas render benchmark node is not measurable.');
  await page.mouse.move(dragBox.x + dragBox.width / 2, dragBox.y + dragBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(dragBox.x + dragBox.width / 2 + 30, dragBox.y + dragBox.height / 2 + 20, {
    steps: 8
  });
  await page.mouse.up();
  const afterDragStop = await stableRenderCount(page, canvas);

  const style = await openStudioWorkspace(page, 'Properties');
  await style.getByRole('searchbox', { name: 'Search style attributes' }).fill('background color');
  const background = style.locator('[data-field-path="backgroundColor"] input[type="text"]');
  await background.fill('#123456');
  await background.press('Enter');
  await expect(style.locator('.studio-style-candidate-footer')).toHaveAttribute('data-status', 'valid-dirty');
  const afterStyleEdit = await stableRenderCount(page, canvas);

  await canvas.click({ position: { x: 20, y: 20 } });
  await expect(router).not.toHaveClass(/selected/);
  await expect(page.getByRole('tabpanel', { name: 'Viewport settings' })).toBeVisible();
  const afterSelectionClear = await stableRenderCount(page, canvas);
  const viewport = await openStudioWorkspace(page, 'Properties');
  const helperLines = viewport.getByRole('switch', { name: /Alignment assistance/ });
  await helperLines.click();
  await expect(helperLines).not.toBeChecked();
  const afterViewportChange = await stableRenderCount(page, canvas);

  const renderDelta = {
    panelSwitch: afterPanelSwitch - initial,
    selection: afterSelection - afterPanelSwitch,
    dragStop: afterDragStop - afterSelection,
    styleEdit: afterStyleEdit - afterDragStop,
    selectionClear: afterSelectionClear - afterStyleEdit,
    viewportChange: afterViewportChange - afterSelectionClear
  };

  const renderSummary = JSON.stringify(renderDelta);
  // A contextual drawer changes the unobscured preview rectangle, then requests
  // one fit after the new inset is applied. Neither render may rebuild source.
  expect(renderDelta.panelSwitch, renderSummary).toBeLessThanOrEqual(2);
  expect(renderDelta.dragStop, renderSummary).toBeLessThanOrEqual(1);
  expect(renderDelta.selection, renderSummary).toBeLessThanOrEqual(1);
  expect(renderDelta.selectionClear, renderSummary).toBeLessThanOrEqual(1);
  expect(renderDelta.styleEdit, renderSummary).toBeLessThanOrEqual(1);
  expect(renderDelta.viewportChange, renderSummary).toBeLessThanOrEqual(1);
});
