import socket from './socket.js'

class ChinCzykService {
  constructor() {
    this.gameState = null
    this.currentRoom = null
    this.listeners = new Map()
  }

  // zarządzanie pokojami
  createRoom(playerName, maxPlayers = 4) {
    return new Promise((resolve, reject) => {
      console.log('Socket connected:', socket.connected)
      console.log('Wysyłam chinczyk:createRoom', { playerName, maxPlayers })
      
      socket.emit('chinczyk:createRoom', { playerName, maxPlayers }, (response) => {
        console.log('Otrzymano odpowiedź:', response)
        if (response && response.success) {
          this.currentRoom = response.roomId
          resolve(response)
        } else {
          reject(response?.error || 'Brak odpowiedzi z serwera')
        }
      })
      
      setTimeout(() => {
        reject('Timeout - brak odpowiedzi z serwera')
      }, 5000)
    })
  }

  joinRoom(roomId, playerName) {
    return new Promise((resolve, reject) => {
      socket.emit('chinczyk:joinRoom', { roomId, playerName }, (response) => {
        if (response.success) {
          this.currentRoom = roomId
          resolve(response)
        } else {
          reject(response.error)
        }
      })
    })
  }

  leaveRoom() {
    if (this.currentRoom) {
      socket.emit('chinczyk:leaveRoom', { roomId: this.currentRoom })
      this.currentRoom = null
    }
  }

  startGame() {
    return new Promise((resolve, reject) => {
      socket.emit('chinczyk:startGame', { roomId: this.currentRoom }, (response) => {
        if (response.success) {
          resolve(response)
        } else {
          reject(response.error)
        }
      })
    })
  }

  rollDice() {
    return new Promise((resolve, reject) => {
      socket.emit('chinczyk:rollDice', { roomId: this.currentRoom }, (response) => {
        if (response.success) {
          resolve(response)
        } else {
          reject(response.error)
        }
      })
    })
  }

  movePawn(pawnId) {
    return new Promise((resolve, reject) => {
      socket.emit('chinczyk:movePawn', { 
        roomId: this.currentRoom, 
        pawnId
      }, (response) => {
        if (response.success) {
          resolve(response)
        } else {
          reject(response.error)
        }
      })
    })
  }

  onGameStateUpdate(callback) {
    const handler = (data) => callback(data)
    socket.on('chinczyk:gameStateUpdate', handler)
    this.listeners.set('gameStateUpdate', handler)
    return () => socket.off('chinczyk:gameStateUpdate', handler)
  }

  onPlayerJoined(callback) {
    const handler = (data) => callback(data)
    socket.on('chinczyk:playerJoined', handler)
    this.listeners.set('playerJoined', handler)
    return () => socket.off('chinczyk:playerJoined', handler)
  }

  onPlayerLeft(callback) {
    const handler = (data) => callback(data)
    socket.on('chinczyk:playerLeft', handler)
    this.listeners.set('playerLeft', handler)
    return () => socket.off('chinczyk:playerLeft', handler)
  }

  onGameStarted(callback) {
    const handler = (data) => callback(data)
    socket.on('chinczyk:gameStarted', handler)
    this.listeners.set('gameStarted', handler)
    return () => socket.off('chinczyk:gameStarted', handler)
  }

  onDiceRolled(callback) {
    const handler = (data) => callback(data)
    socket.on('chinczyk:diceRolled', handler)
    this.listeners.set('diceRolled', handler)
    return () => socket.off('chinczyk:diceRolled', handler)
  }

  onPawnMoved(callback) {
    const handler = (data) => callback(data)
    socket.on('chinczyk:pawnMoved', handler)
    this.listeners.set('pawnMoved', handler)
    return () => socket.off('chinczyk:pawnMoved', handler)
  }

  onTurnChanged(callback) {
    const handler = (data) => callback(data)
    socket.on('chinczyk:turnChanged', handler)
    this.listeners.set('turnChanged', handler)
    return () => socket.off('chinczyk:turnChanged', handler)
  }

  onGameFinished(callback) {
    const handler = (data) => callback(data)
    socket.on('chinczyk:gameFinished', handler)
    this.listeners.set('gameFinished', handler)
    return () => socket.off('chinczyk:gameFinished', handler)
  }

