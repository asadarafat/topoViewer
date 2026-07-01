#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const PUBLIC_TEXT_ROOTS = [
  'README.md',
  'SECURITY.md',
  'SUPPORT.md',
  'CONTRIBUTING.md',
  'mkdocs.yml',
  'zensical.toml',
  'docs',
  'packages/topoviewer/content',
  'packages/topoviewer/docs',
  'packages/topoviewer/examples',
  'packages/topoviewer/README.md',
  'packages/mkdocs-topoviewer/README.md',
  'packages/vscode-topoviewer/README.md',
  'packages/grafana-topoviewer-panel/README.md',
  '.github'
];

const PRODUCTION_DOC_TEXT_ROOTS = [
  'README.md',
  'docs',
  'packages/topoviewer/README.md',
  'packages/mkdocs-topoviewer/README.md',
  'packages/vscode-topoviewer/README.md',
  'packages/grafana-topoviewer-panel/README.md'
];

const TEXT_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.go',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.py',
  '.sh',
  '.toml',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml'
]);

const IGNORED_PARTS = new Set([
  '.git',
  '.artifacts',
  '.venv',
  '.venv-docs',
  'node_modules',
  'dist',
  'build',
  'site',
  'test-results',
  'playwright-report',
  '__pycache__'
]);

function repoPath(...parts) {
  return path.join(repoRoot, ...parts);
}

function relative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join(path.posix.sep);
}

function fail(message) {
  errors.push(message);
}

function readText(relativePath) {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function assertFile(relativePath, requiredText = []) {
  const absolute = repoPath(relativePath);
  if (!fs.existsSync(absolute)) {
    fail(`Missing required file: ${relativePath}`);
    return '';
  }

  const text = fs.readFileSync(absolute, 'utf8');
  for (const phrase of requiredText) {
    if (!text.includes(phrase)) {
      fail(`${relativePath} must mention "${phrase}".`);
    }
  }
  return text;
}

function isIgnored(absolutePath) {
  return relative(absolutePath).split('/').some((part) => IGNORED_PARTS.has(part));
}

function listTextFiles(start) {
  const absolute = repoPath(start);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) {
    return TEXT_EXTENSIONS.has(path.extname(absolute)) ? [absolute] : [];
  }

  const files = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const child = path.join(absolute, entry.name);
    if (isIgnored(child)) continue;
    if (entry.isDirectory()) {
      files.push(...listTextFiles(relative(child)));
    } else if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(child))) {
      files.push(child);
    }
  }
  return files;
}

function assertRequiredGovernance() {
  assertFile('SECURITY.md', [
    'Reporting A Vulnerability',
    'In Scope',
    'Out Of Scope',
    'Security Boundaries'
  ]);
  assertFile('SUPPORT.md', [
    'Supported Surfaces',
    'Best-Effort Surfaces',
    'Lab-Only Surfaces',
    'Roadmap Surfaces',
    'This project does not provide a promised SLA'
  ]);
  assertFile('CONTRIBUTING.md', [
    'npm run ci',
    'Review Expectations',
    'Public-readiness changes'
  ]);
  assertFile('CODEOWNERS', [
    '@asadarafat'
  ]);

  for (const template of [
    '.github/ISSUE_TEMPLATE/bug_report.yml',
    '.github/ISSUE_TEMPLATE/docs_issue.yml',
    '.github/ISSUE_TEMPLATE/feature_request.yml',
    '.github/ISSUE_TEMPLATE/integration_issue.yml',
    '.github/ISSUE_TEMPLATE/package_release_feedback.yml',
    '.github/ISSUE_TEMPLATE/performance_regression.yml'
  ]) {
    assertFile(template);
  }
}

function assertArchitectureAndThreatModelDocs() {
  assertFile('packages/topoviewer/content/pages/evaluate/architecture.md', [
    'Runtime Flow',
    'Component Boundaries',
    'Public And Internal Module Boundary',
    'Data Flow By Surface',
    'Failure Boundaries'
  ]);
  assertFile('packages/topoviewer/content/pages/evaluate/threat-model.md', [
    'Input Threats And Controls',
    'Trust Boundaries',
    'Abuse Cases',
    'Evidence Map',
    'Grafana mounted files'
  ]);
  assertFile('packages/topoviewer/content/pages/maintainers/design-review-checklist.md', [
    'Public Surface Classification',
    'Compatibility Review',
    'Security Review',
    'Runtime Review',
    'Documentation Review'
  ]);
  assertFile('packages/topoviewer/content/pages/evaluate/build-or-adopt.md', [
    'What You Would Need To Build Internally',
    'Where TopoViewer Has Leverage',
    'When Not To Use TopoViewer',
    'Adoption Test'
  ]);
}

