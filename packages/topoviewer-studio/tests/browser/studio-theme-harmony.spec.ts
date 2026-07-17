import { expect, test, type Locator, type Page } from '@playwright/test';
import { studioSpacing } from '../../src/ui/spacingContract';
import { studioTypography, type StudioTypographyRole } from '../../src/ui/typographyContract';
import { openStudioWorkspace } from '../support/workspaceRail';

async function expectTypographyRole(locator: Locator, role: StudioTypographyRole) {
  await expect(locator).toHaveCSS('font-size', `${role.size}px`);
  await expect(locator).toHaveCSS('font-weight', String(role.weight));
  await expect(locator).toHaveCSS('line-height', `${role.lineHeight}px`);
}

async function expectMuiRepresentation(workspace: Locator, accessibleName: string, selectedName = 'Visual') {
  const group = workspace.getByRole('group', { name: accessibleName });
  const selected = group.getByRole('button', { name: selectedName });
  await expect(group).toHaveClass(/MuiToggleButtonGroup-root/);
  await expect(selected).toHaveClass(/MuiToggleButton-root/);
  await expect(selected).toHaveClass(/Mui-selected/);
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
}

async function expectPaperSurface(surface: Locator) {
  const paper = await surface.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = 'var(--mui-palette-background-paper)';
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  });
  await expect(surface).toHaveCSS('background-color', paper);
}

async function expectNoPersistentActionSurfaces(page: Page, state: string) {
  await page.locator('.studio-shell').waitFor();
  const audit = await page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const actionColors = new Set([rootStyle.getPropertyValue('--mui-palette-action-hover').trim(), rootStyle.getPropertyValue('--mui-palette-action-selected').trim()]);
    const surface = document.body;

    const isVisible = (element: Element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
    };
    const isInteractiveState = (element: Element) =>
      element.matches([':hover', ':focus', ':focus-visible', '.Mui-focusVisible', '.Mui-selected', '[aria-current="true"]', '[aria-expanded="true"]', '[aria-pressed="true"]', '[aria-selected="true"]', '[data-active="true"]'].join(','));
    const describe = (element: Element) => {
      const id = element.id ? `#${element.id}` : '';
      const classes = [...element.classList]
        .slice(0, 3)
        .map((name) => `.${name}`)
        .join('');
      return `${element.tagName.toLocaleLowerCase()}${id}${classes}`;
    };
    const actionSurface = (element: Element) => actionColors.has(getComputedStyle(element).backgroundColor);
    const visibleElements = [surface, ...surface.querySelectorAll('*')].filter(isVisible);
    const persistent = visibleElements.filter((element) => actionSurface(element) && !isInteractiveState(element)).map(describe);
    const nested = visibleElements
      .filter(actionSurface)
      .filter((element) => {
        let ancestor = element.parentElement;
        while (ancestor && surface.contains(ancestor)) {
          if (actionSurface(ancestor)) return true;
          ancestor = ancestor.parentElement;
        }
        return false;
      })
      .map(describe);

    return { nested, persistent };
  });

  expect(audit.persistent, `${state} must not use action colors as permanent surfaces`).toEqual([]);
  expect(audit.nested, `${state} must not stack translucent action surfaces`).toEqual([]);
}

test('keeps MUI action colors limited to interaction states across Studio workspaces', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await expectNoPersistentActionSurfaces(page, 'Objects');

  const viewport = await openStudioWorkspace(page, 'Viewport');
  await expectPaperSurface(viewport);
  await expectNoPersistentActionSurfaces(page, 'Viewport');

  const mapper = await openStudioWorkspace(page, 'Mapper');
  await expectMuiRepresentation(mapper, 'Mapper representation');
  const firstRule = mapper.getByRole('button', { name: /health-a/ });
  const ruleAlignment = await firstRule.evaluate((element) => {
    const label = element.querySelector('strong');
    if (!label) return Number.POSITIVE_INFINITY;
    return label.getBoundingClientRect().left - element.getBoundingClientRect().left;
  });
  expect(ruleAlignment).toBeLessThanOrEqual(16);
  await expectNoPersistentActionSurfaces(page, 'Mapper');

  await openStudioWorkspace(page, 'Objects');
  await page.getByTestId('palette-router').click();
  const edit = await openStudioWorkspace(page, 'Edit');
  await expectMuiRepresentation(edit, 'Edit representation');
  await expect(edit.locator('.studio-edit-section').first()).toHaveClass(/MuiAccordion-root/);
  await expect(edit.locator('.studio-edit-section-heading').first()).toHaveClass(/MuiAccordionSummary-root/);
  await expectNoPersistentActionSurfaces(page, 'Edit');

  await edit.getByRole('group', { name: 'Edit representation' }).getByRole('button', { name: 'Code' }).click();
  await expectMuiRepresentation(edit, 'Edit representation', 'Code');
  await expectNoPersistentActionSurfaces(page, 'Edit code');

  await page.getByRole('button', { name: 'Project menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Project menu' })).toBeVisible();
  await expectNoPersistentActionSurfaces(page, 'Project menu');
  await page.keyboard.press('Escape');
});

