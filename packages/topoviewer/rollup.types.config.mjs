import { dts } from 'rollup-plugin-dts';
import path from 'node:path';

const entries = [
  ['dist/types-source/index.d.ts', 'index'],
  ['dist/types-source/authoring.d.ts', 'authoring'],
  ['dist/types-source/authoringAttention.d.ts', 'authoring-attention'],
  ['dist/types-source/export.d.ts', 'export'],
  ['dist/types-source/integration.d.ts', 'integration'],
  ['dist/types-source/security.d.ts', 'security'],
  ['dist/types-source/embed-api.d.ts', 'embed']
];

export function isExternalDeclarationId(id) {
  return (
    !id.startsWith('.') &&
    !id.startsWith('\0') &&
    !path.posix.isAbsolute(id) &&
    !path.win32.isAbsolute(id)
  );
}

function declarationBuild(input, name, extension) {
  return {
    external: isExternalDeclarationId,
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