function assertPerformanceReliabilityAccessibilityDocs() {
  assertFile('packages/topoviewer/content/pages/evaluate/performance-reliability-accessibility.md', [
    'Performance Tiers',
    'Budgets',
    'Benchmark Scenarios',
    'Reliability Contract',
    'Accessibility Posture',
    'Data And Privacy'
  ]);
}

function assertHardeningDrillEvidence() {
  assertFile('openspec/changes/harden-public-adoption-readiness/evidence/early-adopter-drills.md', [
    'Fresh Checkout General User',
    'React Embedding User',
    'MkDocs/Zensical Docs Embedding User',
    'Grafana Mounted Bundle User',
    'Remaining Source-Knowledge Leaks'
  ]);
  assertFile('openspec/changes/harden-public-adoption-readiness/evidence/support-burden-simulation.md', [
    'first issues early adopters are likely to open',
    'Top remaining support reducers'
  ]);
  assertFile('openspec/changes/harden-public-adoption-readiness/evidence/docs-contradiction-report.md', [
    'Checked Surfaces',
    'Current Contradiction Findings',
    'Remaining Drift Risks'
  ]);
  assertFile('openspec/changes/harden-public-adoption-readiness/evidence/performance-budget-evidence.md', [
    'Public budget source',
    'Current smoke commands',
    'Open performance/readiness gaps'
  ]);
  assertFile('openspec/changes/harden-public-adoption-readiness/evidence/pre-release-red-team-checklist.md', [
    'Install And Package',
    'Docs And Embeds',
    'Harness Authoring',
    'Grafana',
    'Hostile Content',
    'Release Decision'
  ]);
}

function assertSecurityAutomation() {
  assertFile('.github/dependabot.yml', [
    'package-ecosystem: npm',
    'package-ecosystem: gomod',
    'package-ecosystem: github-actions',
    'package-ecosystem: docker',
    'target-branch: development',
    'reviewers:',
    'assignees:',
    'prefix: chore',
    'include: scope'
  ]);
  assertFile('.github/workflows/codeql.yml', [
    'github/codeql-action/init',
    'javascript-typescript',
    '- go'
  ]);
  assertFile('.github/workflows/security.yml', [
    'npm run dependency:advisories',
    'npm run go:vulncheck',
    'npm run security:health-report',
    'google/osv-scanner-action/.github/workflows/osv-scanner-reusable.yml',
    '--recursive',
    '--skip-git',
    'fetch-depth: 0',
    'gitleaks',
    'trivy-action',
    'security-health-report',
    'actions/upload-artifact@v4',
    '.artifacts/security-health/security-health-report.md',
    'continue-on-error: ${{ github.event_name == \'push\' || github.event_name == \'pull_request\' }}'
  ]);
  assertFile('scripts/write-security-health-report.mjs', [
    'Security Health Report',
    'Open Findings And Triage State',
    'Primary owner',
    'SECURITY_JOB_DEPENDENCY_AND_SECRET_CHECKS',
    'SECURITY_JOB_CONTAINER_IMAGE_CHECKS',
    'SECURITY_JOB_OSV_CROSS_ECOSYSTEM_SCAN'
  ]);
  assertFile('SECURITY.md', [
    'Automated Security Monitoring',
    'Dependabot checks npm, Go modules, GitHub Actions, and Docker/container image',
    'OSV cross-ecosystem scanning',
    'security-health-report',
    'Generated PRs target `development`',
    'Automation does not replace review',
    'Normal push and pull-request workflows must validate security'
  ]);
}

function assertPublicTextHasNoLocalLeaks() {
  const forbidden = [
    { value: '/Users/', reason: 'local home path' },
    { value: 'DG_25_6_v2', reason: 'private workspace path' },
    { value: 'github.com/asadarafat/TopoViewer', reason: 'wrong repository casing' },
    { value: 'asadarafat.github.io/TopoViewer', reason: 'wrong Pages route casing' },
    { value: '/TopoViewer/', reason: 'wrong public route casing' },
    { value: '.donotpush', reason: 'private workspace marker' },
    { value: '.artifacts/promo', reason: 'local promo artifact path' }
  ];

  const files = new Set(PUBLIC_TEXT_ROOTS.flatMap(listTextFiles));
  for (const filePath of [...files].sort()) {
    const file = relative(filePath);
    const text = fs.readFileSync(filePath, 'utf8');
    for (const { value, reason } of forbidden) {
      if (text.includes(value)) {
        fail(`${file} contains ${reason}: ${value}`);
      }
    }
  }
}

