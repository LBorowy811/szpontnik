import { createRouter, createWebHistory } from 'vue-router'
import CheckersView from '@/views/CheckersView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/game/checkers', name: 'checkers', component: () => import('@/views/CheckersView.vue') },
    { path: '/game/chess', name: 'chess', component: () => import('@/views/ChessView.vue') }

  ]
})

export default router
