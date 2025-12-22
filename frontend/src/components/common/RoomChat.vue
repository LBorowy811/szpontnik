<template>
  <div class="room-chat">
    <header class="room-chat-header">
      <h4>Czat w grze</h4>
    </header>

    <main class="room-chat-messages" ref="messagesContainer">
      <div 
        v-for="msg in messages" 
        :key="msg.id + msg.timestamp"
        class="room-message"
        :class="{ 'own-message': msg.userId === currentUserId }"
      >
        <div class="room-message-header">
          <span class="room-username">{{ msg.username }}</span>
          <span class="room-timestamp">{{ msg.timestamp }}</span>
        </div>
        <div class="room-message-content">{{ msg.message }}</div>
      </div>
    </main>

    <footer class="room-chat-input-container">
      <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        placeholder="Napisz wiadomość..."
        class="room-chat-input"
        :disabled="!isConnected || !currentUserId || !gameId"
      />
      <button 
        @click="sendMessage" 
        class="room-send-button"
        :disabled="!isConnected || !newMessage.trim() || !currentUserId || !gameId"
      >
        Wyślij
      </button>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import socket from '@/services/socket'

const props = defineProps({
  gameKey: { type: String, required: true },
  gameId: { type: [String, Number], default: null }
})

const messages = ref([])
const newMessage = ref('')
const isConnected = ref(false)
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
  if (!newMessage.value.trim() || !isConnected.value || !currentUserId.value || !props.gameId) return

  socket.emit('room:chat', {
    gameKey: props.gameKey,
    gameId: props.gameId,
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

  socket.on('room:chat', (data) => {
    // sprawdzenie czy wiadomość dotyczy tego pokoju
    if (data.gameKey === props.gameKey && String(data.gameId) === String(props.gameId)) {
      messages.value.push(data)
      scrollToBottom()
    }
  })
})

onUnmounted(() => {
  socket.off('connect')
  socket.off('disconnect')
  socket.off('room:chat')
})

// czyszczenie wiadomości przy zmianie gameId
watch(() => props.gameId, () => {
  messages.value = []
})
</script>

<style scoped>
.room-chat {
  width: 100%;
  height: 100%;
  max-height: 500px;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
}

.room-chat-header {
  padding: 12px;
  border-bottom: 2px solid #444;
  background: #1f1f1f;
}

.room-chat-header h4 {
  margin: 0;
  color: #f5f5f5;
  font-size: 0.95rem;
  font-weight: 600;
}

.room-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.room-message {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.room-message.own-message {
  align-self: flex-end;
  background-color: rgba(255, 255, 255, 0.1);
  max-width: 85%;
}

.room-message:not(.own-message) {
  align-self: flex-start;
  background-color: rgba(255, 255, 255, 0.05);
  max-width: 85%;
}

.room-message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  opacity: 0.8;
}

.room-username {
  font-weight: 600;
  color: #4a9eff;
}

.room-timestamp {
  font-size: 0.7rem;
  opacity: 0.6;
}

.room-message-content {
  color: #e0e0e0;
  word-wrap: break-word;
  line-height: 1.4;
}

.room-chat-input-container {
  display: flex;
  gap: 6px;
  padding: 8px;
  border-top: 2px solid #444;
  background: #1f1f1f;
}

.room-chat-input {
  flex: 1;
  padding: 6px 8px;
  background-color: #151515;
  border: 1px solid #444;
  border-radius: 4px;
  color: #f5f5f5;
  font-size: 0.85rem;
  font-family: inherit;
}

.room-chat-input:focus {
  outline: none;
  border-color: #666;
}

.room-chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.room-send-button {
  padding: 6px 12px;
  background-color: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #f5f5f5;
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: 600;
}

.room-send-button:hover:not(:disabled) {
  background-color: #333;
}

.room-send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

