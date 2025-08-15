import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173, // Cố định port
    strictPort: true,
    open: true,
  },
  build: {
    // Tối ưu build size
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          charts: ['@nivo/core', '@nivo/bar', '@nivo/pie', '@nivo/geo'],
          utils: ['axios', 'date-fns', 'formik', 'yup']
        }
      }
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Minify - sử dụng esbuild (default, không cần cài thêm)
    minify: 'esbuild',
    // Source maps cho production
    sourcemap: false,
    // Tối ưu hóa thêm
    target: 'es2015',
    cssCodeSplit: true,
    assetsInlineLimit: 4096
  }
});