function assertLabWarnings() {
  for (const envFile of [
    'labs/grafana-topoviewer/.env',
    'labs/grafana-topoviewer/containerlab/.env'
  ]) {
    const text = assertFile(envFile);
    if (!text) continue;
    if (!/disposable local/i.test(text) || !/production/i.test(text)) {
      fail(`${envFile} must clearly state that checked-in lab defaults are disposable and not production guidance.`);
    }
    if (text.includes('GRAFANA_ADMIN_PASSWORD=admin') && !/Do not copy/i.test(text)) {
      fail(`${envFile} uses admin/admin and must include explicit copy-paste warning text.`);
    }
  }

  assertFile('labs/grafana-topoviewer/README.md', [
    'anonymous Admin',
    'unsigned',
    'plugin loading',
    'not production',
    'binds Grafana, Prometheus, and the telemetry injector to',
    'Containerlab publishes those',
    'Unsigned plugin loading is local lab/development only'
  ]);

  assertFile('packages/grafana-topoviewer-panel/README.md', [
    'anonymous Admin',
    'unsigned plugin loading',
    'development and validation scaffolding only'
  ]);

  assertFile('docs/topoviewer/evaluate/integration-roadmap.md', [
    'anonymous Admin',
    'unsigned plugin loading',
    'not production deployment guidance'
  ]);

  assertFile('labs/grafana-topoviewer/scripts/lib/lab-warning.sh', [
    'anonymous Admin',
    'disables the login form',
    'unsigned TopoViewer plugin',
    'Do not use this lab on a shared network'
  ]);

  assertFile('labs/grafana-topoviewer/scripts/up.sh', [
    'print_topoviewer_grafana_lab_warning',
    'Docker Compose binds Grafana'
  ]);
  assertFile('labs/grafana-topoviewer/containerlab/scripts/up.sh', [
    'print_topoviewer_grafana_lab_warning',
    'Containerlab publishes Grafana'
  ]);

  const compose = assertFile('labs/grafana-topoviewer/docker-compose.yml');
  for (const binding of [
    '127.0.0.1:${TELEMETRY_INJECTOR_HTTP_PORT}:9108',
    '127.0.0.1:${PROMETHEUS_HTTP_PORT}:9090',
    '127.0.0.1:${GRAFANA_HTTP_PORT}:3000'
  ]) {
    if (!compose.includes(binding)) {
      fail(`labs/grafana-topoviewer/docker-compose.yml must bind ${binding} for localhost-only lab exposure.`);
    }
  }
}

