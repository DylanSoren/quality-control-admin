import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // 配置代理，解决开发环境跨域问题
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 你的 Spring Boot 后端地址
        changeOrigin: true, // 必须设置为 true
        // 注意：这里不需要重写路径，因为后端的 @RequestMapping 也包含了 /api
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})