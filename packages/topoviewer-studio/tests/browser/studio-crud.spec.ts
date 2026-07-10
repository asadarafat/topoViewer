import { expect, test } from '@playwright/test';

async function openSource(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  await expect(page.getByLabel('topology YAML editor')).toBeVisible();
}

async function expectSourceContains(page: import('@playwright/test').Page, query: string, present = true) {
  await page.getByLabel('topology YAML editor').focus();
  await page.keyboard.press('Control+f');
  await page.getByRole('textbox', { name: 'Find', exact: true }).fill(query);
  const count = page.locator('.find-widget .matchesCount');
  if (present) await expect(count).toHaveText(/\d+ of \d+/);
  else await expect(count).toHaveText('No results');
  await page.keyboard.press('Escape');
}

async function selectNodes(page: import('@playwright/test').Page, ids: string[]) {
  for (const [index, id] of ids.entries()) {
    await page.locator(`.react-flow__node[data-id="${id}"]`).click({
      modifiers: index === 0 ? [] : ['Control']
    });
  }
}

async function dragTemplate(
  page: import('@playwright/test').Page,
  id: string,
  position: { x: number; y: number }
) {
  await page.getByTestId(`palette-${id}`).dragTo(page.getByTestId('studio-canvas'), { targetPosition: position });
}

test('creates topology, annotation, structure, asset, and user-preset objects', async ({ page }) => {
  await page.goto('/');

  await dragTemplate(page, 'node', { x: 120, y: 160 });
  await dragTemplate(page, 'shape', { x: 280, y: 160 });
  await dragTemplate(page, 'callout', { x: 440, y: 160 });
  await dragTemplate(page, 'asset-router', { x: 600, y: 160 });
  await expect(page.locator('.react-flow__node')).toHaveCount(4);

  await page.getByRole('button', { name: 'Save selection as preset' }).click();
  await expect(page.getByRole('button', { name: 'Add Router Icon preset' })).toBeVisible();
  await dragTemplate(page, 'preset:preset-1', { x: 600, y: 340 });
  await expect(page.locator('.react-flow__node')).toHaveCount(5);

  await selectNodes(page, ['node-1', 'router-1']);
  await page.getByRole('button', { name: 'Connect selected nodes' }).click();
  const physicalLink = page.locator('.react-flow__edge[data-id="link-1"]');
  await expect(physicalLink).toHaveCount(1);
  await expect(physicalLink.locator('path').first()).toHaveAttribute('d', /\S+/);
  await selectNodes(page, ['node-1', 'router-1']);
  await dragTemplate(page, 'path', { x: 520, y: 360 });
  await expect(physicalLink).toHaveCount(1);
  await expect(physicalLink.locator('path').first()).toHaveAttribute('d', /\S+/);

  await dragTemplate(page, 'region', { x: 500, y: 460 });
  await expect(page.getByText('New Region', { exact: true })).toBeVisible();

  await openSource(page);
  for (const query of ['shapes:', 'callouts:', 'icon: router.generic', 'paths:', '- paths', '- physical', 'layers:', '- annotations']) {
    await expectSourceContains(page, query);
  }
});

test('connects in reverse with native handles and stores normalized endpoints', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-node').click();
  await page.getByTestId('palette-node').click();
  await expect(page.locator('.react-flow__node')).toHaveCount(2);

  const sourceHandle = page.locator('.react-flow__node[data-id="node-2"] .topoviewer-node-handle-default');
  const targetHandle = page.locator('.react-flow__node[data-id="node-1"] .topoviewer-node-handle-default-target');
  await expect(sourceHandle).toBeVisible();
  await expect(targetHandle).toBeVisible();
  const sourceBox = await sourceHandle.boundingBox();
  const targetBox = await targetHandle.boundingBox();
  if (!sourceBox || !targetBox) throw new Error('Connection handles are not measurable.');
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
  await page.mouse.up();

  await expect(page.locator('.react-flow__edge')).toHaveCount(1);
  await openSource(page);
  await expectSourceContains(page, 'source: node-1');
  await expectSourceContains(page, 'target: node-2');
});