function assertNoLabCredentialsInProductionDocs() {
  const unsafeSnippetPatterns = [
    {
      pattern: /(^|\n)\s*GRAFANA_ADMIN_USER=admin\b/,
      reason: 'literal Grafana admin username from lab defaults'
    },
    {
      pattern: /(^|\n)\s*GRAFANA_ADMIN_PASSWORD=admin\b/,
      reason: 'literal Grafana admin password from lab defaults'
    },
    {
      pattern: /\badmin\/admin\b/,
      reason: 'admin/admin lab credential shorthand'
    },
    {
      pattern: /GF_SECURITY_ADMIN_PASSWORD:\s*['"]?admin['"]?/,
      reason: 'literal Grafana admin password in YAML'
    },
    {
      pattern: /GF_AUTH_ANONYMOUS_ENABLED:\s*['"]?true['"]?/,
      reason: 'anonymous Grafana Admin setting enabled in YAML'
    },
    {
      pattern: /GF_AUTH_DISABLE_LOGIN_FORM:\s*['"]?true['"]?/,
      reason: 'Grafana login form disabled in YAML'
    },
    {
      pattern: /GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS:/,
      reason: 'unsigned Grafana plugin loading setting'
    }
  ];

  const files = new Set(PRODUCTION_DOC_TEXT_ROOTS.flatMap(listTextFiles));
  for (const filePath of [...files].sort()) {
    const file = relative(filePath);
    const text = fs.readFileSync(filePath, 'utf8');
    for (const { pattern, reason } of unsafeSnippetPatterns) {
      if (pattern.test(text)) {
        fail(`${file} contains ${reason}; keep lab-only Grafana credentials/settings out of production-facing docs snippets.`);
      }
    }
  }
}

function assertPackageAndCiContracts() {
  const rootPackage = readJson('package.json');
  if (rootPackage.scripts?.ci?.includes('node@24') || rootPackage.scripts?.['ci:node24']) {
    fail('Root package must use plain npm run ci under Node 24, not ci:node24 or npx node@24 wrappers.');
  }
  if (!rootPackage.scripts?.['ci:public-readiness']) {
    fail('Root package is missing ci:public-readiness.');
  }
  for (const scriptName of [
    'dependency:advisories',
    'go:vulncheck',
    'check:object-reference',
    'examples:audit',
    'check:public-readiness',
    'test:hostile-content',
    'security:health-report',
    'install:check',
    'artifact:check',
    'artifact:check:docs',
    'artifact:check:package'
  ]) {
    if (!rootPackage.scripts?.[scriptName]) {
      fail(`Root package is missing ${scriptName}.`);
    }
  }

  const ci = assertFile('.github/workflows/ci.yml');
  if (!ci.includes('npm run ci:public-readiness')) {
    fail('.github/workflows/ci.yml must run npm run ci:public-readiness.');
  }
  const ciOrchestrator = assertFile('scripts/ci.mjs');
  for (const phrase of [
    'GITHUB_STEP_SUMMARY',
    'TopoViewer CI Failure',
    "['run', 'artifact:check:docs']",
    "['run', 'artifact:check:package']",
    "['run', 'install:check']",
    "['run', 'docs:lint']",
    "['run', 'check:object-reference']",
    "['run', 'examples:audit']",
    "['run', 'render:parity']",
    "['run', 'test:hostile-content']",
    "['run', 'pack:check']",
    "['run', 'grafana:panel:build']",
    "['run', 'go:vulncheck']",
    "['run', 'dependency:advisories']",
    "['run', 'security:health-report']",
    "['run', 'check:public-readiness']"
  ]) {
    if (!ciOrchestrator.includes(phrase)) {
      fail(`scripts/ci.mjs must include ${phrase}.`);
    }
  }
  const publicReadinessLane = ciOrchestrator.slice(ciOrchestrator.indexOf("'public-readiness': ["));
  if (publicReadinessLane.includes("['run', 'grafana:clab:")) {
    fail('scripts/ci.mjs must keep Grafana Containerlab checks out of ci:public-readiness.');
  }
  assertFile('packages/vscode-topoviewer/package.json', [
    'check-port-free.mjs',
    'Browser harness',
    '--strictPort'
  ]);
  assertFile('labs/grafana-topoviewer/scripts/check-port.mjs', [
    '[topoviewer]',
    'is already in use',
    '<free-port>'
  ]);
  assertFile('labs/grafana-topoviewer/containerlab/scripts/check-ports.mjs', [
    '[topoviewer]',
    'is already in use',
    '<free-port>'
  ]);
  assertFile('labs/grafana-topoviewer/containerlab/scripts/check-tools.mjs', [
    '[topoviewer]',
    'Docker is installed but not usable',
    'is required for the Containerlab Grafana lab'
  ]);

  const security = assertFile('.github/workflows/security.yml');
  if (!security.includes('npm run dependency:advisories')) {
    fail('.github/workflows/security.yml must run npm run dependency:advisories.');
  }
  if (!security.includes('npm run go:vulncheck')) {
    fail('.github/workflows/security.yml must run npm run go:vulncheck.');
  }
  if (security.includes('npm audit --audit-level=moderate')) {
    fail('.github/workflows/security.yml must use dependency:advisories for full audit triage instead of an untriaged raw full npm audit.');
  }

  const workflows = listTextFiles('.github/workflows');
  for (const filePath of workflows) {
    const text = fs.readFileSync(filePath, 'utf8');
    if (!/npm\s+publish/.test(text)) {
      continue;
    }

    const file = relative(filePath);
    if (!/workflow_dispatch:/.test(text)) {
      fail(`${file} contains npm publish outside an explicit manual workflow.`);
    }
    if (/(^|\n)\s+push:/.test(text) || /(^|\n)\s+pull_request:/.test(text)) {
      fail(`${file} must not publish from push or pull_request events.`);
    }
    for (const phrase of [
      'npm run ci',
      'npm run install:check',
      'npm run artifact:check:package',
      'npm run dependency:advisories',
      '--provenance',
      '--access public',
      '--tag',
      '--dry-run',
      'NPM_TOKEN'
    ]) {
      if (!text.includes(phrase)) {
        fail(`${file} publish workflow must include "${phrase}".`);
      }
    }
  }

  const topoviewerPackage = readJson('packages/topoviewer/package.json');
  if (topoviewerPackage.name !== 'topoviewer') {
    fail('packages/topoviewer/package.json must keep the public package name "topoviewer".');
  }
  if (topoviewerPackage.repository?.url && topoviewerPackage.repository.url.includes('TopoViewer')) {
    fail('packages/topoviewer repository URL uses wrong casing.');
  }
}

assertRequiredGovernance();
assertArchitectureAndThreatModelDocs();
assertPerformanceReliabilityAccessibilityDocs();
assertHardeningDrillEvidence();
assertSecurityAutomation();
assertPublicTextHasNoLocalLeaks();
assertLabWarnings();
assertNoLabCredentialsInProductionDocs();
assertPackageAndCiContracts();

if (errors.length) {
  console.error('Public readiness checks failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('public readiness checks passed');
