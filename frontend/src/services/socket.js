import { io } from 'socket.io-client'

const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
const SERVER_URL = `http://${host}:3000`;
const socket = io(SERVER_URL, {
  autoConnect: true, //automatyczne laczenie
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  path: '/socket.io', // Ścieżka dla Socket.IO
  withCredentials: true
})

// Event listeners dla połączenia
socket.on('connect', () => {
  console.log('Połączono z serwerem Socket.IO:', socket.id)
})

socket.on('disconnect', () => {
  console.log('Rozłączono z serwerem Socket.IO')
})

socket.on('connect_error', (error) => {
  console.error('Błąd połączenia Socket.IO:', error)
})

export default socket;