test('renders Studio chrome and Monaco from the canonical typography contract', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');

  await expectTypographyRole(page.getByRole('heading', { level: 1, name: 'TopoViewer Studio' }), studioTypography.roles.appTitle);
  await expectTypographyRole(page.getByText('Experimental', { exact: true }), studioTypography.roles.metadata);

  const viewport = await openStudioWorkspace(page, 'Viewport');
  await expectTypographyRole(page.locator('h2.MuiTypography-subtitle1').filter({ hasText: /^Viewport$/ }), studioTypography.roles.panelTitle);
  await expectTypographyRole(viewport.locator('.studio-viewport-section .MuiTypography-subtitle2').first(), studioTypography.roles.sectionTitle);
  await expectTypographyRole(viewport.locator('.studio-property-row-label').first(), studioTypography.roles.body);
  await expectTypographyRole(viewport.getByRole('spinbutton', { name: 'Grid size' }), studioTypography.roles.body);

  const objects = await openStudioWorkspace(page, 'Objects');
  await objects.getByTestId('palette-router').click();
  const edit = await openStudioWorkspace(page, 'Edit');
  await edit.getByRole('group', { name: 'Edit representation' }).getByRole('button', { name: 'Code' }).click();
  const codeLine = edit.locator('.monaco-editor .view-line').first();
  await expectTypographyRole(codeLine, studioTypography.roles.code);
  await expect(codeLine).toHaveCSS('font-family', new RegExp(studioTypography.family.code.split(',')[0]));
});

test('renders panel, property-row, and palette spacing from the canonical contract', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');

  const rootSpacing = await page.locator('.studio-shell').evaluate((shell) => {
    const style = getComputedStyle(shell);
    return {
      panelInline: style.getPropertyValue('--studio-space-panel-inline').trim(),
      sectionGap: style.getPropertyValue('--studio-space-section-gap').trim(),
      space2: style.getPropertyValue('--studio-space-2').trim()
    };
  });
  expect(rootSpacing).toEqual({
    panelInline: `${studioSpacing.roles.panelInline}px`,
    sectionGap: `${studioSpacing.roles.sectionGap}px`,
    space2: `${studioSpacing.scale.space2}px`
  });

  const viewport = await openStudioWorkspace(page, 'Viewport');
  const header = page.locator('#studio-viewport-workspace').getByRole('heading', { exact: true, level: 2, name: 'Viewport' }).locator('xpath=..');
  await expect(header).toHaveCSS('column-gap', `${studioSpacing.roles.contentGap}px`);
  await expect(header).toHaveCSS('padding-left', `${studioSpacing.roles.panelInline}px`);
  await expect(header).toHaveCSS('padding-right', `${studioSpacing.roles.panelInline}px`);

  const row = viewport.locator('.studio-property-row').first();
  await expect(row).toHaveCSS('column-gap', `${studioSpacing.roles.compactGap}px`);
  await expect(row).toHaveCSS('padding-left', `${studioSpacing.roles.propertyRowInline}px`);
  await expect(row).toHaveCSS('padding-right', `${studioSpacing.roles.propertyRowInline}px`);
  await expect(row).toHaveCSS('padding-top', `${studioSpacing.roles.contentGap}px`);
  await expect(row).toHaveCSS('padding-bottom', `${studioSpacing.roles.contentGap}px`);

  const objects = await openStudioWorkspace(page, 'Objects');
  const router = objects.getByTestId('palette-router');
  await expect(router).toHaveCSS('padding-top', `${studioSpacing.scale.space2}px`);
  await expect(router).toHaveCSS('padding-right', `${studioSpacing.scale.space4}px`);
  await expect(router).toHaveCSS('padding-bottom', `${studioSpacing.scale.space2}px`);
  await expect(router).toHaveCSS('padding-left', `${studioSpacing.scale.space6}px`);
});

