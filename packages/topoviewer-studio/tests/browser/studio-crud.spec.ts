import { expect, test } from '@playwright/test';
import { editStyleAttribute, openStyleWorkspace } from '../support/styleMatrix';
import { openStudioWorkspace } from '../support/workspaceRail';

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

async function expandPaletteGroup(page: import('@playwright/test').Page, name: string) {
  const group = page.getByRole('button', { name: `${name} palette group` });
  if (await group.getAttribute('aria-expanded') !== 'true') await group.click();
}

async function dragTemplate(
  page: import('@playwright/test').Page,
  id: string,
  position: { x: number; y: number }
) {
  await openStudioWorkspace(page, 'Topo');
  if (['callout', 'region', 'shape', 'text'].includes(id)) await expandPaletteGroup(page, 'Annotations');
  const source = page.getByTestId(`palette-${id}`);
  await source.scrollIntoViewIfNeeded();
  await source.dragTo(page.getByTestId('studio-canvas'), { targetPosition: position });
}

async function drawEdgeTemplate(
  page: import('@playwright/test').Page,
  templateId: string,
  sourceId: string,
  targetId: string
) {
  await openStudioWorkspace(page, 'Topo');
  await page.getByTestId(`palette-${templateId}`).click();
  const source = page.locator(`.react-flow__node[data-id="${sourceId}"] .topoviewer-node-handle-default`);
  const target = page.locator(`.react-flow__node[data-id="${targetId}"] .topoviewer-node-handle-default-target`);
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) throw new Error(`${templateId} connection handles are not measurable.`);
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
  await page.mouse.up();
}

test('creates node, annotation, structure, and user-preset objects', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');

  await dragTemplate(page, 'service', { x: 120, y: 160 });
  await dragTemplate(page, 'shape', { x: 280, y: 160 });
  await dragTemplate(page, 'callout', { x: 440, y: 160 });
  await dragTemplate(page, 'router', { x: 600, y: 160 });
  await expect(page.locator('.react-flow__node')).toHaveCount(4);

  await page.getByRole('button', { name: 'Save selection as preset' }).click();
  await expect(page.getByTestId('palette-preset:preset-1')).toBeVisible();
  await dragTemplate(page, 'preset:preset-1', { x: 600, y: 340 });
  await expect(page.locator('.react-flow__node')).toHaveCount(5);

  await selectNodes(page, ['service-1', 'router-1']);
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  const physicalLink = page.locator('.react-flow__edge[data-id="link-1"]');
  await expect(physicalLink).toHaveCount(1);
  await expect(physicalLink.locator('path').first()).toHaveAttribute('d', /\S+/);
  await selectNodes(page, ['service-1', 'router-1']);
  await openStudioWorkspace(page, 'Topo');
  await page.getByTestId('palette-path').click();
  await expect(physicalLink).toHaveCount(1);
  await expect(physicalLink.locator('path').first()).toHaveAttribute('d', /\S+/);

  await dragTemplate(page, 'region', { x: 500, y: 460 });
  await expect(page.getByText('New Region', { exact: true })).toBeVisible();

  await openSource(page);
  for (const query of ['shapes:', 'callouts:', 'icon: topoviewer.router', 'paths:', '- paths', '- physical', 'layers:', '- annotations']) {
    await expectSourceContains(page, query);
  }
});

test('connects in reverse with native handles and stores normalized endpoints', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await page.getByTestId('palette-router').click();
  await page.getByTestId('palette-router').click();
  await expect(page.locator('.react-flow__node')).toHaveCount(2);

  const sourceHandle = page.locator('.react-flow__node[data-id="router-2"] .topoviewer-node-handle-default');
  const targetHandle = page.locator('.react-flow__node[data-id="router-1"] .topoviewer-node-handle-default-target');
  await page.getByTestId('palette-link').click();
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
  await expectSourceContains(page, 'source: router-1');
  await expectSourceContains(page, 'target: router-2');
});

test('rejects self-links while allowing parallel native links', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await page.getByTestId('palette-router').click();
  await page.getByTestId('palette-router').click();

  const nodeOneSource = page.locator('.react-flow__node[data-id="router-1"] .topoviewer-node-handle-default');
  const nodeOneTarget = page.locator('.react-flow__node[data-id="router-1"] .topoviewer-node-handle-default-target');
  const nodeTwoTarget = page.locator('.react-flow__node[data-id="router-2"] .topoviewer-node-handle-default-target');
  await expect(nodeOneSource).toHaveAttribute('data-handlepos', 'right');
  await expect(nodeOneTarget).toHaveAttribute('data-handlepos', 'left');
  await expect(nodeOneTarget).toHaveAttribute('title', /Self-links are rejected/);

  async function connect(source: import('@playwright/test').Locator, target: import('@playwright/test').Locator) {
    if (await page.getByTestId('studio-canvas').getAttribute('data-edge-authoring-mode') !== 'link') {
      await openStudioWorkspace(page, 'Topo');
      await page.getByTestId('palette-link').click();
    }
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
  await expect(nodeTwoTarget).toHaveClass(/\bvalid\b/);
  await release();
  await expect(page.locator('.react-flow__edge')).toHaveCount(2);
  const parallelPaths = await page.locator('.react-flow__edge path.react-flow__edge-path').evaluateAll((paths) => (
    paths.map((path) => path.getAttribute('d'))
  ));
  expect(new Set(parallelPaths).size).toBe(2);
  await openSource(page);
  await expectSourceContains(page, 'id: link-2');
});

