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
    // Tối ưu build size - giảm chunk mạnh mẽ
    rollupOptions: {
      output: {
        // Chỉ giữ 1 chunk chính
        manualChunks: undefined,
        // Đặt tên file đơn giản
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    // Tăng chunk size limit để ít chunk hơn
    chunkSizeWarningLimit: 2000,
    // Minify - sử dụng esbuild
    minify: 'esbuild',
    // Tắt source maps
    sourcemap: false,
    // Tối ưu hóa thêm
    target: 'es2015',
    cssCodeSplit: false, // Tắt CSS splitting để ít file hơn
    assetsInlineLimit: 16384, // Tăng inline limit để ít file hơn
    // Tắt chunk splitting
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});
