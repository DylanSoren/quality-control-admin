import { createRouter, createWebHistory } from 'vue-router'

// 导入我们即将创建/重命名的视图组件
import QueryView from '../views/QueryView.vue'
import AdminView from '../views/AdminView.vue'

// 定义路由规则
const routes = [
    {
        path: '/',
        name: 'query',
        component: QueryView
    },
    {
        path: '/admin',
        name: 'admin',
        component: AdminView
    }
]

// 创建路由实例
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

// 导出路由实例
export default router