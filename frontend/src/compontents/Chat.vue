<template>
  <div class="chat-container">
    <div class="chat-header">
      <h3>Czat</h3>
      <div class="online-info">
        <span v-if="onlineCount > 0">{{ onlineCount }} online</span>
        <span v-else class="connecting">Łączenie...</span>
      </div>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="msg in messages" 
        :key="msg.id + msg.timestamp"
        class="message"
        :class="{ 'own-message': msg.id === socketId.value }"
      >
        <div class="message-header">
          <span class="username">{{ msg.username }}</span>
          <span class="timestamp">{{ msg.timestamp }}</span>
        </div>
        <div class="message-content">{{ msg.message }}</div>
      </div>
    </div>

    <div class="chat-input-container">
      <input
        v-model="messageInput"
        @keyup.enter="sendMessage"
        type="text"
        placeholder="Napisz wiadomość..."
        class="chat-input"
        :disabled="!isConnected"
      />
      <button 
        @click="sendMessage" 
        class="send-button"
        :disabled="!isConnected || !messageInput.trim()"
      >
        Wyślij
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import socket from '../services/socket'

const messages = ref([])
const messageInput = ref('')
const isConnected = ref(false)
const socketId = ref(null)
const onlineCount = ref(0)
const messagesContainer = ref(null)

const sendMessage = () => {
  if (!messageInput.value.trim() || !isConnected.value) return

  const username = prompt('Podaj swoją nazwę użytkownika:') || 'Anonimowy'
  
  socket.emit('chat-message', {
    username: username,
    message: messageInput.value.trim()
  })

  messageInput.value = ''
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

onMounted(() => {
  // Łączymy się z Socket.IO
  socket.connect()

  // Nasłuchujemy na połączenie
  socket.on('connect', () => {
    isConnected.value = true
    socketId.value = socket.id
    console.log('Połączono z czatem')
    
    // Pobierz liczbę użytkowników online
    socket.emit('get-online-count')
  })

  // Nasłuchujemy na rozłączenie
  socket.on('disconnect', () => {
    isConnected.value = false
    console.log('Rozłączono z czatem')
  })

  // Nasłuchujemy na wiadomości czatu
  socket.on('chat-message', (data) => {
    messages.value.push(data)
    scrollToBottom()
  })

  // Nasłuchujemy na liczbę użytkowników online
  socket.on('online-count', (count) => {
    onlineCount.value = count
  })

  // Nasłuchujemy na dołączenie/opuszczenie użytkowników
  socket.on('user-connected', () => {
    socket.emit('get-online-count')
  })

  socket.on('user-disconnected', () => {
    socket.emit('get-online-count')
  })
})

onUnmounted(() => {
  // Rozłączamy się przy odmontowaniu komponentu
  socket.disconnect()
})
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 600px;
  max-width: 800px;
  margin: 2rem auto;
  background-color: var(--bg-color);
  border: 2px solid rgba(255, 255, 255, 0.251);
  border-radius: 8px;
  font-family: "JetBrains Mono";
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.251);
  color: var(--font-color);
}

.chat-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.online-info {
  font-size: 0.9rem;
  color: var(--active-item);
}

.connecting {
  color: #888;
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
  padding: 0.75rem;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: var(--font-color);
}

.message.own-message {
  background-color: rgba(66, 184, 131, 0.2);
  border-color: var(--active-item);
  align-self: flex-end;
  max-width: 70%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.username {
  font-weight: bold;
  color: var(--active-item);
}

.timestamp {
  color: #888;
  font-size: 0.75rem;
}

.message-content {
  word-wrap: break-word;
  line-height: 1.4;
}

.chat-input-container {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 2px solid rgba(255, 255, 255, 0.251);
}

.chat-input {
  flex: 1;
  padding: 0.75rem;
  background-color: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.251);
  border-radius: 6px;
  color: var(--font-color);
  font-family: "JetBrains Mono";
  font-size: 1rem;
  transition: border-color 0.3s ease;
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
  padding: 0.75rem 1.5rem;
  background-color: var(--active-item);
  border: 2px solid var(--active-item);
  border-radius: 6px;
  color: white;
  font-family: "JetBrains Mono";
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.send-button:hover:not(:disabled) {
  opacity: 0.8;
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Scrollbar styling */
.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #42b88372;
  border-radius: 4px;
}
</style>

