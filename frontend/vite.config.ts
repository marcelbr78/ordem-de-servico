import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['ios >= 9', 'safari >= 9', 'ie 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'], // Ensure async/await works
      renderLegacyChunks: true,
      polyfills: true,
    }),
  ],
  build: {
    target: 'es2015',
    minify: 'terser',
  },
  server: {
    host: true,
  },
})
