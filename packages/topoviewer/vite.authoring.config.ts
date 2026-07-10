import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/authoring.ts',
      name: 'TopoViewerAuthoring',
      fileName: 'authoring',
      formats: ['es', 'umd']
    }
  }
});

