import { defineConfig } from 'vite';

// Simple JS config to avoid ts-node/esbuild when launching Vite
export default defineConfig({
  root: '.',
  base: '/royal-game-over/',
  server: {
    host: true,
    port: 5173
  }
});
