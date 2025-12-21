<template>
  <div class="account-settings-container">
    <div class="account-settings-form">
      <h2>Ustawienia konta</h2>
      
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <form @submit.prevent="handleUpdate">
        <div class="form-group">
          <label for="login">Nowy login:</label>
          <input
            id="login"
            v-model="login"
            type="text"
            placeholder="Wprowadź nowy login"
            class="form-input"
            :class="{ 'has-changes': login !== originalLogin }"
          />
          <div v-if="login && login !== originalLogin" class="change-indicator">
            Zmiana z: {{ originalLogin }}
          </div>
        </div>

        <div class="form-group">
          <label for="username">Nowa nazwa użytkownika:</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Wprowadź nową nazwę użytkownika"
            class="form-input"
            :class="{ 'has-changes': username !== originalUsername }"
          />
          <div v-if="username && username !== originalUsername" class="change-indicator">
            Zmiana z: {{ originalUsername }}
          </div>
        </div>

        <div class="form-group">
          <label for="password">Nowe hasło:</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Wprowadź nowe hasło (opcjonalnie)"
            class="form-input"
            :class="{ 'has-changes': password !== '' }"
          />
        </div>

        <div v-if="password" class="form-group">
          <label for="confirmPassword">Potwierdź nowe hasło:</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="Potwierdź nowe hasło"
            class="form-input"
          />
          <div v-if="passwordMismatch" class="error-message">
            Hasła nie są identyczne!
          </div>
        </div>

        <div class="form-group">
          <label for="currentPassword">Aktualne hasło (wymagane do zatwierdzenia zmian):</label>
          <input
            id="currentPassword"
            v-model="currentPassword"
            type="password"
            required
            placeholder="Wprowadź aktualne hasło"
            class="form-input"
          />
        </div>

        <button 
          type="submit" 
          :disabled="isLoading || passwordMismatch || !hasChanges || !currentPassword" 
          class="submit-button"
        >
          {{ isLoading ? 'Zapisywanie...' : 'Zapisz zmiany' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { authAPI } from '../services/api'

// zmienne do przechowywania danych formularza
const login = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const currentPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

// oryginalne wartości (do porównania)
const originalLogin = ref('')
const originalUsername = ref('')

// pobranie danych użytkownika z localStorage przy montowaniu komponentu
onMounted(() => {
  const userData = localStorage.getItem('user')
  if (userData) {
    try {
      const user = JSON.parse(userData)
      originalLogin.value = user.login || ''
      originalUsername.value = user.username || ''
      login.value = originalLogin.value
      username.value = originalUsername.value
    } catch (error) {
      console.error('Błąd podczas parsowania danych użytkownika:', error)
    }
  }
})

// sprawdzenie czy hasła są identyczne
const passwordMismatch = computed(() => {
  return password.value && confirmPassword.value && password.value !== confirmPassword.value
})

// sprawdzenie czy wprowadzono jakiekolwiek zmiany
const hasChanges = computed(() => {
  return (
    (login.value !== originalLogin.value) ||
    (username.value !== originalUsername.value) ||
    (password.value !== '')
  )
})

// aktualizacja danych konta
const handleUpdate = async () => {
  // resetowanie komunikatów
  errorMessage.value = ''
  successMessage.value = ''

  // walidacja hasła (jeśli zostało podane)
  if (password.value && password.value !== confirmPassword.value) {
    errorMessage.value = 'Hasła nie są identyczne!'
    return
  }

  // sprawdzenie czy wprowadzono jakiekolwiek zmiany
  if (!hasChanges.value) {
    errorMessage.value = 'Nie wprowadzono żadnych zmian.'
    return
  }

  // sprawdzenie czy podano hasło do potwierdzenia
  if (!currentPassword.value) {
    errorMessage.value = 'Aby zatwierdzić zmiany, musisz podać aktualne hasło.'
    return
  }

  isLoading.value = true

  try {
    // przygotowanie danych do wysłania (tylko zmienione pola)
    const updateData = {
      currentPassword: currentPassword.value
    }

    if (login.value !== originalLogin.value) {
      updateData.login = login.value
    }

    if (username.value !== originalUsername.value) {
      updateData.username = username.value
    }

    if (password.value) {
      updateData.password = password.value
    }

    // wysłanie żądania aktualizacji
    const response = await authAPI.updateAccount(updateData)
    
    successMessage.value = response.data.message || 'Dane konta zostały zaktualizowane pomyślnie!'
    
    // aktualizacja danych w localStorage
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user))
      originalLogin.value = response.data.user.login || ''
      originalUsername.value = response.data.user.username || ''
      window.dispatchEvent(new Event('userUpdate'))
    }

    // wyczyszczenie pól hasła
    password.value = ''
    confirmPassword.value = ''
    currentPassword.value = ''

    // timeout przed wyczyszczeniem komunikatu sukcesu
    setTimeout(() => {
      successMessage.value = ''
    }, 5000)
  } catch (error) {
    errorMessage.value = error.message || 'Wystąpił błąd podczas aktualizacji danych konta.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.account-settings-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100%;
  padding: 2rem;
}

.account-settings-form {
  background-color: var(--bg-color);
  border: 2px solid var(--border-color-dimmed);
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  font-family: "JetBrains Mono";
  color: var(--font-color);
  transition: border-color 0.3s ease;
}

.account-settings-form:hover {
  border-color: var(--border-color);
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
  font-size: 0.9rem;
}

.success-message {
  background-color: rgba(40, 167, 69, 0.2);
  border: 1px solid var(--active-item);
  color: var(--active-item);
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.9rem;
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
  background-color: var(--form-input-bg-color);
  border: 2px solid var(--border-color-dimmed);
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

.form-input.has-changes {
  border-color: var(--active-item);
}

.form-input::placeholder {
  color: var(--form-input-placeholder);
}

.change-indicator {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--active-item);
  font-style: italic;
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
</style>

