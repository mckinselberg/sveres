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