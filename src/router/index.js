import { createRouter, createWebHistory } from 'vue-router'
import DocentDashboard from '../views/DocentDashboard.vue'
import StudentenDetails from '../views/StudentenDetails.vue'


const routes = [
  { path: '/dashboard', name: 'DocentDashboard', component: DocentDashboard },
  { 
    path: '/student-details/:studentId', 
    name: 'StudentDetails', 
    component: StudentenDetails,
    props: true
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router