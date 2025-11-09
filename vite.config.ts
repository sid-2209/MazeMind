import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, './src/config'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@core': path.resolve(__dirname, './src/core'),
      '@maze': path.resolve(__dirname, './src/maze'),
      '@agent': path.resolve(__dirname, './src/agent'),
      '@rendering': path.resolve(__dirname, './src/rendering'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  
  server: {
    port: 3000,
    open: true,
    host: true,
    // Proxy Ollama API requests to localhost:11434 to avoid CORS issues
    proxy: {
      '/api/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Ollama proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying Ollama request:', req.method, req.url);
          });
        },
      },
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'pixi': ['pixi.js'],
          'gsap': ['gsap'],
        },
      },
    },
  },
  
  optimizeDeps: {
    include: ['pixi.js', 'gsap', 'seedrandom'],
  },
  
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
