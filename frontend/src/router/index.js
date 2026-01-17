import { createRouter, createWebHistory } from 'vue-router'
import api from '../services/api.js'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Settings from '../views/Settings.vue'
import Ranked from '../views/Ranked.vue'
import Tournaments from '../views/Tournaments.vue'
import AccountSettings from '../views/AccountSettings.vue'
import gamesRoutes from '@/games/games-router.js'

// weryfikacja tokenu przez endpoint /auth/verify (prawidłowość tokenu i jego aktualność)
const requireAuth = async (to, from, next) => {
  try {
    const response = await api.get('/auth/verify');
    if (response.data.valid) {
      // prawidlowy token, aktualizacja localStorage i kontynuacja nawigacji
      localStorage.setItem('user', JSON.stringify(response.data.user));
      next();
    } else {
      // nieprawidlowy token, usun localStorage i przekieruj do logowania
      localStorage.removeItem('user');
      next('/login');
    }
  } catch (error) {
    // błąd weryfikacji (401/403) - token wygasl lub jest nieprawidlowy
    // interceptor axios w api.js zajmuje sie usuwaniem localStorage i przekierowaniem
    // ale jeszcze jeden raz na pewno nie zaszkodzi
    console.error('Błąd podczas weryfikacji tokenu:', error);
    localStorage.removeItem('user');
    next('/login');
  }
};

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
    path:'/ranked',
    name: 'Ranked',
    component: Ranked,
    beforeEnter: requireAuth,
  },
  {
    path:'/tournaments',
    name: 'Tournaments',
    component: Tournaments,
    beforeEnter: requireAuth,
  },
  {
    path: '/account-settings',
    name: 'AccountSettings',
    component: AccountSettings,
    beforeEnter: requireAuth,
  },
  {
    path: '/games/:gameKey/rooms',
    name: 'GameRooms',
    component: () => import('@/games/rooms/GameRoomsView.vue'),
  },

  // trasy do gier z osobnego routera
  ...gamesRoutes,
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
