import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Settings from '../views/Settings.vue'
import gamesRoutes from '@/games/games-router.js'

const requireAuth = (to, from, next) => {
  const userData = localStorage.getItem('user')

  // przekierowanie użytkownika do logowania, jeśli nie jest zalogowany
  if (!userData) {
    next({
      path: '/login'
    })
  } else {
    next()
  }
}

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    beforeEnter: requireAuth,
  },
  {
    path: "/games/:gameKey/rooms",
    name: "GameRooms",
    component: () => import("@/games/rooms/GameRoomsView.vue"),
  },

  ...gamesRoutes,
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
