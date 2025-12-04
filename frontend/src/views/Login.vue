<template>
  <div class="login-container">
    <div class="login-form">
      <h2>Logowanie</h2>
      
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="login">Login:</label>
          <input
            id="login"
            v-model="login"
            type="text"
            required
            placeholder="Wprowadź login"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="password">Hasło:</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Wprowadź hasło"
            class="form-input"
          />
        </div>

        <button type="submit" :disabled="isLoading || !isFormValid" class="submit-button">
          {{ isLoading ? 'Logowanie...' : 'Zaloguj się' }}
        </button>
      </form>

      <div class="register-link">
        <span class="register-text">Nie masz konta? </span>
        <router-link to="/register" class="link">Zarejestruj się</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '../services/api'

// zmienne do przechowywania danych formularza
const login = ref('')
const password = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

const router = useRouter()

// sprawdzenie, czy formularz jest wypełniony
const isFormValid = computed(() => {
  return login.value.trim() !== '' && password.value.trim() !== ''
})

// logowanie
const handleLogin = async () => {
  
  // resetowanie komunikatow
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    // wysłanie post do api/auth/login z danymi
    const response = await authAPI.login({
      login: login.value,
      password: password.value
    })
    successMessage.value = response.data.message || 'Zalogowano pomyślnie!'
    
    // zapis danych do localStorage
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user))
      window.dispatchEvent(new Event('userLogin'))
    }
    
    // timeout przed przekierowaniem (do wyświetlenia komunikatu)
    setTimeout(() => {
      router.push('/')
    }, 1000)
  } catch (error) {
    errorMessage.value = error.message || 'Wystąpił błąd podczas logowania.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  padding: 2rem;
}

.login-form {
  background-color: var(--bg-color);
  border: 2px solid rgba(255, 255, 255, 0.251);
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  font-family: "JetBrains Mono";
  color: var(--font-color);
  transition: border-color 0.3s ease;
}

.login-form:hover {
  border-color: white;
}

h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  text-align: center;
  color: var(--font-color);
  font-size: 1.5rem;
}

.error-message {
  background-color: rgba(220, 53, 69, 0.2);
  border: 1px solid red;
  color: red;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.success-message {
  background-color: rgba(40, 167, 69, 0.2);
  border: 1px solid var(--active-item);
  color: var(--active-item);
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--font-color);
  font-size: 0.9rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  background-color: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.251);
  color: var(--font-color);
  font-family: "JetBrains Mono";
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--active-item);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.submit-button {
  width: 100%;
  padding: 0.75rem;
  background-color: transparent;
  border: 2px solid var(--active-item);
  color: var(--active-item);
  font-family: "JetBrains Mono";
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
}

.submit-button:hover:not(:disabled) {
  background-color: var(--active-item);
  color: var(--bg-color);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-text {
  cursor: default;
}

.register-link {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.link {
  color: var(--active-item);
  text-decoration: none;
  border: 2px solid transparent;
  padding: 2px 4px;
  transition: border-color 0.3s ease;
}

.link:hover {
  border-color: var(--active-item);
}
</style>

