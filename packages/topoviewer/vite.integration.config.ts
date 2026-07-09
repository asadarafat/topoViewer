import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/integration.ts',
      name: 'TopoViewerIntegration',
      fileName: 'integration',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      output: {
        globals: {
          react: 'React',
          'react/jsx-runtime': 'React',
          'react/jsx-dev-runtime': 'React'
        }
      }
    }
  }
});
