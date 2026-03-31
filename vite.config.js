import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/flyffulator-chinese/',
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      }
    }
  },
  optimizeDeps: {
    noDiscovery: true
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      cache: false,
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          charts: ['chart.js', 'react-chartjs-2', 'chartjs-plugin-annotation', 'chartjs-plugin-datalabels'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector', 'i18next-http-backend']
        }
      }
    },
    minify: 'esbuild',
    target: 'esnext',
    reportCompressedSize: false,
    emptyOutDir: true
  }
})
