<template>
  <div class="sidebar-wrapper">
    <div class="sidebar">
      <div class="menu">
        <router-link to="/" class="menu-item">
          <img src="../assets/sidebar/console.png" alt="Casual" class="icon" />
          <span>Casual</span>
        </router-link>
        <router-link to="/ranked" class="menu-item">
          <img src="../assets/sidebar/ranking.png" alt="Rankingowa" class="icon" />
          <span>Rankingowa</span>
        </router-link>
        <router-link to="/tournaments" class="menu-item">
          <img src="../assets/sidebar/trophy.png" alt="Turnieje" class="icon" />
          <span>Turnieje</span>
        </router-link>
      </div>
      <div class="bottom">
        <div v-if="isLoggedIn" class="menu-item" @click="toggleChat">
          <img src="../assets/sidebar/chat.png" alt="Czat" class="icon">
          <span>Czat</span>
          <span v-if="unreadCount > 0" class="unread-badge-sidebar">{{ unreadCount }}</span>
        </div>
        <router-link to="/settings" class="menu-item">
          <img src="../assets/sidebar/setting.png" alt="Profil" class="icon" />
          <span>Profil</span>
        </router-link>
        <div class="menu-item" @click="toggleTheme">
          <img src="../assets/sidebar/theme.png" alt="Motyw" class="icon"/>
          <span>Motyw</span>
        </div>
      </div>
    </div>
    <Chat v-if="isLoggedIn" :isOpen="isChatOpen" @close="closeChat" @newMessage="handleNewMessage" @chatOpened="handleChatOpened" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../assets/theme'
import Chat from './Chat.vue'

const router = useRouter()
const { toggleTheme } = useTheme();

// stan czatu
const isLoggedIn = ref(false)
const isChatOpen = ref(false)
const unreadCount = ref(0)

// stan zalogowania
const checkLoginStatus = () => {
  const userData = localStorage.getItem('user')
  isLoggedIn.value = !!userData
  if (!userData) {
    isChatOpen.value = false
    unreadCount = 0
  }
}

// obsługa czatu
const toggleChat = () => {
  if (!isLoggedIn.value) {
    router.push('/login')
    return
  }
  isChatOpen.value = !isChatOpen.value
  if (isChatOpen.value) {
    unreadCount.value = 0
  }
}

const closeChat = () => { isChatOpen.value = false }
const handleNewMessage = () => { if (!isChatOpen.value) { unreadCount.value++} }
const handleChatOpened = () => { unreadCount.value = 0 }

onMounted(() => {
  checkLoginStatus()
  window.addEventListener('userLogin', checkLoginStatus)
  window.addEventListener('storage', checkLoginStatus)
})

onUnmounted(() => {
  window.removeEventListener('userLogin', checkLoginStatus);
  window.removeEventListener('storage', checkLoginStatus);
})
</script>

<style scoped>
.sidebar {
  font-family: "JetBrains Mono";
  position: fixed;
  top: 60px;
  left: 0;
  bottom: 0;
  width: 200px;
  padding: 0.5rem;
  margin: 10px;
  background-color: var(--bg-color);
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: border-color 0.3s ease;
}

.sidebar:hover {
  border-color: var(--border-color);
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bottom {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 6px 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
  font-size: 1.2rem;
  color: var(--font-color);
  position: relative;
}

/* zaznaczenie aktywnego elementu dla łatwiejszego rozróżnienia trybów */
.menu-item.router-link-exact-acitve,
.menu-item.router-link-active,
.menu-item:hover {
  border-color: var(--active-item);
  color: var(--active-item);
  background: var(--bg-color);
  text-decoration: none;
}

.menu-item.router-link-exact-active .icon,
.menu-item.router-link-active .icon,
.menu-item:hover .icon {
  filter: invert(62%) sepia(41%) saturate(749%) hue-rotate(96deg) brightness(92%) contrast(89%);
}

.icon {
  width: 32px;
  height: 32px;
  filter: var(--icon-filter);
}

.menu-item:hover .icon {
  filter: invert(62%) sepia(41%) saturate(749%) hue-rotate(96deg) brightness(92%) contrast(89%);
}

.unread-badge-sidebar {
  background-color: red;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 18px;
}
</style>