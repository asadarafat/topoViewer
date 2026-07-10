/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Keep modules acyclic so package internals stay modular and easy to extract.',
      from: {},
      to: { circular: true }
    },
    {
      name: 'no-adapter-imports-core-source',
      severity: 'error',
      comment: 'Application adapters must consume the topoviewer package API instead of sibling source files.',
      from: { path: '^packages/(topoviewer-studio|vscode-topoviewer|grafana-topoviewer-panel)/' },
      to: { path: '^packages/topoviewer/src/' }
    },
    {
      name: 'no-core-imports-adapter-source',
      severity: 'error',
      comment: 'The reusable topoviewer package must not depend on application adapter source.',
      from: { path: '^packages/topoviewer/src/' },
      to: { path: '^packages/(topoviewer-studio|vscode-topoviewer|grafana-topoviewer-panel)/' }
    },
    {
      name: 'no-studio-imports-adapter-source',
      severity: 'error',
      comment: 'Studio owns shared authoring behavior and must not depend on host adapter source.',
      from: { path: '^packages/topoviewer-studio/' },
      to: { path: '^packages/(vscode-topoviewer|grafana-topoviewer-panel)/' }
    },
    {
      name: 'no-deep-parent-imports',
      severity: 'warn',
      comment: 'Deep upward imports are a sign that ownership boundaries need cleanup.',
      from: { path: '^packages/' },
      to: { path: '^packages/', pathNot: '^packages/[^/]+/', via: { path: '^\.\./\.\./\.\./' } }
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Orphans are often stale files; entrypoints, tests, fixtures, and scripts are allowed.',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)index\\.(ts|tsx|js|mjs)$',
          '(^|/)main\\.(ts|tsx)$',
          '(^|/)[^/]+\\.worker\\.ts$',
          '(^|/)vite-env\\.d\\.ts$',
          '(^|/)vite\\.[^/]+\\.ts$',
          '(^|/)playwright\\.config\\.(js|ts)$',
          '(^|/)tests?/',
          '(^|/)scripts?/',
          '(^|/)examples?/'
        ]
      },
      to: {}
    }
  ],
  options: {
    tsPreCompilationDeps: true,
    doNotFollow: {
      path: '(^|/)(node_modules|dist|site|playwright-report|test-results|\\.artifacts)(/|$)'
    },
    exclude: {
      path: '(^|/)(node_modules|dist|site|playwright-report|test-results|\\.artifacts)(/|$)'
    },
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'],
      conditionNames: ['import', 'require', 'node', 'default'],
      exportsFields: ['exports'],
      mainFields: ['module', 'main', 'types']
    }
  }
};
