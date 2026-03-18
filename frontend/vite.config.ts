import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    target: 'es2018',
    minify: 'esbuild', // esbuild é 20x mais rápido que terser e gera código menor
    cssMinify: true,
    reportCompressedSize: false, // acelera o build
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Code splitting — dividir em chunks menores para carregar só o necessário
        manualChunks: {
          // Separar React do resto
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Separar bibliotecas de UI
          'ui-vendor': ['lucide-react', 'recharts'],
          // Separar axios separado
          'http': ['axios'],
        },
        // Nomes de arquivo com hash para cache
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  server: {
    host: true,
    allowedHosts: ['os4u.com.br', 'www.os4u.com.br'],
  },
  preview: {
    host: true,
    allowedHosts: ['os4u.com.br', 'www.os4u.com.br'],
  },
})
