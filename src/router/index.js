import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import DocentDashboard from '../views/DocentDashboard.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/dashboard', name: 'DocentDashboard', component: DocentDashboard },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router