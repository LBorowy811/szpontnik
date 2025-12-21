<template>
  <div class="usermenutop">
    <div class="nav">
      <div class="left" @click="goToHome">
        <img src="../assets/usermenutop/makajler32x32.png" alt="Logo" class="logo" />
        <span>Szpontnik</span>
      </div>
      <div class="middle">
        gry online, zagraj z innymi osobami
      </div>
      <div v-if="isLoggedIn" class="user-info">
        <span class="welcome-text">Witaj, {{ user?.username }}!</span>
        <button @click="handleLogout" class="logout-button">Wyloguj się</button>
      </div>
      <button v-else @click="goToLogin">Zaloguj się</button>
    </div>
  </div>
</template>

<script setup>
import { authAPI } from '../services/api.js'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import socket from '../services/socket.js'

const router = useRouter()

// przechowywanie stanu zalogowania
const isLoggedIn = ref(false)
const user = ref(null)

const checkLoginStatus = () => {
  try {
    // pobranie danych użytkownika z localStorage
    const userData = localStorage.getItem('user')

    if (userData) {
      // jeżeli istnieje, stan zalogowania na true
      user.value = JSON.parse(userData)
      isLoggedIn.value = true
    } else {
      // jeżeli nie istnieje, stan zalogowania na false
      user.value = null
      isLoggedIn.value = false
    }
  } catch (error) {
    console.error('Błąd podczas sprawdzania stanu zalogowania:', error)
    user.value = null
    isLoggedIn.value = false
  }
}

// wylogowanie
const handleLogout = async () => {
  try {
    // wywołanie endpointu wylogowania
    await authAPI.logout()
  } catch (error) {
    console.error('Błąd podczas wylogowywania:', error)
  }

  if (socket && socket.connected) {
    socket.disconnect()
  }

  // usunięcie danych użytkownika z localStorage
  localStorage.removeItem('user')
  user.value = null
  isLoggedIn.value = false
  router.push('/')
  window.location.reload()
}

// przejście do strony logowania
const goToLogin = () => {
  router.push('/login')
}

// przejście do strony głównej
const goToHome = () => {
  router.push('/')
}

// custom event wywoływany po zalogowaniu
window.addEventListener('userLogin', checkLoginStatus)
window.addEventListener('storage', checkLoginStatus)

// sprawdzenie stanu zalogowania
onMounted(() => {
  checkLoginStatus()
})
</script>

<style scoped>
.usermenutop {
  font-family: "JetBrains Mono";
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  height: 50px;
  padding: 0 1rem;
  margin: 10px;
  background-color: var(--bg-color);
  border: 2px solid transparent;
  transition: border-color 0.3s ease;
  display: flex;
  align-items: center;
  font-size: 1.2rem;
}

.usermenutop:hover {
  border-color: white;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 0;
  color: var(--font-color);
}

.left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 2px solid transparent;
  transition: border-color 0.3s ease, color 0.3s ease;
  cursor: pointer;
  padding: 0 8px;
}

.left:hover {
  border-color: var(--active-item);
  color: var(--active-item);
}

.logo {
  width: 32px;
  height: 32px;
}

.middle {
  flex: 1;
  text-align: center;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
  font-size: 1.2rem;
}

button {
  background: none;
  border: 2px solid transparent;
  padding: 4px;
  font-family: inherit;
  font-size: inherit;
  color: var(--font-color);
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
}

button:hover {
  border-color: var(--active-item);
  color: var(--active-item);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.welcome-text {
  color: var(--font-color);
  font-size: inherit;
}

.logout-button {
  background: none;
  border: 2px solid transparent;
  padding: 4px;
  font-family: inherit;
  font-size: inherit;
  color: var(--font-color);
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
}

.logout-button:hover {
  border-color: red;
  color: red;
}
</style>
