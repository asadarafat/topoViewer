import { dts } from 'rollup-plugin-dts';

const entries = [
  ['dist/types-source/index.d.ts', 'index'],
  ['dist/types-source/authoring.d.ts', 'authoring'],
  ['dist/types-source/export.d.ts', 'export'],
  ['dist/types-source/integration.d.ts', 'integration'],
  ['dist/types-source/security.d.ts', 'security'],
  ['dist/types-source/embed-api.d.ts', 'embed']
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
