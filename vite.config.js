import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',
  plugins: [
    react({
      jsxRuntime: 'automatic',
      include: '**/*.jsx',
    }),
  ],
  // Ensure assets are emitted with content hashes and a manifest is generated for cache busting
  build: {
    manifest: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Filenames already include content hashes by default in Vite
      }
    }
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // additionalData: `@import "./src/styles/_variables.scss";` // Example for global variables
      },
    },
  },
});