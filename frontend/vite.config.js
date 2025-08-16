import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    open: true,
  },
  build: {
    outDir: 'dist',
    // Đơn giản hóa build config
    rollupOptions: {
      input: 'index.html' // Đảm bảo entry point đúng
    },
    // Tắt source maps
    sourcemap: false,
    // Minify
    minify: 'esbuild'
  }
});
