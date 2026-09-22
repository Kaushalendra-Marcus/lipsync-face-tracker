import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:5000',
      '/metadata': 'http://127.0.0.1:5000',
      '/video': 'http://127.0.0.1:5000',
      '/export': 'http://127.0.0.1:5000',
      '/download': 'http://127.0.0.1:5000',
    },
  },
  build: { outDir: 'dist', emptyOutDir: true },
});
