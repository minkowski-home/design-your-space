// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      // Proxying /api requests to the FastAPI backend
      '/api': {
        target: 'http://127.0.0.1:8000', // Your FastAPI server address
        changeOrigin: true,
      },
    },
  },
});