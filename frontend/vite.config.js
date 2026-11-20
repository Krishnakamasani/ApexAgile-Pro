import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || `http://127.0.0.1:${process.env.PORT || 8001}`,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../backend/static',
    emptyOutDir: true,
    chunkSizeWarningLimit: 600 // Lazy-loaded Three.js scene is 532 KB raw (133 KB gzipped).
  }
});
