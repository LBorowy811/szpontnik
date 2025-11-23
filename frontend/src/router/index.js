import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Chinczyk from '../views/Chinczyk.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
   {
    path: '/chinczyk',
    name: 'Chinczyk',
    component: Chinczyk,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

