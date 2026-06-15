import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    outDir: 'dist/embed',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: 'src/embed.tsx',
      name: 'TopoViewerEmbed',
      fileName: 'topoviewer-embed',
      formats: ['iife']
    }
  }
});
