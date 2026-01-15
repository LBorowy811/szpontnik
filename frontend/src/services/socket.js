import { io } from 'socket.io-client'

const SERVER_URL = window.location.origin;

console.log('🔌 Inicjalizacja Socket.IO...', { SERVER_URL })

const socket = io(SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  path: '/socket.io',
  withCredentials: true,
  transports: ['websocket', 'polling']
})

const checkLoginAndConnect = () => {
  const user = localStorage.getItem('user')
  if (user && !socket.connected) {
    console.log('🔑 Znaleziono użytkownika, łączenie socket...')
    console.log('📝 Cookie:', document.cookie)
    socket.connect()
  }
}

checkLoginAndConnect()

setInterval(checkLoginAndConnect, 1000)

socket.on('connect', () => {
  console.log('✅ Połączono z serwerem Socket.IO:', socket.id)
})

socket.on('disconnect', (reason) => {
  console.log('❌ Rozłączono z serwerem Socket.IO. Powód:', reason)
})

socket.on('connect_error', (error) => {
  console.error('❌ Błąd połączenia Socket.IO:', error.message)
  console.error('   Szczegóły:', error)
  console.log('   Cookie:', document.cookie)
})

socket.on('error', (error) => {
  console.error('❌ Socket.IO error:', error)
})

export const connectSocket = () => {
  if (!socket.connected) {
    console.log('🔄 Ręczne łączenie socket...')
    console.log('📝 Cookie:', document.cookie)
    socket.connect()
  }
}

export default socket;