test('rejects invalid native connections before they mutate the graph', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-node').click();
  await page.getByTestId('palette-node').click();

  const nodeOneSource = page.locator('.react-flow__node[data-id="node-1"] .topoviewer-node-handle-default');
  const nodeOneTarget = page.locator('.react-flow__node[data-id="node-1"] .topoviewer-node-handle-default-target');
  const nodeTwoTarget = page.locator('.react-flow__node[data-id="node-2"] .topoviewer-node-handle-default-target');
  await expect(nodeOneSource).toHaveCSS('border-radius', '50%');
  await expect(nodeOneTarget).toHaveCSS('border-radius', '2px');
  await expect(nodeOneTarget).toHaveAttribute('title', /Self-links and duplicate links are rejected/);

  async function connect(source: import('@playwright/test').Locator, target: import('@playwright/test').Locator) {
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();
    if (!sourceBox || !targetBox) throw new Error('Connection handles are not measurable.');
    await source.hover();
    await page.mouse.down();
    await page.mouse.move(sourceBox.x + sourceBox.width / 2 + 8, sourceBox.y + sourceBox.height / 2, { steps: 2 });
    await expect(page.locator('svg.react-flow__connectionline')).toBeVisible();
    const targetX = targetBox.x + targetBox.width / 2;
    const targetY = targetBox.y + targetBox.height / 2;
    await page.mouse.move(targetX, targetY, { steps: 8 });
    await page.mouse.move(targetX + 2, targetY + 2);
    await page.mouse.move(targetX, targetY);
    await expect(target).toHaveClass(/connectingto/);
    return () => page.mouse.up();
  }

  let release = await connect(nodeOneSource, nodeOneTarget);
  await expect(nodeOneTarget).not.toHaveClass(/\bvalid\b/);
  await release();
  await expect(page.locator('.react-flow__edge')).toHaveCount(0);

  release = await connect(nodeOneSource, nodeTwoTarget);
  await expect(nodeTwoTarget).toHaveClass(/\bvalid\b/);
  await release();
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);

  release = await connect(nodeOneSource, nodeTwoTarget);
  await expect(nodeTwoTarget).not.toHaveClass(/\bvalid\b/);
  await release();
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);
  await openSource(page);
  await expectSourceContains(page, 'id: link-2', false);
});

