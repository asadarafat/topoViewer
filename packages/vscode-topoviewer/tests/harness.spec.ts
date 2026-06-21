import { expect, test } from '@playwright/test';

async function topologyText(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => !!(window as any).monaco?.editor?.getModels?.()[0]);
  return page.evaluate(() => (window as any).monaco.editor.getModels()[0].getValue() as string);
}

async function setTopologyText(page: import('@playwright/test').Page, text: string) {
  await page.waitForFunction(() => !!(window as any).monaco?.editor?.getModels?.()[0]);
  await page.evaluate((value) => {
    (window as any).monaco.editor.getModels()[0].setValue(value);
  }, text);
}

async function railWidth(page: import('@playwright/test').Page) {
  const box = await page.locator('.topoviewer-vscode-rail').boundingBox();
  expect(box).not.toBeNull();
  return box!.width;
}

test('renders the browser harness with fixtures, diagnostics, layers, preview, and export wiring', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('TopoViewer')).toBeVisible();
  await expect(page.getByText('Browser harness')).toBeVisible();
  await expect(page.getByLabel('Fixture')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Build', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: 'Build', exact: true })).toHaveAttribute('aria-controls', 'topoviewer-authoring-tabpanel-0');
  await expect(page.locator('#topoviewer-authoring-tabpanel-0')).toBeVisible();
  await expect(page.locator('#topoviewer-authoring-tabpanel-4')).toBeHidden();
  await expect(page.locator('.topoviewer-vscode-mode-tabs')).toBeVisible();
  await expect(page.getByText('Primitives')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Insert Node' })).toBeVisible();
  await expect(page.getByText('Presets')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Insert Router' })).toBeVisible();
  await expect(page.locator('.topoviewer-vscode-editor .monaco-editor')).toBeHidden();
  await expect(page.locator('.topoviewer')).toBeVisible();
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await page.getByRole('tab', { name: 'Layers', exact: true }).click();
  await expect(page.getByLabel('Underlay')).toBeChecked();
  const layerList = page.locator('.topoviewer-vscode-layer-list');
  await expect(layerList.getByText('BGP', { exact: true })).toBeVisible();
  await expect(layerList.getByText('Service', { exact: true })).toBeVisible();
  await expect(layerList.getByText('Operations', { exact: true })).toBeVisible();
  await expect(layerList.locator('.topoviewer-vscode-layer-count').first()).not.toHaveText('0');

  const previewBox = await page.locator('.topoviewer-vscode-preview').boundingBox();
  const actionsBox = await page.locator('.topoviewer-vscode-preview-actions').boundingBox();
  expect(previewBox).not.toBeNull();
  expect(actionsBox).not.toBeNull();
  expect(actionsBox!.x - previewBox!.x).toBeLessThan(32);

  const layerOverflow = await page.locator('.topoviewer-vscode-layer-list')
    .evaluate((element) => window.getComputedStyle(element).overflowY);
  expect(layerOverflow).toBe('auto');

  await page.getByLabel('Underlay').uncheck();
  await expect(page.getByLabel('Underlay')).not.toBeChecked();

  const exportPromise = page.evaluate(() => new Promise((resolve) => {
    window.addEventListener('topoviewer-export-mock', () => resolve(true), { once: true });
  }));
  await page.getByRole('button', { name: /export/i }).click();
  await expect(exportPromise).resolves.toBeTruthy();
});

test('defaults to a one-third authoring rail and supports resize, reset, and persistence', async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem('topoviewer.split.initCleared')) {
      window.localStorage.removeItem('topoviewer.vscodeHarness.splitPercent.v2');
      window.sessionStorage.setItem('topoviewer.split.initCleared', 'true');
    }
  });
  await page.goto('/');

  const workspaceBox = await page.locator('.topoviewer-vscode-workspace').boundingBox();
  const railBox = await page.locator('.topoviewer-vscode-rail').boundingBox();
  expect(workspaceBox).not.toBeNull();
  expect(railBox).not.toBeNull();
  const defaultRatio = railBox!.width / workspaceBox!.width;
  expect(defaultRatio).toBeGreaterThan(0.29);
  expect(defaultRatio).toBeLessThan(0.37);

  const divider = page.getByRole('separator', { name: /resize authoring column and canvas/i });
  await expect(divider).toBeVisible();
  const beforeKeyboard = await railWidth(page);
  await divider.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => railWidth(page)).toBeGreaterThan(beforeKeyboard);
  await expect.poll(() => page.evaluate(() => Number(window.localStorage.getItem('topoviewer.vscodeHarness.splitPercent.v2') || 0)))
    .toBeGreaterThan(33.333);

  await page.reload();
  await page.waitForSelector('.topoviewer-vscode-workspace');
  await expect.poll(() => railWidth(page)).toBeGreaterThan(beforeKeyboard);

  const beforeDrag = await railWidth(page);
  const dividerBox = await divider.boundingBox();
  expect(dividerBox).not.toBeNull();
  await page.mouse.move(dividerBox!.x + dividerBox!.width / 2, dividerBox!.y + dividerBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(dividerBox!.x + dividerBox!.width / 2 + 110, dividerBox!.y + dividerBox!.height / 2);
  await page.mouse.up();
  await expect.poll(() => railWidth(page)).toBeGreaterThan(beforeDrag + 60);

  await divider.focus();
  await page.keyboard.press('Home');
  await expect.poll(async () => {
    const workspace = await page.locator('.topoviewer-vscode-workspace').boundingBox();
    return (await railWidth(page)) / workspace!.width;
  }).toBeLessThan(0.37);
  await expect.poll(async () => {
    const workspace = await page.locator('.topoviewer-vscode-workspace').boundingBox();
    return (await railWidth(page)) / workspace!.width;
  }).toBeGreaterThan(0.29);
});

