import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import postcss from 'postcss';
import ts from 'typescript';

const root = process.cwd();
const sourceRoot = join(root, 'packages', 'topoviewer-studio', 'src');
const stylesheetManifest = join(sourceRoot, 'styles', 'studio.css');
const appEntrypoint = join(sourceRoot, 'app', 'StudioApp.tsx');
const themeProvider = join(sourceRoot, 'ui', 'StudioThemeProvider.tsx');
const themeFactory = join(sourceRoot, 'ui', 'createStudioTheme.ts');
const colorContract = join(sourceRoot, 'ui', 'colorContract.ts');
const typographyContract = join(sourceRoot, 'ui', 'typographyContract.ts');
const monacoTypography = join(sourceRoot, 'features', 'workspace', 'monacoTypography.ts');
const spacingContract = join(sourceRoot, 'ui', 'spacingContract.ts');
const muiSpacing = join(sourceRoot, 'ui', 'muiSpacing.ts');
const cssSpacing = join(sourceRoot, 'ui', 'cssSpacing.ts');
const studioCssVariables = join(sourceRoot, 'ui', 'studioCssVariables.ts');
const studioWorkspace = join(sourceRoot, 'app', 'StudioWorkspace.tsx');
const monacoSpacing = join(sourceRoot, 'features', 'workspace', 'monacoSpacing.ts');
const controls = join(sourceRoot, 'ui', 'controls.tsx');
const cssBudget = Object.freeze({
  declarations: 200,
  lines: 350,
  rules: 60,
  stylesheetLines: 180
});
const approvedColorLiterals = new Set();
const colorLiteralPattern = /#[0-9a-f]{3,8}\b|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\s*\([^)]*\)/gi;
const typographyLiteralPattern = /\b(font|fontFamily|fontSize|fontWeight|letterSpacing|lineHeight|textTransform)\s*:\s*(?:-?\d+(?:\.\d+)?|['"`])/g;
const cssTypographyPattern = /(?:^|[;{])\s*(font|font-family|font-size|font-weight|letter-spacing|line-height|text-transform)\s*:/gm;
const spacingProperties = new Set([
  'gap', 'rowGap', 'columnGap',
  'm', 'mt', 'mr', 'mb', 'ml', 'mx', 'my',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'p', 'pt', 'pr', 'pb', 'pl', 'px', 'py',
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'
]);
const cssSpacingPropertyPattern = /^(?:gap|row-gap|column-gap|margin(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?|padding(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?)$/;
const namedColors = new Set(`
  aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown
  burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan
  darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid
  darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet
  deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro
  ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki
  lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow
  lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray
  lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue
  mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred
  midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid
  palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple
  rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue
  slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat
  white whitesmoke yellow yellowgreen
`.trim().split(/\s+/));
const failures = [];
const selectorOwners = new Map();
const cssMetrics = { declarations: 0, lines: 0, rules: 0 };
const dynamicStudioClasses = new Set([
  'studio-mapper-workspace--panel',
  'studio-saved-state--conflict',
  'studio-saved-state--invalid-draft',
  'studio-saved-state--modified',
  'studio-saved-state--recovery',
  'studio-saved-state--saving'
]);

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

function withoutComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function propertyName(node, sourceFile) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
  return node.getText(sourceFile).replace(/^['"]|['"]$/g, '');
}

function unwrapExpression(node) {
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
    return unwrapExpression(node.expression);
  }
  return node;
}

function isApprovedSpacingExpression(node, sourceFile) {
  const expression = unwrapExpression(node);
  if (ts.isNumericLiteral(expression)) return Number(expression.text) === 0;
  if (ts.isPrefixUnaryExpression(expression)) {
    return expression.operator === ts.SyntaxKind.MinusToken
      && ts.isNumericLiteral(expression.operand)
      && Number(expression.operand.text) === 0;
  }
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    const value = expression.text.trim();
    return /^(?:0|0px|auto)$/.test(value) || value.includes('var(--studio-space-');
  }
  if (ts.isPropertyAccessExpression(expression)) {
    return /^(?:studioSpace|studioLayoutSpacing)\./.test(expression.getText(sourceFile));
  }
  if (ts.isConditionalExpression(expression)) {
    return isApprovedSpacingExpression(expression.whenTrue, sourceFile)
      && isApprovedSpacingExpression(expression.whenFalse, sourceFile);
  }
  if (ts.isObjectLiteralExpression(expression)) {
    return expression.properties.every((property) => {
      if (ts.isSpreadAssignment(property)) return true;
      return ts.isPropertyAssignment(property) && isApprovedSpacingExpression(property.initializer, sourceFile);
    });
  }
  return expression.kind === ts.SyntaxKind.UndefinedKeyword;
}

function inspectSxSpacing(expression, sourceFile, file, inspected) {
  const node = unwrapExpression(expression);
  if (inspected.has(node)) return;
  inspected.add(node);

  if (ts.isConditionalExpression(node)) {
    inspectSxSpacing(node.whenTrue, sourceFile, file, inspected);
    inspectSxSpacing(node.whenFalse, sourceFile, file, inspected);
    return;
  }
  if (ts.isArrayLiteralExpression(node)) {
    node.elements.forEach((element) => inspectSxSpacing(element, sourceFile, file, inspected));
    return;
  }
  if (!ts.isObjectLiteralExpression(node)) return;

  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const name = propertyName(property.name, sourceFile);
    if (spacingProperties.has(name)) {
      if (!isApprovedSpacingExpression(property.initializer, sourceFile)) {
        const line = sourceFile.getLineAndCharacterOfPosition(property.getStart(sourceFile)).line + 1;
        failures.push(`${relative(root, file)}:${line} owns ${name} spacing; use studioSpace or studioLayoutSpacing.`);
      }
      continue;
    }
    inspectSxSpacing(property.initializer, sourceFile, file, inspected);
  }
}

function inspectSourceSpacing(file, source) {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const inspected = new Set();

  function inspectJsxSpacing(attribute) {
    if (!attribute.initializer) return;
    if (!ts.isJsxExpression(attribute.initializer) || !attribute.initializer.expression) {
      const line = sourceFile.getLineAndCharacterOfPosition(attribute.getStart(sourceFile)).line + 1;
      failures.push(`${relative(root, file)}:${line} owns JSX ${attribute.name.getText(sourceFile)} spacing; use a Studio spacing token.`);
      return;
    }
    if (isApprovedSpacingExpression(attribute.initializer.expression, sourceFile)) return;
    const line = sourceFile.getLineAndCharacterOfPosition(attribute.getStart(sourceFile)).line + 1;
    failures.push(`${relative(root, file)}:${line} owns JSX ${attribute.name.getText(sourceFile)} spacing; use studioSpace or studioLayoutSpacing.`);
  }

  function visit(node) {
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sourceFile);
      if (name === 'sx' && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression) {
        inspectSxSpacing(node.initializer.expression, sourceFile, file, inspected);
      } else if (name === 'spacing' || spacingProperties.has(name)) {
        inspectJsxSpacing(node);
      }
    }
    if (ts.isPropertyAssignment(node) && propertyName(node.name, sourceFile) === 'sx') {
      inspectSxSpacing(node.initializer, sourceFile, file, inspected);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function isApprovedCssSpacing(value) {
  const normalized = value.trim().replace(/\s*!important\s*$/, '');
  if (normalized.includes('var(--studio-space-')) return true;
  return normalized.split(/\s+/).every((part) => /^(?:0|0px|auto)$/.test(part));
}

function selectorBranches(selector) {
  const branches = [];
  let start = 0;
  let depth = 0;

  for (let index = 0; index < selector.length; index += 1) {
    const character = selector[index];
    if (character === '(' || character === '[') depth += 1;
    if (character === ')' || character === ']') depth = Math.max(0, depth - 1);
    if (character !== ',' || depth !== 0) continue;
    branches.push(selector.slice(start, index).trim());
    start = index + 1;
  }

  branches.push(selector.slice(start).trim());
  return branches.filter(Boolean);
}

function isHoverStateSelector(selector) {
  return /:(?:hover|focus|focus-visible)\b|\.Mui-focusVisible\b|\[aria-expanded\s*=\s*["']?true["']?\]/.test(selector);
}

function isSelectedStateSelector(selector) {
  return /\.Mui-selected\b|\[(?:aria-(?:current|expanded|pressed|selected)|data-active)\s*=\s*["']?true["']?\]/.test(selector);
}

function selectorScope(rule) {
  const ancestors = [];
  let parent = rule.parent;
  while (parent && parent.type !== 'root') {
    if (parent.type === 'atrule') ancestors.unshift(`@${parent.name} ${parent.params}`.trim());
    parent = parent.parent;
  }
  return ancestors.join(' > ');
}

const cssFiles = files(sourceRoot).filter((file) => extname(file) === '.css').sort();
const authoredStylesheets = cssFiles.filter((file) => file !== stylesheetManifest);

const appSource = readFileSync(appEntrypoint, 'utf8');
const cssImports = [...appSource.matchAll(/import\s+['"]([^'"]+\.css)['"];?/g)].map((match) => match[1]);
if (cssImports.length !== 1 || cssImports[0] !== '../styles/studio.css') {
  failures.push(`${relative(root, appEntrypoint)} must import only ../styles/studio.css; found ${cssImports.join(', ') || 'none'}.`);
}

const unexpectedLocalImports = files(sourceRoot)
  .filter((file) => /\.(?:ts|tsx)$/.test(file) && file !== appEntrypoint)
  .flatMap((file) => {
    const source = readFileSync(file, 'utf8');
    return [...source.matchAll(/import\s+['"](\.[^'"]+\.css)['"];?/g)]
      .map((match) => `${relative(root, file)} -> ${match[1]}`);
  });
if (unexpectedLocalImports.length) {
  failures.push(`Feature code must use the deterministic Studio manifest instead of local CSS imports:\n${unexpectedLocalImports.join('\n')}`);
}

const manifestSource = withoutComments(readFileSync(stylesheetManifest, 'utf8'));
const manifestImports = [...manifestSource.matchAll(/@import\s+['"]([^'"]+)['"]\s*;/g)]
  .map((match) => join(sourceRoot, 'styles', match[1]))
  .sort();
const missingImports = authoredStylesheets.filter((file) => !manifestImports.includes(file));
const staleImports = manifestImports.filter((file) => !authoredStylesheets.includes(file));
if (missingImports.length || staleImports.length || manifestImports.length !== authoredStylesheets.length) {
  failures.push([
    `${relative(root, stylesheetManifest)} must import every feature-owned stylesheet exactly once.`,
    missingImports.length ? `Missing: ${missingImports.map((file) => relative(root, file)).join(', ')}` : '',
    staleImports.length ? `Stale: ${staleImports.map((file) => relative(root, file)).join(', ')}` : ''
  ].filter(Boolean).join('\n'));
}

const nonCssSource = files(sourceRoot)
  .filter((file) => /\.(?:ts|tsx)$/.test(file))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');
const allCssSource = authoredStylesheets.map((file) => readFileSync(file, 'utf8')).join('\n');
if (!allCssSource.includes('var(--mui-palette-')) {
  failures.push('Feature-owned Studio stylesheets do not consume MUI palette variables.');
}

for (const stylesheet of authoredStylesheets) {
  const rawSource = readFileSync(stylesheet, 'utf8');
  const cssSource = withoutComments(rawSource);
  const lineCount = rawSource.split('\n').length - 1;
  cssMetrics.lines += lineCount;
  if (lineCount > cssBudget.stylesheetLines) {
    failures.push(`${relative(root, stylesheet)} has ${lineCount} lines; feature-owned Studio stylesheets are limited to ${cssBudget.stylesheetLines}.`);
  }
  if (/prefers-color-scheme/.test(cssSource)) {
    failures.push(`${relative(root, stylesheet)} must not branch on OS color scheme; StudioThemeProvider owns the application palette.`);
  }

  for (const match of cssSource.matchAll(cssTypographyPattern)) {
    failures.push(`${relative(root, stylesheet)}:${lineNumber(cssSource, match.index)} owns ${match[1]}; use the canonical Studio typography contract through its UI adapter.`);
  }

  for (const match of cssSource.matchAll(colorLiteralPattern)) {
    const literal = match[0].toLowerCase();
    if (approvedColorLiterals.has(literal)) continue;
    failures.push(`${relative(root, stylesheet)}:${lineNumber(cssSource, match.index)} owns color literal ${match[0]}; use a --mui-palette-* token.`);
  }

  for (const match of cssSource.matchAll(/(?:^|[;{])\s*([\w-]+)\s*:\s*([^;{}]+)(?=;|})/gm)) {
    const value = match[2].trim().replace(/\s*!important\s*$/, '').toLowerCase();
    if (!namedColors.has(value) || approvedColorLiterals.has(value)) continue;
    failures.push(`${relative(root, stylesheet)}:${lineNumber(cssSource, match.index)} owns named color ${value}; use a --mui-palette-* token.`);
  }

  for (const match of cssSource.matchAll(/\.(studio-[a-zA-Z0-9_-]+)/g)) {
    const className = match[1];
    if (dynamicStudioClasses.has(className) || nonCssSource.includes(className)) continue;
    failures.push(`${relative(root, stylesheet)}:${lineNumber(cssSource, match.index)} styles unowned class .${className}.`);
  }

  for (const rule of cssSource.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = rule[1].trim();
    const declarations = rule[2];
    if (!selector || selector.startsWith('@')) continue;

    for (const state of ['hover', 'selected']) {
      const declaration = new RegExp(
        `background(?:-color)?\\s*:\\s*[^;{}]*var\\(--mui-palette-action-${state}\\)[^;{}]*(?:;|$)`,
        'i'
      );
      if (!declaration.test(declarations)) continue;

      const acceptsState = state === 'hover' ? isHoverStateSelector : isSelectedStateSelector;
      const staticBranches = selectorBranches(selector).filter((branch) => !acceptsState(branch));
      if (!staticBranches.length) continue;
      failures.push(
        `${relative(root, stylesheet)}:${lineNumber(cssSource, rule.index)} uses action.${state} as a persistent background for ${staticBranches.join(', ')}; use a neutral surface token and reserve action colors for explicit interaction states.`
      );
    }
  }

  let parsed;
  try {
    parsed = postcss.parse(rawSource, { from: stylesheet });
  } catch (error) {
    failures.push(`${relative(root, stylesheet)} could not be parsed: ${error instanceof Error ? error.message : String(error)}`);
    continue;
  }

  parsed.walkDecls((declaration) => {
    cssMetrics.declarations += 1;
    if (!cssSpacingPropertyPattern.test(declaration.prop) || isApprovedCssSpacing(declaration.value)) return;
    failures.push(
      `${relative(root, stylesheet)}:${declaration.source?.start?.line || 1} owns ${declaration.prop} spacing; use a --studio-space-* token.`
    );
  });
  parsed.walkRules((rule) => {
    cssMetrics.rules += 1;
    const selector = rule.selector.trim().replace(/\s+/g, ' ');
    if (/\.Mui[A-Za-z0-9_-]*/.test(selector)) {
      failures.push(`${relative(root, stylesheet)}:${rule.source?.start?.line || 1} reaches into MUI internals with ${selector}; use component props, sx, or theme defaults.`);
    }

    const key = `${selectorScope(rule)}::${selector}`;
    const owner = selectorOwners.get(key);
    const location = `${relative(root, stylesheet)}:${rule.source?.start?.line || 1}`;
    if (owner) failures.push(`${location} duplicates selector ${selector} already owned by ${owner}.`);
    else selectorOwners.set(key, location);
  });
}

const sourceFiles = files(sourceRoot).filter((file) => /\.(?:ts|tsx)$/.test(file));
const typographyConsumers = new Set([themeFactory, monacoTypography]);
const spacingConsumers = new Set([muiSpacing, cssSpacing, monacoSpacing]);
for (const file of sourceFiles) {
  if (file === typographyContract) continue;
  const rawSource = readFileSync(file, 'utf8');
  const source = withoutComments(rawSource);
  inspectSourceSpacing(file, rawSource);
  for (const match of source.matchAll(typographyLiteralPattern)) {
    failures.push(`${relative(root, file)}:${lineNumber(source, match.index)} owns ${match[1]}; declare typography values only in ${relative(root, typographyContract)}.`);
  }
  if (!source.includes('typographyContract')) continue;
  if (!typographyConsumers.has(file)) {
    failures.push(`${relative(root, file)} consumes the typography contract directly; route Studio UI through the MUI or Monaco adapter.`);
  }
}

for (const file of sourceFiles) {
  if (file === spacingContract) continue;
  const source = withoutComments(readFileSync(file, 'utf8'));
  if (!source.includes('spacingContract')) continue;
  if (!spacingConsumers.has(file)) {
    failures.push(`${relative(root, file)} consumes the spacing contract directly; route Studio layout through the MUI, CSS, or Monaco adapter.`);
  }
}

for (const consumer of typographyConsumers) {
  const source = readFileSync(consumer, 'utf8');
  if (!source.includes('typographyContract')) {
    failures.push(`${relative(root, consumer)} must derive its typography from ${relative(root, typographyContract)}.`);
  }
}

for (const consumer of spacingConsumers) {
  const source = readFileSync(consumer, 'utf8');
  if (!source.includes('spacingContract')) {
    failures.push(`${relative(root, consumer)} must derive its spacing from ${relative(root, spacingContract)}.`);
  }
}

for (const metric of ['lines', 'rules', 'declarations']) {
  if (cssMetrics[metric] <= cssBudget[metric]) continue;
  failures.push(`Studio authored CSS uses ${cssMetrics[metric]} ${metric}; the budget is ${cssBudget[metric]}. Move standard UI into MUI props or sx.`);
}

const themeSource = readFileSync(themeFactory, 'utf8');
if (!/colorSchemes:\s*{[\s\S]*\bdark:\s*toMuiPalette\(studioColors\.dark\)[\s\S]*\blight:\s*toMuiPalette\(studioColors\.light\)[\s\S]*}/s.test(themeSource)) {
  failures.push(`${relative(root, themeFactory)} must populate both MUI color schemes from ${relative(root, colorContract)}.`);
}
if (!/from '\.\/colorContract'/.test(themeSource)) {
  failures.push(`${relative(root, themeFactory)} must derive its palette from ${relative(root, colorContract)}.`);
}
for (const file of sourceFiles) {
  if (file === themeFactory || file === colorContract) continue;
  const source = withoutComments(readFileSync(file, 'utf8'));
  if (/from\s+['"][^'"]*colorContract['"]/.test(source)) {
    failures.push(`${relative(root, file)} consumes the color contract directly; use semantic MUI palette tokens instead.`);
  }
}
if (!/spacing:\s*studioMuiSpacingBase\b/.test(themeSource)) {
  failures.push(`${relative(root, themeFactory)} must derive MUI spacing from ${relative(root, spacingContract)} through ${relative(root, muiSpacing)}.`);
}
for (const match of themeSource.matchAll(colorLiteralPattern)) {
  failures.push(`${relative(root, themeFactory)}:${lineNumber(themeSource, match.index)} owns color literal ${match[0]}; use theme.palette.`);
}
for (const file of sourceFiles) {
  if (file === themeFactory) continue;
  const source = withoutComments(readFileSync(file, 'utf8'));
  if (/styleOverrides\s*:/.test(source)) {
    failures.push(`${relative(root, file)} owns MUI styleOverrides; component typography normalization belongs in ${relative(root, themeFactory)}.`);
  }
}

const providerSource = readFileSync(themeProvider, 'utf8');
if (!/createStudioTheme\(\)/.test(providerSource) || /createTheme\s*\(/.test(providerSource)) {
  failures.push(`${relative(root, themeProvider)} must consume createStudioTheme() instead of owning a second MUI theme.`);
}
if (!/storageManager={null}/.test(providerSource) || !/studioColorModePreferenceKey/.test(providerSource)) {
  failures.push(`${relative(root, themeProvider)} must persist appearance through StudioHost instead of MUI local storage.`);
}
const studioCssVariablesSource = readFileSync(studioCssVariables, 'utf8');
if (!/studioCssSpacing/.test(studioCssVariablesSource) || !/studioCssGeometry/.test(studioCssVariablesSource)) {
  failures.push(`${relative(root, studioCssVariables)} must compose canonical spacing and geometry variables.`);
}
const studioWorkspaceSource = readFileSync(studioWorkspace, 'utf8');
if (!/\.\.\.studioCssVariables/.test(studioWorkspaceSource)) {
  failures.push(`${relative(root, studioWorkspace)} must install canonical CSS variables on the Studio shell.`);
}

const controlsSource = readFileSync(controls, 'utf8');
const studioButtonSource = controlsSource.match(/export const StudioButton\b[\s\S]*?(?=export const StudioButtonBase\b)/)?.[0] || '';
if (/className|\.includes\(|\bvariant\s*=|\bcolor\s*=/.test(studioButtonSource)) {
  failures.push(`${relative(root, controls)} must not infer StudioButton color or variant from class names; callers must use explicit MUI props.`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Studio theme ownership check passed (${cssMetrics.lines} lines, ${cssMetrics.rules} rules, ${cssMetrics.declarations} declarations).`);
}