test('authors grouped parallel links and expands the aggregate on click', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await page.getByTestId('palette-router').click();
  await page.getByTestId('palette-router').click();

  await drawEdgeTemplate(page, 'parallel-link', 'router-1', 'router-2');

  const aggregate = page.locator('.topoviewer-edge-aggregate[data-link-aggregate="true"]');
  await expect(aggregate).toHaveCount(1);
  await expect(aggregate).toHaveAttribute('data-link-count', '3');
  await page.getByRole('button', { name: 'Expand 3 parallel links' }).click();
  await expect(aggregate).toHaveCount(0);
  await expect(page.locator('.react-flow__edge[data-id^="link-"]')).toHaveCount(3);
  const collapse = page.getByRole('button', { name: 'Collapse 3 parallel links' });
  await expect(collapse).toBeVisible();
  await collapse.click();
  await expect(aggregate).toHaveCount(1);
  await expect(page.locator('.react-flow__edge[data-id^="link-"]')).toHaveCount(0);

  await openSource(page);
  for (const query of ['id: link-3', 'grouping:', 'expandOnClick: true']) {
    await expectSourceContains(page, query);
  }
});

test('authors a parent link pipe independently from parallel grouping', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-router').click();
  await page.getByTestId('palette-router').click();

  await drawEdgeTemplate(page, 'parallel-link', 'router-1', 'router-2');
  await expect(page.locator('.topoviewer-edge-aggregate[data-link-aggregate="true"]')).toHaveCount(1);
  await drawEdgeTemplate(page, 'parent-link-pipe', 'edge-01', 'noc-controller');

  await expect(page.locator('.topoviewer-edge-aggregate[data-link-aggregate="true"]')).toHaveCount(1);
  await expect(page.locator('.topoviewer-edge-pipe-fill')).toHaveCount(1);
  await expect(page.locator('.react-flow__edge[data-id="link-4"]')).toHaveCount(1);
  await expect(page.locator('.react-flow__edge[data-id="link-5"]')).toHaveCount(1);
  await openSource(page);
  for (const query of ['name: Parent Link Pipe', 'pipe: true', 'name: Child Link Lane', 'parent: link-4']) {
    await expectSourceContains(page, query);
  }
});

test('connects a callout to a node through the canonical leader target', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await dragTemplate(page, 'callout', { x: 140, y: 180 });
  await dragTemplate(page, 'router', { x: 500, y: 180 });
  await dragTemplate(page, 'callout', { x: 500, y: 380 });

  const calloutSource = page.locator('.react-flow__node[data-id="callout-1"] .react-flow__handle-right');
  const nodeTarget = page.locator('.react-flow__node[data-id="router-1"] .topoviewer-node-handle-default-target');
  await page.getByTestId('palette-link').click();
  const sourceBox = await calloutSource.boundingBox();
  const targetBox = await nodeTarget.boundingBox();
  if (!sourceBox || !targetBox) throw new Error('Callout connection handles are not measurable.');
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
  await page.mouse.up();

  await expect(page.locator('.react-flow__edge[data-id="callout-1:leader"]')).toHaveCount(1);
  const nodeSource = page.locator('.react-flow__node[data-id="router-1"] .topoviewer-node-handle-default');
  const secondCalloutTarget = page.locator('.react-flow__node[data-id="callout-2"] .react-flow__handle-left');
  await page.getByTestId('palette-link').click();
  const nodeSourceBox = await nodeSource.boundingBox();
  const secondCalloutTargetBox = await secondCalloutTarget.boundingBox();
  if (!nodeSourceBox || !secondCalloutTargetBox) throw new Error('Reverse callout connection handles are not measurable.');
  await page.mouse.move(nodeSourceBox.x + nodeSourceBox.width / 2, nodeSourceBox.y + nodeSourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(secondCalloutTargetBox.x + secondCalloutTargetBox.width / 2, secondCalloutTargetBox.y + secondCalloutTargetBox.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('.react-flow__edge[data-id="callout-2:leader"]')).toHaveCount(1);

  await openSource(page);
  await expectSourceContains(page, 'target: router-1');
  await expectSourceContains(page, 'id: link-1', false);
});

