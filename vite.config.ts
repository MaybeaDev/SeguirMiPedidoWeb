import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer';
export default defineConfig({
  plugins: [react(), visualizer()],
  server: {
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/firestore'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // opcional: sube el límite si ya sabés que todo está bien
  },
});
