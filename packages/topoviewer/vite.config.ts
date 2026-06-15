import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/index.ts',
      name: 'TopoViewer',
      fileName: 'topoviewer',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom', 'react-dom/client', '@xyflow/react'],
      output: {
        globals: {
          react: 'React',
          'react/jsx-runtime': 'React',
          'react/jsx-dev-runtime': 'React',
          'react-dom': 'ReactDOM',
          'react-dom/client': 'ReactDOMClient',
          '@xyflow/react': 'XYFlowReact'
        }
      }
    }
  }
});
