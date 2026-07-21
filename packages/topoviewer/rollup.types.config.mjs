import { dts } from 'rollup-plugin-dts';

const entries = [
  ['src/index.ts', 'index'],
  ['src/authoring.ts', 'authoring'],
  ['src/export.ts', 'export'],
  ['src/integration.ts', 'integration'],
  ['src/security.ts', 'security'],
  ['src/embed-api.ts', 'embed']
];

function declarationBuild(input, name, extension) {
  return {
    external: (id) => !id.startsWith('.') && !id.startsWith('/'),
    input,
    output: {
      file: `dist/types/${name}.${extension}`,
      format: 'es'
    },
    plugins: [dts({ respectExternal: true })]
  };
}

export default entries.flatMap(([input, name]) => [
  declarationBuild(input, name, 'd.mts'),
  declarationBuild(input, name, 'd.cts')
]);