  onChatMessage(callback) {
    const handler = (data) => callback(data)
    socket.on('chinczyk:chatMessage', handler)
    this.listeners.set('chatMessage', handler)
    return () => socket.off('chinczyk:chatMessage', handler)
  }

  sendChatMessage(message) {
    socket.emit('chinczyk:chatMessage', { 
      roomId: this.currentRoom, 
      message 
    })
  }

  cleanup() {
    this.listeners.forEach((handler, event) => {
      socket.off(`chinczyk:${event}`, handler)
    })
    this.listeners.clear()
    this.leaveRoom()
  }

  getSocket() {
    return socket
  }

  getInitialGameState(players) {
    const colors = ['red', 'blue', 'green', 'yellow']
    const homePositions = {
      red: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
      blue: [{ r: 0, c: 9 }, { r: 0, c: 10 }, { r: 1, c: 9 }, { r: 1, c: 10 }],
      green: [{ r: 9, c: 0 }, { r: 9, c: 1 }, { r: 10, c: 0 }, { r: 10, c: 1 }],
      yellow: [{ r: 9, c: 9 }, { r: 9, c: 10 }, { r: 10, c: 9 }, { r: 10, c: 10 }]
    }

    const pawns = {}
    players.forEach((player, idx) => {
      const color = colors[idx]
      const homes = homePositions[color]
      
      pawns[color] = homes.map((pos, i) => ({
        id: `${color}-${i}`,
        color,
        position: pos,
        inHome: true,
        inGoal: false,
        pathPosition: -1
      }))
    })

    return {
      pawns,
      currentTurn: 0,
      currentDice: null,
      players,
      colors: colors.slice(0, players.length),
      gameStatus: 'waiting'
    }
  }

  getGamePath() {
    return [
      { r: 4, c: 0 },
      { r: 4, c: 1 }, { r: 4, c: 2 }, { r: 4, c: 3 }, { r: 4, c: 4 },
      { r: 3, c: 4 }, { r: 2, c: 4 }, { r: 1, c: 4 }, { r: 0, c: 4 },
      { r: 0, c: 5 }, { r: 0, c: 6 },
      { r: 1, c: 6 }, { r: 2, c: 6 }, { r: 3, c: 6 }, { r: 4, c: 6 },
      { r: 4, c: 7 }, { r: 4, c: 8 }, { r: 4, c: 9 }, { r: 4, c: 10 },
      { r: 5, c: 10 }, { r: 6, c: 10 },
      { r: 6, c: 9 }, { r: 6, c: 8 }, { r: 6, c: 7 }, { r: 6, c: 6 },
      { r: 7, c: 6 }, { r: 8, c: 6 }, { r: 9, c: 6 }, { r: 10, c: 6 },
      { r: 10, c: 5 }, { r: 10, c: 4 },
      { r: 9, c: 4 }, { r: 8, c: 4 }, { r: 7, c: 4 }, { r: 6, c: 4 },
      { r: 6, c: 3 }, { r: 6, c: 2 }, { r: 6, c: 1 }, { r: 6, c: 0 },
      { r: 5, c: 0 }
    ]
  }

  getStartPaths() {
    return {
      red: [{ r: 5, c: 1 }, { r: 5, c: 2 }, { r: 5, c: 3 }, { r: 5, c: 4 }],
      blue: [{ r: 1, c: 5 }, { r: 2, c: 5 }, { r: 3, c: 5 }, { r: 4, c: 5 }],
      yellow: [{ r: 5, c: 9 }, { r: 5, c: 8 }, { r: 5, c: 7 }, { r: 5, c: 6 }],
      green: [{ r: 9, c: 5 }, { r: 8, c: 5 }, { r: 7, c: 5 }, { r: 6, c: 5 }]
    }
  }

  getStartPositions() {
    return {
      red: { r: 4, c: 0 },
      blue: { r: 0, c: 6 },
      yellow: { r: 6, c: 10 },
      green: { r: 10, c: 4 }
    }
  }
}

export default new ChinCzykService()
