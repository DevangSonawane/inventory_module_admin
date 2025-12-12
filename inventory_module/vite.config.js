import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [react()],
    define: {
      'process.env': process.env
    },
    build: {
      outDir: 'dist',
      sourcemap: isProduction ? false : true,
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      } : {},
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            utils: ['axios', 'date-fns']
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
        }
      },
      chunkSizeWarningLimit: 1000
    },
    server: {
      port: 5173,
      host: true,
      strictPort: false
    },
    preview: {
      port: 4173,
      host: true
    }
  }
})