test('uses a stacked narrow viewport fallback without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 820 });
  await page.goto('/');

  await expect(page.getByRole('separator', { name: /resize authoring column and canvas/i })).toBeHidden();
  await expect(page.locator('.topoviewer-vscode-preview')).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(hasHorizontalOverflow).toBeFalsy();
});

test('wraps attention controls without clipping at the minimum authoring rail width', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('topoviewer.vscodeHarness.splitPercent.v2', '24');
  });
  await page.goto('/');

  await page.getByRole('tab', { name: 'Attention', exact: true }).click();
  await expect(page.locator('.topoviewer-vscode-attention-pane')).toBeVisible();
  const attentionPane = page.locator('.topoviewer-vscode-attention-pane');
  for (const sectionName of ['Match by metadata', 'Click behavior', 'Dense summaries']) {
    await attentionPane.getByRole('button', { name: new RegExp(sectionName, 'i') }).click();
  }

  const clippedControls = await attentionPane.evaluate((pane) => {
    const scroll = pane.querySelector('.topoviewer-vscode-mode-pane-scroll')?.getBoundingClientRect();
    if (!scroll) return ['attention scroll container missing'];
    const controls = Array.from(pane.querySelectorAll('.MuiFormControl-root, .MuiTextField-root')).filter((control) => {
      const rect = control.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    return controls.flatMap((control) => {
      const rect = control.getBoundingClientRect();
      const label = control.querySelector('.MuiInputLabel-root')?.getBoundingClientRect();
      const isFullyVisibleVertically = rect.top >= scroll.top - 1 && rect.bottom <= scroll.bottom + 1;
      const failures: string[] = [];
      if (rect.left < scroll.left - 1 || rect.right > scroll.right + 1) {
        failures.push(`field clipped: ${control.textContent?.trim()}`);
      }
      if (isFullyVisibleVertically && label && label.top < scroll.top - 1) {
        failures.push(`label clipped: ${control.textContent?.trim()}`);
      }
      return failures;
    });
  });
  expect(clippedControls).toEqual([]);

  const inputHeightDelta = await page.evaluate(() => {
    const roots = [
      ...Array.from(document.querySelectorAll('.topoviewer-vscode-fixture .MuiInputBase-root')),
      ...Array.from(document.querySelectorAll('.topoviewer-vscode-attention-pane .MuiInputBase-root'))
    ];
    const heights = roots
      .map((input) => input.getBoundingClientRect().height)
      .filter((height) => height > 0);
    return Math.max(...heights) - Math.min(...heights);
  });
  expect(inputHeightDelta).toBeLessThanOrEqual(1);
});

test('supports authoring modes, selection, multi-select, and blank-canvas clear', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('tab', { name: 'Build', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Inspect', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Inspect', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'YAML', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'YAML', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Attention', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Attention', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Layers', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Layers', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Build', exact: true }).click();

  await page.locator('.react-flow__node').filter({ hasText: 'FRA-PE' }).click();
  await expect(page.getByText('1 node selected')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Inspect', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.locator('.react-flow__node').filter({ hasText: 'AMS-P' }).click({ modifiers: ['Control'] });
  await expect(page.getByText('2 node selected')).toBeVisible();
  await page.locator('.react-flow__pane').click({ position: { x: 24, y: 120 } });
  await expect(page.getByText('Select a canvas object')).toBeVisible();
});

test('inserts objects into structured topology YAML and supports undo and redo', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('New Node')).toHaveCount(0);
  await page.getByRole('button', { name: 'Insert Node' }).click();
  await expect(page.locator('.react-flow__node').filter({ hasText: 'New Node' })).toBeVisible();
  await expect.poll(() => topologyText(page)).toContain('id: node-1');
  await expect.poll(() => topologyText(page)).toContain('layers:');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: node-1');
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect.poll(() => topologyText(page)).toContain('id: node-1');
});

