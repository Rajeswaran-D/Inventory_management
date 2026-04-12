import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react')) {
            return 'vendor';
          }
          if (id.includes('lucide-react') || id.includes('react-hot-toast') || id.includes('framer-motion')) {
            return 'ui';
          }
        }
      }
    },
    // Optimize for bundling
    cssCodeSplit: true,
    reportCompressedSize: false,
  },
  server: {
    port: 5173,
    host: 'localhost',
    strictPort: false,
  },
})