test('uses the shared compact panel anatomy for viewport settings', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  const viewport = await openStudioWorkspace(page, 'Viewport');
  const sections = viewport.locator('.studio-viewport-section');

  await expect(sections).toHaveCount(3);
  await expect(viewport.locator('.studio-field-group')).toHaveCount(0);
  await expect(sections.nth(0).getByRole('button', { exact: true, name: 'Canvas' })).toHaveAttribute('aria-expanded', 'true');
  await expect(sections.nth(1).getByRole('button', { exact: true, name: 'Interaction' })).toHaveAttribute('aria-expanded', 'true');
  await expect(sections.nth(2).getByRole('button', { exact: true, name: 'Advanced viewport' })).toHaveAttribute('aria-expanded', 'false');

  const firstRow = sections.first().locator('.studio-property-row').first();
  const alignment = await firstRow.evaluate((row) => {
    const label = row.querySelector<HTMLElement>('.studio-property-row-label');
    const control = row.querySelector<HTMLElement>('.studio-property-row-control');
    if (!label || !control) return undefined;
    const rowBox = row.getBoundingClientRect();
    const labelBox = label.getBoundingClientRect();
    const controlBox = control.getBoundingClientRect();
    return {
      controlLeft: controlBox.left,
      controlTop: controlBox.top,
      labelBottom: labelBox.bottom,
      labelLeft: labelBox.left,
      rowHeight: rowBox.height,
      verticalDelta: Math.abs(labelBox.top + labelBox.height / 2 - (controlBox.top + controlBox.height / 2))
    };
  });

  expect(alignment).toBeDefined();
  expect(alignment?.controlLeft).toBeCloseTo(alignment?.labelLeft || 0, 0);
  expect(alignment?.controlTop).toBeGreaterThanOrEqual((alignment?.labelBottom || 0) - 1);
  expect(alignment?.rowHeight).toBeGreaterThanOrEqual(64);

  const switchTrack = await viewport.getByRole('switch', { name: /Grid/ }).evaluate((input) => {
    const track = input.closest('.MuiSwitch-root')?.querySelector<HTMLElement>('.MuiSwitch-track');
    if (!track) return undefined;
    const box = track.getBoundingClientRect();
    return { height: box.height, width: box.width };
  });
  expect(switchTrack?.width).toBeGreaterThanOrEqual(20);
  expect(switchTrack?.height).toBeGreaterThanOrEqual(10);
});

test('renders extended style fields as a default MUI disclosure action', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await (await openStudioWorkspace(page, 'Objects')).getByTestId('palette-router').click();
  const edit = await openStudioWorkspace(page, 'Edit');
  const disclosure = edit.getByRole('button', { name: /^View more/ });

  await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
  await expect(disclosure).toHaveClass(/MuiButton-root/);
  await expect(disclosure).toHaveClass(/MuiButton-text/);

  await disclosure.click();
  await expect(edit.getByRole('button', { name: 'View less' })).toHaveAttribute('aria-expanded', 'true');
});

test('keeps normal Studio workflows free of browser console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/?__studio-test-state=mapper-coverage');
  await openStudioWorkspace(page, 'Objects');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();

  const edit = await openStudioWorkspace(page, 'Edit');
  await edit.getByRole('button', { name: /^View more/ }).click();
  await openStudioWorkspace(page, 'Viewport');
  const mapper = await openStudioWorkspace(page, 'Mapper');
  await mapper.getByRole('tab', { name: 'Advanced' }).click();
  await expect(mapper.getByRole('region', { name: 'Mapper fields' })).toBeVisible();

  const objects = await openStudioWorkspace(page, 'Objects');
  const annotations = objects.getByRole('button', { name: 'Annotations palette group' });
  if ((await annotations.getAttribute('aria-expanded')) !== 'true') await annotations.click();
  await objects.getByTestId('palette-text').click();
  await page.locator('.react-flow__node[data-id="text-1"]').dblclick();
  const quickEditor = page.getByRole('dialog', { name: /Edit text/i });
  await quickEditor.getByRole('tab', { name: 'Preview' }).click();
  await expect(quickEditor.getByRole('document', { name: 'Rich text preview' })).toBeVisible();
  await quickEditor.getByRole('button', { name: 'Cancel' }).click();

  expect(errors).toEqual([]);
});
