import { createApp } from 'vue'

// 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 引入路由实例
import router from './router'

// 引入根组件和全局样式
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)

// 使用 Element Plus
app.use(ElementPlus)

// 挂载路由实例
app.use(router)

// 挂载应用
app.mount('#app')