test('updates selected object properties and deletes with reversible YAML mutations', async ({ page }) => {
  await page.goto('/');

  await page.locator('.react-flow__node').filter({ hasText: 'FRA-PE' }).click();
  const inspector = page.locator('.topoviewer-vscode-inspector-pane');
  await expect(inspector.getByLabel('Object name')).toHaveValue('node:fra-pe');
  await expect(inspector.getByLabel('Display name')).toHaveValue('FRA-PE');
  const clippedInspectorLabels = await inspector.evaluate((pane) => {
    const scroll = pane.querySelector('.topoviewer-vscode-mode-pane-scroll')?.getBoundingClientRect();
    if (!scroll) return ['inspector scroll container missing'];
    return Array.from(pane.querySelectorAll('.MuiInputLabel-root')).flatMap((label) => {
      const rect = label.getBoundingClientRect();
      return rect.top < scroll.top - 1 ? [`label clipped: ${label.textContent?.trim()}`] : [];
    });
  });
  expect(clippedInspectorLabels).toEqual([]);
  await inspector.getByLabel('Display name').fill('FRA-PE Edited');
  await inspector.getByRole('button', { name: 'Apply properties' }).click();
  await expect.poll(() => topologyText(page)).toContain('name: FRA-PE Edited');

  await inspector.getByLabel('Label key').fill('owner');
  await inspector.getByLabel('Value').nth(0).fill('core');
  await inspector.getByRole('button', { name: 'Add' }).nth(0).click();
  await inspector.getByLabel('Data key').fill('ticket');
  await inspector.getByLabel('Value').nth(1).fill('INC-1');
  await inspector.getByRole('button', { name: 'Add' }).nth(1).click();
  await inspector.getByRole('combobox', { name: 'Style key' }).click();
  await page.getByRole('option', { name: 'Border color', exact: true }).click();
  await inspector.getByLabel('Style value').fill('#1976d2');
  await inspector.getByRole('button', { name: 'Add style' }).click();

  await expect.poll(() => topologyText(page)).toContain('owner: core');
  await expect.poll(() => topologyText(page)).toContain('ticket: INC-1');
  await expect.poll(() => topologyText(page)).toContain('borderColor: "#1976d2"');

  await inspector.getByLabel('Preset name').fill('Blue PE');
  await inspector.getByRole('button', { name: 'Save as preset' }).click();
  await page.getByRole('tab', { name: 'Build', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Insert Blue PE' })).toBeVisible();
  await page.getByRole('button', { name: 'Insert Blue PE' }).click();
  await expect.poll(() => topologyText(page)).toContain('name: Blue PE');
  await expect.poll(() => topologyText(page)).toContain('borderColor: "#1976d2"');

  await page.getByRole('tab', { name: 'Inspect', exact: true }).click();
  await inspector.getByRole('button', { name: 'Delete' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: fra-pe');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => topologyText(page)).toContain('id: fra-pe');
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: fra-pe');
});

test('preserves invalid Monaco content when a structured mutation cannot be applied', async ({ page }) => {
  await page.goto('/');

  await setTopologyText(page, 'graph: [');
  await page.getByRole('tab', { name: 'Build', exact: true }).click();
  await page.getByRole('button', { name: 'Insert Node' }).click();
  await expect.poll(() => topologyText(page)).toBe('graph: [');
});

test('authors attention focus, interaction, aggregation, and link grouping YAML', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('tab', { name: 'Attention', exact: true }).click();
  const attention = page.locator('.topoviewer-vscode-attention-pane');
  await page.locator('.react-flow__node').filter({ hasText: 'LON-PE' }).click();
  await expect(page.getByText('1 node selected')).toBeVisible();
  await expect(attention.getByText('Dim keeps context visible. Hide removes non-matching objects.')).toBeVisible();

  await attention.getByRole('button', { name: /Match by metadata/i }).click();
  const metadata = attention.locator('.MuiAccordion-root').filter({ hasText: 'Match by metadata' });
  await expect(metadata.getByText('Focus every object with a matching label or data value.')).toBeVisible();
  await metadata.getByLabel('Label key').fill('role');
  await metadata.getByLabel('Value').first().fill('pe');
  await metadata.getByRole('button', { name: 'Apply attention label focus' }).click();
  await expect.poll(() => topologyText(page)).toContain('labels:');
  await expect.poll(() => topologyText(page)).toContain('role: pe');

  await metadata.getByLabel('Data key').fill('severity');
  await metadata.getByLabel('Value').last().fill('major');
  await metadata.getByRole('button', { name: 'Apply attention data focus' }).click();
  await expect.poll(() => topologyText(page)).toContain('data:');
  await expect.poll(() => topologyText(page)).toContain('severity: major');

  await attention.getByRole('button', { name: /Click behavior/i }).click();
  const clickBehavior = attention.locator('.MuiAccordion-root').filter({ hasText: 'Click behavior' });
  await clickBehavior.getByLabel('Interactive').check();
  await clickBehavior.getByRole('button', { name: 'Apply click behavior' }).click();
  await expect.poll(() => topologyText(page)).toContain('interactive: true');

  await attention.getByRole('button', { name: /Dense summaries/i }).click();
  const denseSummaries = attention.locator('.MuiAccordion-root').filter({ hasText: 'Dense summaries' });
  await denseSummaries.getByRole('button', { name: 'Aggregate region' }).click();
  await expect.poll(() => topologyText(page)).toContain('by: region');
  await expect.poll(() => topologyText(page)).toContain('expandOnClick: true');

  await denseSummaries.getByLabel('Link threshold').fill('3');
  await denseSummaries.getByRole('button', { name: 'Group links' }).click();
  await expect.poll(() => topologyText(page)).toContain('threshold: 3');

  await attention.getByRole('button', { name: 'Use selection' }).click();
  await expect.poll(() => topologyText(page)).toContain('ids:');
  await expect.poll(() => topologyText(page)).toContain('- lon-pe');
});

test('serves validation through the local fixture API', async ({ request }) => {
  const topology = await (await request.get('/fixtures/layered-network/topology.yaml')).text();
  const stylesheet = await (await request.get('/fixtures/layered-network/stylesheet.yaml')).text();
  const response = await request.post('/validate', {
    data: { topologyText: topology, stylesheetText: stylesheet }
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.diagnostics).toEqual([]);
  expect(body.layers.map((layer: { id: string }) => layer.id)).toContain('underlay');
  expect(body.layers.map((layer: { id: string }) => layer.id)).toContain('operations');
  expect(body.layers.every((layer: { objectCount: number }) => layer.objectCount > 0)).toBeTruthy();
});

test('reports missing companion files through validation diagnostics', async ({ request }) => {
  const topology = await (await request.get('/fixtures/layered-network/topology.yaml')).text();
  const response = await request.post('/validate', {
    data: {
      topologyText: topology,
      stylesheetText: '',
      stylesheetPath: '/workspace/stylesheet.yaml',
      stylesheetMissing: true
    }
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.diagnostics).toContainEqual(expect.objectContaining({
    severity: 'warning',
    source: 'host',
    code: 'missing-stylesheet-yaml'
  }));
});

test('harness fixtures do not expose empty layers', async ({ request }) => {
  const fixtures = await (await request.get('/fixtures')).json() as Array<{ id: string }>;
  expect(fixtures.map((fixture) => fixture.id)).toEqual(expect.arrayContaining([
    'insert-workflow',
    'attention-workflow',
    'inspector-workflow',
    'dense-links'
  ]));

  for (const fixture of fixtures) {
    const topology = await (await request.get(`/fixtures/${fixture.id}/topology.yaml`)).text();
    const stylesheet = await (await request.get(`/fixtures/${fixture.id}/stylesheet.yaml`)).text();
    const response = await request.post('/validate', {
      data: { topologyText: topology, stylesheetText: stylesheet }
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json() as { layers: Array<{ id: string; objectCount: number }> };
    expect(body.layers.length, `${fixture.id} should declare at least one layer`).toBeGreaterThan(0);
    for (const layer of body.layers) {
      expect(layer.objectCount, `${fixture.id}:${layer.id} should have objects`).toBeGreaterThan(0);
    }
  }
});

test.describe('browser harness theme mode', () => {
  test.use({ colorScheme: 'dark' });

  test('starts from browser system color scheme and toggles light and dark', async ({ page }) => {
    await page.goto('/');
    const shell = page.locator('.topoviewer-vscode-shell');

    await expect(shell).toHaveAttribute('data-color-mode', 'dark');
    await page.getByRole('button', { name: 'Switch to light mode' }).click();
    await expect(shell).toHaveAttribute('data-color-mode', 'light');
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await expect(shell).toHaveAttribute('data-color-mode', 'dark');
  });
});
