import { createApp } from 'vue'

// 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 引入根组件和全局样式
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)

// 使用 Element Plus
app.use(ElementPlus)

// 挂载应用
app.mount('#app')