test('supports selection CRUD, clipboard, layout actions, history, and scoped shortcuts', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-node').click();
  await page.getByTestId('palette-node').click();
  await page.getByTestId('palette-node').click();
  await selectNodes(page, ['node-1', 'node-2', 'node-3']);

  await expect(page.getByRole('button', { name: 'Align selection top' })).toBeEnabled();
  await page.getByRole('button', { name: 'Align selection top' }).click();
  await page.getByRole('button', { name: 'Distribute selection horizontally' }).click();
  await page.getByRole('button', { name: 'Copy selection' }).click();
  await page.getByRole('button', { name: 'Paste selection' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(6);

  await page.getByRole('button', { name: 'Cut selection' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  await page.getByRole('button', { name: 'Paste selection' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(6);

  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('Delete');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(6);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(3);

  await page.locator('.react-flow__node[data-id="node-1"]').click();
  const name = page.getByRole('textbox', { name: 'Name' });
  await name.fill('Editable Name');
  await name.press('Backspace');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);

  await page.getByRole('button', { name: 'Viewport settings' }).click();
  const helperLines = page.getByRole('checkbox', { name: 'Helper lines' });
  await helperLines.uncheck();
  await expect(page.getByRole('checkbox', { name: 'Snap to alignment' })).toBeDisabled();
  await helperLines.focus();
  await page.keyboard.press('Delete');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  await page.getByRole('button', { name: 'Viewport settings' }).click();

  const node = page.locator('.react-flow__node[data-id="node-1"]');
  const box = await node.boundingBox();
  if (!box) throw new Error('Node is not measurable.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 20, { steps: 8 });
  await expect(page.locator('.topoviewer-helper-line')).toHaveCount(0);
  await page.mouse.up();
  await expect(page.locator('.studio-visually-hidden[aria-live="polite"]')).toContainText('Move');
});

test('deletes a node and dependent link atomically', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-node').click();
  await page.getByTestId('palette-node').click();
  await selectNodes(page, ['node-1', 'node-2']);
  await page.getByRole('button', { name: 'Connect selected nodes' }).click();
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);

  await page.locator('.react-flow__node[data-id="node-1"]').click();
  await page.getByRole('button', { name: 'Delete selection' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(1);
  await expect(page.locator('.react-flow__edge')).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('resizes a selected node through the native resize handles', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-node').click();

  const handle = page.locator('.react-flow__node[data-id="node-1"] .topoviewer-resize-handle.bottom.right');
  await expect(handle).toBeVisible();
  const before = await page.getByRole('spinbutton', { name: 'Body width' }).inputValue();
  const box = await handle.boundingBox();
  if (!box) throw new Error('Resize handle is not measurable.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 44, box.y + box.height / 2 + 24, { steps: 8 });
  await page.mouse.up();

  await expect.poll(async () => Number(await page.getByRole('spinbutton', { name: 'Body width' }).inputValue()))
    .toBeGreaterThan(Number(before));
  await openSource(page);
  await expectSourceContains(page, 'style:');
  await expectSourceContains(page, 'width:');
  await expectSourceContains(page, 'height:');
});

test('uses context actions and native marquee selection', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-router').click();
  await page.getByTestId('palette-service').click();
  await page.getByTestId('palette-controller').click();

  await page.locator('.react-flow__node[data-id="router-1"]').click({ button: 'right' });
  const menu = page.getByRole('menu', { name: 'Selection actions' });
  await expect(menu).toBeVisible();
  await menu.getByRole('menuitem', { name: 'Save as preset' }).click();
  await expect(page.getByRole('button', { name: 'Add New Router preset' })).toBeVisible();

  await page.getByTestId('studio-canvas').click({ position: { x: 620, y: 520 } });
  const first = await page.locator('.react-flow__node[data-id="router-1"]').boundingBox();
  const last = await page.locator('.react-flow__node[data-id="controller-1"]').boundingBox();
  if (!first || !last) throw new Error('Nodes are not measurable for marquee selection.');
  await page.keyboard.down('Shift');
  await page.mouse.move(first.x - 20, first.y - 20);
  await page.mouse.down();
  await page.mouse.move(last.x + last.width + 20, last.y + last.height + 20, { steps: 10 });
  await page.mouse.up();
  await page.keyboard.up('Shift');
  await expect(page.getByRole('button', { name: 'Distribute selection horizontally' })).toBeEnabled();
});

test('creates a reachable path over existing graph connectivity', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-node').click();
  await page.getByTestId('palette-node').click();
  await selectNodes(page, ['node-1', 'node-2']);
  await page.getByRole('button', { name: 'Connect selected nodes' }).click();
  await selectNodes(page, ['node-1', 'node-2']);
  await page.getByTestId('palette-path').click();

  await openSource(page);
  await expectSourceContains(page, 'id: path-1');
  await expectSourceContains(page, '- paths');
  await expectSourceContains(page, '- node-1');
  await expectSourceContains(page, '- node-2');
});

test('creates a deterministic shortest path when that authoring mode is selected', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-node').click();
  await page.getByTestId('palette-node').click();
  await page.getByTestId('palette-node').click();
  await selectNodes(page, ['node-1', 'node-2']);
  await page.getByRole('button', { name: 'Connect selected nodes' }).click();
  await selectNodes(page, ['node-2', 'node-3']);
  await page.getByRole('button', { name: 'Connect selected nodes' }).click();

  await selectNodes(page, ['node-1', 'node-3']);
  await page.getByRole('button', { name: 'Viewport settings' }).click();
  await page.getByRole('combobox', { name: 'Path mode' }).selectOption('shortest');
  await page.getByTestId('palette-path').click();

  await openSource(page);
  await expectSourceContains(page, 'sequence:');
  await expectSourceContains(page, '- node-1');
  await expectSourceContains(page, '- node-2');
  await expectSourceContains(page, '- node-3');
  await expect(page.locator('.react-flow__edge[data-id="link-1"]')).toHaveCount(1);
  await expect(page.locator('.react-flow__edge[data-id="link-2"]')).toHaveCount(1);
});