test('supports selection CRUD, clipboard, layout actions, history, and scoped shortcuts', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await page.getByTestId('palette-router').click();
  await page.getByTestId('palette-router').click();
  await page.getByTestId('palette-router').click();
  await selectNodes(page, ['router-1', 'router-2', 'router-3']);

  await page.getByRole('button', { name: 'Distribute selection horizontally' }).click();
  await page.getByRole('button', { name: 'Copy selection' }).click();
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('ControlOrMeta+v');
  await expect(page.locator('.react-flow__node')).toHaveCount(6);

  await page.getByRole('button', { name: 'Cut selection' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('ControlOrMeta+v');
  await expect(page.locator('.react-flow__node')).toHaveCount(6);

  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('Delete');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(6);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(3);

  await page.locator('.react-flow__node[data-id="router-1"]').click();
  const name = page.getByRole('textbox', { name: 'Name' });
  await name.fill('Editable Name');
  await name.press('Backspace');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);

  await page.locator('.react-flow__pane').click({ position: { x: 12, y: 12 } });
  const viewport = await openStudioWorkspace(page, 'Viewport');
  const helperLines = viewport.getByRole('switch', { name: 'Helper lines' });
  await helperLines.uncheck();
  await expect(viewport.getByRole('switch', { name: 'Snap to alignment' })).toBeDisabled();
  await helperLines.focus();
  await page.keyboard.press('Delete');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  const node = page.locator('.react-flow__node[data-id="router-1"]');
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
  await page.goto('/?__studio-test-state=starter');
  await page.getByTestId('palette-router').click();
  await page.getByTestId('palette-router').click();
  await selectNodes(page, ['router-1', 'router-2']);
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);

  await page.locator('.react-flow__node[data-id="router-1"]').click();
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('Delete');
  await expect(page.locator('.react-flow__node')).toHaveCount(1);
  await expect(page.locator('.react-flow__edge')).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('resizes a selected node through the native resize handles', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await page.getByTestId('palette-router').click();

  const handle = page.locator('.react-flow__node[data-id="router-1"] .topoviewer-resize-handle.bottom.right');
  await expect(handle).toBeVisible();
  const inspector = await openStyleWorkspace(page);
  await editStyleAttribute(inspector, 'Bypass', 'Shape');
  await inspector.getByRole('combobox', { name: 'Shape' }).selectOption('rectangle');
  await editStyleAttribute(inspector, 'Bypass', 'Body width');
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
  await page.goto('/?__studio-test-state=starter');
  await dragTemplate(page, 'router', { x: 140, y: 180 });
  await dragTemplate(page, 'service', { x: 330, y: 240 });
  await dragTemplate(page, 'controller', { x: 500, y: 300 });

  await page.locator('.react-flow__node[data-id="router-1"]').click({ button: 'right' });
  const menu = page.getByRole('menu', { name: 'Selection actions' });
  await expect(menu).toBeVisible();
  await menu.getByRole('menuitem', { name: 'Save as preset' }).click();
  await openStudioWorkspace(page, 'Topo');
  await expect(page.getByTestId('palette-preset:preset-1')).toBeVisible();

  await page.locator('.react-flow__pane').click({ position: { x: 320, y: 520 } });
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
  await page.goto('/?__studio-test-state=starter');
  await page.getByTestId('palette-router').click();
  await page.getByTestId('palette-router').click();
  await selectNodes(page, ['router-1', 'router-2']);
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  await selectNodes(page, ['router-1', 'router-2']);
  await openStudioWorkspace(page, 'Topo');
  await page.getByTestId('palette-path').click();

  await openSource(page);
  await expectSourceContains(page, 'id: path-1');
  await expectSourceContains(page, '- paths');
  await expectSourceContains(page, '- router-1');
  await expectSourceContains(page, '- router-2');
});

test('creates a deterministic shortest path when that authoring mode is selected', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await page.getByTestId('palette-router').click();
  await page.getByTestId('palette-router').click();
  await page.getByTestId('palette-router').click();
  await selectNodes(page, ['router-1', 'router-2']);
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  await selectNodes(page, ['router-2', 'router-3']);
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');

  await page.locator('.react-flow__pane').click({ position: { x: 12, y: 12 } });
  const viewport = await openStudioWorkspace(page, 'Viewport');
  await viewport.getByRole('combobox', { name: 'Path authoring' }).selectOption('shortest');
  await selectNodes(page, ['router-1', 'router-3']);
  const palette = await openStudioWorkspace(page, 'Topo');
  await palette.getByTestId('palette-path').click();

  await openSource(page);
  await expectSourceContains(page, 'sequence:');
  await expectSourceContains(page, '- router-1');
  await expectSourceContains(page, '- router-2');
  await expectSourceContains(page, '- router-3');
  await expect(page.locator('.react-flow__edge[data-id="link-1"]')).toHaveCount(1);
  await expect(page.locator('.react-flow__edge[data-id="link-2"]')).toHaveCount(1);
});
