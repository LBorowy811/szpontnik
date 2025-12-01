import { io } from 'socket.io-client'

// Utworzenie połączenia Socket.IO
// W trybie deweloperskim używa proxy z Vite (/socket.io), w produkcji bezpośrednio do serwera
const socket = io(import.meta.env.DEV ? '' : window.location.origin, {
  autoConnect: false, // Nie łączy się automatycznie - trzeba wywołać socket.connect()
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  path: '/socket.io', // Ścieżka dla Socket.IO
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

export default socket

