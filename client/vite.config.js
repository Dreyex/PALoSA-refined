import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
  base: "./", 
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
  ],
  server: {
    proxy: {
      // string shorthand: http://localhost:5173/api -> http://localhost:3001/api
      '/api': {
        target: 'http://localhost:3001', // Your express server's address
        changeOrigin: true,
      }
    }
  }
})
