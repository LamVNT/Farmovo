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
    // Tối ưu build size - giảm chunk
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          charts: ['@nivo/core', '@nivo/bar', '@nivo/pie', '@nivo/geo'],
          utils: ['axios', 'date-fns', 'formik', 'yup']
        },
        // Giảm số lượng chunk
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Tăng chunk size limit để ít chunk hơn
    chunkSizeWarningLimit: 1000,
    // Minify - sử dụng esbuild
    minify: 'esbuild',
    // Tắt source maps
    sourcemap: false,
    // Tối ưu hóa thêm
    target: 'es2015',
    cssCodeSplit: false, // Tắt CSS splitting để ít file hơn
    assetsInlineLimit: 8192, // Tăng inline limit
    // Giảm chunk
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          charts: ['@nivo/core', '@nivo/bar', '@nivo/pie', '@nivo/geo'],
          utils: ['axios', 'date-fns', 'formik', 'yup']
        }
      }
    }
  }
});
