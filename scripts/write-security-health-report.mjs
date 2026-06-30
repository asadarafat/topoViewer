import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const outputDir = path.join(repoRoot, '.artifacts/security-health');
const outputFile = path.join(outputDir, 'security-health-report.md');

function env(name, fallback = '') {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

function row(values) {
  return `| ${values.map((value) => String(value).replaceAll('\n', '<br>')).join(' | ')} |`;
}

const runAt = env('SECURITY_HEALTH_TIMESTAMP', new Date().toISOString());
const owner = env('SECURITY_HEALTH_OWNER', '@asadarafat');
const repository = env('GITHUB_REPOSITORY', 'local');
const ref = env('GITHUB_REF_NAME', env('GITHUB_REF', 'local'));
const sha = env('GITHUB_SHA', 'local');
const runId = env('GITHUB_RUN_ID', 'local');
const eventName = env('GITHUB_EVENT_NAME', 'local');

const jobResults = [
  ['Dependency, readiness, Go, and secret checks', env('SECURITY_JOB_DEPENDENCY_AND_SECRET_CHECKS', 'local-or-not-run')],
  ['Container image checks', env('SECURITY_JOB_CONTAINER_IMAGE_CHECKS', 'local-or-not-run')],
  ['OSV cross-ecosystem scan', env('SECURITY_JOB_OSV_CROSS_ECOSYSTEM_SCAN', 'local-or-not-run')]
];

const openFindings = [
  [
    'Grafana plugin SDK transitive npm advisories',
    'Accepted temporary experimental integration risk',
    owner,
    'Tracked in openspec/changes/harden-public-adoption-readiness/evidence/dependency-risk-ledger.md'
  ],
  [
    'Pinned third-party lab image CVE drift',
    'Visible on push and pull requests; blocking on scheduled/manual security sweeps',
    owner,
    'Tracked in openspec/changes/harden-public-adoption-readiness/evidence/backend-security-hardening.md'
  ],
  [
    'New untriaged npm, Go, OSV, secret, or image findings',
    'Blocking until fixed, documented as accepted risk, or deferred with owner',
    owner,
    'Security workflow and public-readiness guardrails'
  ]
];

const scannerCoverage = [
  ['Dependabot', 'npm, Go modules, GitHub Actions, Docker/container images', 'Weekly PRs to development'],
  ['npm advisory triage', 'Production audit plus documented full-audit exceptions', '`npm run dependency:advisories`'],
  ['Go vulnerability check', 'Grafana backend called vulnerabilities', '`npm run go:vulncheck`'],
  ['CodeQL', 'JavaScript/TypeScript and Go static analysis', `.github/workflows/codeql.yml`],
  ['Secret scan', 'Repository history and pushed commits', 'Gitleaks action'],
  ['Container scan', 'Pinned Grafana, Prometheus, and gNMIc lab images', 'Trivy action'],
  ['OSV', 'Cross-ecosystem dependency scan', 'OSV scanner reusable workflow']
];

const content = [
  '# Security Health Report',
  '',
  `Generated: ${runAt}`,
  '',
  row(['Field', 'Value']),
  row(['---', '---']),
  row(['Repository', repository]),
  row(['Ref', ref]),
  row(['SHA', sha]),
  row(['Run ID', runId]),
  row(['Event', eventName]),
  row(['Primary owner', owner]),
  '',
  '## Workflow Results',
  '',
  row(['Check', 'Result']),
  row(['---', '---']),
  ...jobResults.map(row),
  '',
  '## Open Findings And Triage State',
  '',
  row(['Finding', 'Current state', 'Owner', 'Evidence']),
  row(['---', '---', '---', '---']),
  ...openFindings.map(row),
  '',
  '## Scanner Coverage',
  '',
  row(['Signal', 'Coverage', 'Where']),
  row(['---', '---', '---']),
  ...scannerCoverage.map(row),
  '',
  '## Maintainer Action',
  '',
  '- If any workflow result is `failure`, review the corresponding job log before merging or releasing.',
  '- If a scheduled/manual run fails only because of upstream lab-image CVE drift, update the risk ledger or pin a remediated image.',
  '- If a dependency/security PR is generated, classify it as shipped runtime, developer tooling, lab-only, upstream false positive, accepted temporary risk, or blocked by incompatible upstream change.',
  '- Do not publish npm packages or Grafana artifacts from this report; publishing remains a separate manual release decision.',
  ''
].join('\n');

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, content);
console.log(`wrote ${path.relative(repoRoot, outputFile)}`);
