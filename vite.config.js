import { defineConfig } from 'vite';

// Simple JS config to avoid ts-node/esbuild when launching Vite
export default defineConfig(({ command }) => ({
  root: '.',
  // Use root path during dev; GitHub Pages path for production build
  base: command === 'serve' ? '/' : '/royal-game-over/',
  server: {
    host: true,
    port: 5173
  }
}));
