<template>
  <div v-if="isOpen" class="chat-overlay" @click.self="closeChat">
    <div class="chat-container">
      <header class="chat-header">
        <h3>Czat</h3>
        <div class="header-right">
          <div class="online-info">
            <span v-if="onlineCount > 0">{{ onlineCount }} online</span>
            <span v-else-if="isConnected" class="connecting">Łączenie...</span>
            <span v-else class="connecting">Rozłączono</span>
          </div>
          <button @click="closeChat" class="close-button">×</button>
        </div>
      </header>

      <main class="chat-messages" ref="messagesContainer">
        <div 
          v-for="msg in messages" 
          :key="msg.id + msg.timestamp"
          class="message"
          :class="{ 'own-message': msg.userId === currentUserId }"
        >
          <div class="message-header">
            <span class="username">{{ msg.username }}</span>
            <span class="timestamp">{{ msg.timestamp }}</span>
          </div>
          <div class="message-content">{{ msg.message }}</div>
        </div>
      </main>

      <footer class="chat-input-container">
        <input
          v-model="newMessage"
          @keyup.enter="sendMessage"
          placeholder="Napisz wiadomość..."
          class="chat-input"
          :disabled="!isConnected || !currentUserId"
        />
        <button 
          @click="sendMessage" 
          class="send-button"
          :disabled="!isConnected || !newMessage.trim() || !currentUserId"
        >
          Wyślij
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import socket from '../services/socket'

const props = defineProps({ isOpen: { type: Boolean, default: false } })
const emit = defineEmits(['close', 'newMessage', 'chatOpened'])

const messages = ref([])
const newMessage = ref('')
const isConnected = ref(false)
const onlineCount = ref(0)
const currentUserId = ref(null)
const messagesContainer = ref(null)

// Pobranie danych użytkownika z localStorage
const getUser = () => {
  try {
    const userData = localStorage.getItem('user')
    if (!userData) return null
    return JSON.parse(userData)
  } catch {
    return null
  }
}

// Wysyłanie wiadomości
const sendMessage = () => {
  if (!newMessage.value.trim() || !isConnected.value || !currentUserId.value) return

  const user = getUser()
  if (!user) return

  socket.emit('chat-message', {
    message: newMessage.value.trim()
  })

  newMessage.value = ''
}

// Scroll do dołu
const scrollToBottom = () => {
  nextTick(() => {
    messagesContainer.value?.scrollTo(0, messagesContainer.value.scrollHeight)
  })
}

// wygaszanie tokenów i ponowne łączenie
const handleSocketTokenExpired = () => {
  console.log('Token wygasł, ponowne łączenie po odświeżeniu')
  isConnected.value = false
}

const handleTokenRefreshed = () => {
  console.log('Token odświeżony, ponowne łączenie socketa')
  if (socket && !socket.connected) {
    socket.connect()
  }
}

// Scroll przy otwarciu czatu
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    scrollToBottom()
    emit('chatOpened')
  }
})

onMounted(() => {
  const user = getUser()
  if (!user) return
  currentUserId.value = user.id

  // sprawdzenie aktualnego stanu połączenia
  isConnected.value = socket.connected
  
  // próba połączenia jeśli nie jest połączony
  if (!socket.connected) {
    socket.connect()
  }

  socket.on('connect', () => { isConnected.value = true })
  socket.on('disconnect', () => { isConnected.value = false })

  socket.on('chat-message', (data) => {
    messages.value.push(data)
    scrollToBottom()
    if (!props.isOpen && data.userId !== currentUserId.value) {
      emit('newMessage', data)
    }
  })

  socket.on('online-count', (count) => {
    onlineCount.value = count
  })

  // listener dla tokenów
  window.addEventListener('socketTokenExpired', handleSocketTokenExpired)
  window.addEventListener('tokenRefreshed', handleTokenRefreshed)
})

onUnmounted(() => {
  socket.off('connect')
  socket.off('disconnect')
  socket.off('chat-message')
  socket.off('online-count')
  window.removeEventListener('socketTokenExpired', handleSocketTokenExpired)
  window.removeEventListener('tokenRefreshed', handleTokenRefreshed)
})

const closeChat = () => emit('close')
</script>

<style scoped>
.chat-overlay {
  position: fixed;
  bottom: 70px;
  right: 20px;
  width: 400px;
  height: 500px;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

.chat-container {
  width: 100%;
  height: 100%;
  background-color: var(--bg-color);
  border: 2px solid var(--active-item);
  display: flex;
  flex-direction: column;
  font-family: "JetBrains Mono";
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 2px solid var(--active-item);
  background-color: var(--bg-color);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.online-info {
  font-size: 0.85rem;
  color: var(--active-item);
}

.connecting {
  color: #888;
  font-size: 0.85rem;
}

.chat-header h3 {
  margin: 0;
  color: var(--font-color);
  font-size: 1.2rem;
}

.close-button {
  background: none;
  border: none;
  color: var(--font-color);
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
}

.close-button:hover {
  color: red;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  border: 1px solid transparent;
  border-radius: 4px;
}

.message.own-message {
  align-self: flex-end;
  background-color: rgba(255, 255, 255, 0.1);
  border-color: var(--active-item);
  max-width: 80%;
}

.message:not(.own-message) {
  align-self: flex-start;
  background-color: rgba(255, 255, 255, 0.05);
  max-width: 80%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: var(--font-color);
  opacity: 0.8;
  gap: 0.5rem;
}

.username {
  font-weight: bold;
  color: var(--active-item);
}

.timestamp {
  font-size: 0.75rem;
  opacity: 0.6;
}

.message-content {
  color: var(--font-color);
  word-wrap: break-word;
}

.chat-input-container {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 2px solid var(--active-item);
  background-color: var(--bg-color);
}

.chat-input {
  flex: 1;
  padding: 0.5rem;
  background-color: transparent;
  border: 2px solid var(--active-item);
  color: var(--font-color);
  font-family: inherit;
  font-size: 0.9rem;
}

.chat-input:focus {
  outline: none;
  border-color: var(--active-item);
}

.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-button {
  padding: 0.5rem 1rem;
  background-color: transparent;
  border: 2px solid var(--active-item);
  color: var(--font-color);
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.send-button:hover:not(:disabled) {
  background-color: var(--active-item);
  color: var(--bg-color);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Scrollbar styling */
.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--active-item);
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: var(--font-color);
}
</style>
