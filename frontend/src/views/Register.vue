<template>
  <div class="auth-page">
    <div class="card">
      <h2>Zarejestruj się</h2>
      <form @submit.prevent="onSubmit">
        <label>
          Nazwa użytkownika
          <input v-model="username" type="text" required />
        </label>
        <label>
          Email
          <input v-model="email" type="email" required />
        </label>
        <label>
          Hasło
          <input v-model="password" type="password" required />
        </label>
        <div class="actions">
          <button type="submit">Zarejestruj</button>
          <router-link to="/login" class="link">Masz konto? Zaloguj się</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const username = ref('')
const email = ref('')
const password = ref('')
const router = useRouter()

function onSubmit() {
  console.log('Register', username.value, email.value)
  router.push('/login')
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 80px);
}
.card {
  background: var(--bg-color);
  border: 2px solid rgba(255,255,255,0.12);
  padding: 2rem;
  width: 360px;
  border-radius: 8px;
  color: var(--font-color);
}
label {
  display: block;
  margin-bottom: 0.75rem;
}
input {
  width: 100%;
  padding: 8px;
  margin-top: 6px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  color: inherit;
}
.actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 1rem;
}
button[type="submit"] {
  padding: 8px 12px;
  cursor: pointer;
}
.link {
  margin-left: auto;
  color: var(--active-item);
  text-decoration: none;
}
</style>
