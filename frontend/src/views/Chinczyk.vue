<template>
  <div id="app" class="game-container">
    <!-- DEBUG INFO -->
    <div style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; font-size: 11px; z-index: 9999; border-radius: 5px;">
      Mode: {{ gameMode }}<br>
      Socket: {{ socketConnected ? '✅' : '❌' }}<br>
      roomJoined: {{ roomJoined }}<br>
      gameStarted: {{ gameStarted }}<br>
      roomId: {{ roomId }}<br>
      players: {{ players.length }}
    </div>

    <!-- Ekran wyboru pokoju -->
    <div v-if="!roomJoined" class="room-selection">
      <h1>Chińczyk</h1>
      
      <!-- Wybór trybu gry -->
      <div class="mode-selector">
        <button 
          :class="{ active: gameMode === 'local' }" 
          @click="gameMode = 'local'"
          class="mode-btn"
        >
          🏠 Gra lokalna
        </button>
        <button 
          :class="{ active: gameMode === 'online' }" 
          @click="gameMode = 'online'"
          class="mode-btn"
        >
          🌐 Gra online
        </button>
      </div>

      <!-- Gra lokalna -->
      <div v-if="gameMode === 'local'" class="local-game-setup">
        <h2>Gra lokalna (hot-seat)</h2>
        <p style="color: #888; font-size: 14px; margin: 10px 0;">Gracze grają po kolei na tym samym komputerze</p>
        
        <div class="player-inputs">
          <div v-for="n in localPlayerCount" :key="n" class="player-input">
            <label>Gracz {{ n }}:</label>
            <input 
              v-model="localPlayerNames[n-1]" 
              :placeholder="'Gracz ' + n"
              @keyup.enter="startLocalGame"
            />
          </div>
        </div>
        
        <div class="player-count-selector">
          <label>Liczba graczy:</label>
          <select v-model="localPlayerCount">
            <option :value="2">2 graczy</option>
            <option :value="3">3 graczy</option>
            <option :value="4">4 graczy</option>
          </select>
        </div>
        
        <button @click="startLocalGame" class="start-local-btn">
          Rozpocznij grę lokalną
        </button>
        
        <div v-if="errorMessage && gameMode === 'local'" class="error-message">{{ errorMessage }}</div>
      </div>

      <!-- Gra online -->
      <div v-else>
        <!-- Ostrzeżenie o braku połączenia -->
        <div v-if="!socketConnected" class="warning-message">
        ⚠️ Brak połączenia z serwerem! Upewnij się, że:
        <ul style="text-align: left; margin: 10px 20px;">
          <li>Backend działa (uruchom: <code>cd backend && node server.js</code>)</li>
          <li><strong>Jesteś zalogowany</strong> (Socket.IO wymaga autoryzacji)</li>
        </ul>
        <button @click="$router.push('/login')" style="margin-top: 10px; padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Przejdź do logowania
        </button>
      </div>
      
      <div class="room-options">
        <div class="option-card">
          <h2>Utwórz nowy pokój</h2>
          <input 
            v-model="playerName" 
            placeholder="Twoje imię"
            @keyup.enter="createRoom"
          />
          <select v-model="maxPlayers">
            <option value="2">2 graczy</option>
            <option value="3">3 graczy</option>
            <option value="4">4 graczy</option>
          </select>
          <button @click="createRoom" :disabled="!playerName.trim()">
            Utwórz pokój
          </button>
        </div>

        <div class="option-card">
          <h2>Dołącz do pokoju</h2>
          <input 
            v-model="playerName" 
            placeholder="Twoje imię"
          />
          <input 
            v-model="roomIdToJoin" 
            placeholder="ID pokoju"
            @keyup.enter="joinRoom"
          />
          <button @click="joinRoom" :disabled="!playerName.trim() || !roomIdToJoin.trim()">
            Dołącz
          </button>
        </div>
      </div>

      <div v-if="errorMessage && gameMode === 'online'" class="error-message">{{ errorMessage }}</div>
      </div>
    </div>

    <!-- Widok gry (pokój + plansza) -->
    <div v-else class="game-screen">
      <div class="game-header">
        <h1>Chińczyk</h1>
        <div class="room-info">
          <span>Pokój: <strong>{{ roomId }}</strong></span>
          <button @click="leaveRoom" class="leave-small-btn">Opuść</button>
        </div>
      </div>

      <div class="game-board">
        <Board 
          :gameState="gameState"
          :selectedPawn="selectedPawn"
          :movablePawns="movablePawns"
          @pawn-clicked="onPawnClicked"
        />
        
        <div class="sidebar">
          <!-- Informacja o statusie gry -->
          <div v-if="!gameStarted" class="waiting-panel">
            <h3>Oczekiwanie na graczy</h3>
            <p class="share-info">Udostępnij kod pokoju: <strong>{{ roomId }}</strong></p>
            <p class="player-count">Gracze: {{ players.length }}/{{ maxPlayers }}</p>
            
            <button 
              v-if="isRoomCreator" 
              @click="startGame"
              :disabled="players.length < 2"
              class="start-btn"
            >
              Rozpocznij grę (min. 2 graczy)
            </button>
          </div>

          <!-- Tura gracza (gdy gra trwa) -->
          <div v-else class="turn-indicator">
            <h3>Obecna tura:</h3>
            <div class="current-player" :style="{ backgroundColor: getCurrentPlayerColor() }">
              {{ getCurrentPlayerName() }}
              <span v-if="isMyTurn" class="your-turn">Twoja kolej!</span>
            </div>
          </div>

          <!-- Kostka -->
          <Dice 
            v-if="gameStarted"
            :canRoll="canRollDice"
            :value="currentDice"
            @roll="onRollDice" 
          />

          <!-- Informacja o grze -->
          <div v-if="gameStarted" class="game-info">
            <p v-if="currentDice && movablePawns.length > 0">
              Wybierz pionek do ruchu
            </p>
            <p v-else-if="currentDice && movablePawns.length === 0">
              Brak możliwych ruchów
            </p>
          </div>

          <!-- Lista graczy -->
          <div class="players-info">
            <h3>Gracze:</h3>
            <PlayerInfo
              v-for="(player, idx) in players"
              :key="idx"
              :player="player"
              :color="getPlayerColor(idx)"
              :isActive="gameStarted && idx === currentTurn"
              :pawnsInGoal="getPawnsInGoal(idx)"
            />
          </div>

          <!-- Czat (tylko w grze online) -->
          <Chat 
            v-if="!isLocalGame"
            :messages="chatMessages"
            @send-message="sendChatMessage"
          />
        </div>
      </div>

      <!-- Modal wygranej -->
      <div v-if="winner" class="winner-modal">
        <div class="winner-content">
          <h2>🎉 Koniec gry! 🎉</h2>
          <p class="winner-name" :style="{ color: getPlayerColor(winner.index) }">
            Wygrał: {{ winner.name }}
          </p>
          <button @click="leaveRoom">Wróć do menu</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Board from '../compontents/chinczyk/chinczyk_board.vue'
import Dice from '../compontents/chinczyk/chinczyk_dice.vue'
import PlayerInfo from '../compontents/chinczyk/chinczyk_playerInfo.vue'
import Chat from '../compontents/chinczyk/chinczyk_chat.vue'
import chinczykService from '../services/chinczykService.js'
import chinczykLocalGame from '../services/chinczykLocalGame.js'

export default {
  components: { Board, Dice, PlayerInfo, Chat },
  data() {
    return {
      // Tryb gry
      gameMode: 'local', // 'local' lub 'online'
      isLocalGame: false,
      
      // Gra lokalna
      localPlayerCount: 2,
      localPlayerNames: ['', '', '', ''],
      
      // Stan pokoju
      roomJoined: false,
      roomId: null,
      playerName: '',
      roomIdToJoin: '',
      maxPlayers: 4,
      isRoomCreator: false,
      myPlayerId: null,
      
      // Stan gry
      gameStarted: false,
      gameState: null,
      players: [],
      currentTurn: 0,
      currentDice: null,
      selectedPawn: null,
      movablePawns: [],
      winner: null,
      
      // Czat
      chatMessages: [],
      
      // Komunikaty
      errorMessage: '',
      
      // Socket status
      socketConnected: false
    }
  },
  computed: {
    isMyTurn() {
      // W grze lokalnej zawsze jest twoja tura (hot-seat)
      if (this.isLocalGame) return true
      
      if (!this.gameState || !this.myPlayerId) return false
      const myPlayerIndex = this.players.findIndex(p => p.id === this.myPlayerId)
      return myPlayerIndex === this.currentTurn
    },
    canRollDice() {
      return this.isMyTurn && !this.currentDice && this.gameStarted && !this.winner
    }
  },
  methods: {
    // Gra lokalna
    startLocalGame() {
      // Pobierz tylko wypełnione nazwy graczy do wybranej liczby
      const names = this.localPlayerNames
        .slice(0, this.localPlayerCount)
        .map((n, i) => (n && n.trim()) || `Gracz ${i + 1}`)
      
      if (names.length < 2) {
        this.errorMessage = 'Wybierz co najmniej 2 graczy'
        return
      }
      
      console.log('🎮 Rozpoczynanie gry lokalnej...', { names, playerCount: this.localPlayerCount })
      
      this.errorMessage = ''
      this.isLocalGame = true
      this.roomJoined = true
      this.gameStarted = true
      this.roomId = 'LOCAL'
      
      // Utwórz lokalną grę
      const gameState = chinczykLocalGame.createGame(names)
      console.log('📊 Stan gry utworzony:', gameState)
      
      this.gameState = gameState
      this.players = gameState.players
      this.currentTurn = gameState.currentTurn
      this.currentDice = gameState.currentDice
      
      console.log('✅ Gra lokalna gotowa!', {
        roomJoined: this.roomJoined,
        gameStarted: this.gameStarted,
        players: this.players.length,
        gameState: !!this.gameState
      })
    },
    
    // Zarządzanie pokojami
    async createRoom() {
      if (!this.playerName.trim()) return
      
      try {
        this.errorMessage = ''
        console.log('🎮 Tworzenie pokoju...', { playerName: this.playerName, maxPlayers: this.maxPlayers })
        
        const response = await chinczykService.createRoom(this.playerName.trim(), parseInt(this.maxPlayers))
        
        console.log('✅ Pokój utworzony:', response)
        this.roomId = response.roomId
        this.myPlayerId = response.playerId
        this.players = response.players
        this.roomJoined = true
        this.isRoomCreator = true
        
        console.log('📊 Stan po utworzeniu:', {
          roomId: this.roomId,
          roomJoined: this.roomJoined,
          players: this.players
        })
      } catch (error) {
        console.error('❌ Błąd tworzenia pokoju:', error)
        this.errorMessage = String(error) || 'Nie udało się utworzyć pokoju'
      }
    },

    async joinRoom() {
      if (!this.playerName.trim() || !this.roomIdToJoin.trim()) return
      
      try {
        this.errorMessage = ''
        const response = await chinczykService.joinRoom(this.roomIdToJoin.trim(), this.playerName.trim())
        this.roomId = response.roomId
        this.myPlayerId = response.playerId
        this.players = response.players
        this.roomJoined = true
        this.isRoomCreator = false
      } catch (error) {
        this.errorMessage = error || 'Nie udało się dołączyć do pokoju'
      }
    },

    async startGame() {
      try {
        await chinczykService.startGame()
      } catch (error) {
        this.errorMessage = error || 'Nie udało się rozpocząć gry'
      }
    },

    leaveRoom() {
      if (!this.isLocalGame) {
        chinczykService.leaveRoom()
      }
      this.resetGame()
    },

    resetGame() {
      this.isLocalGame = false
      this.roomJoined = false
      this.roomId = null
      this.gameStarted = false
      this.gameState = null
      this.players = []
      this.currentTurn = 0
      this.currentDice = null
      this.selectedPawn = null
      this.movablePawns = []
      this.winner = null
      this.chatMessages = []
      this.isRoomCreator = false
      this.errorMessage = ''
      this.gameMode = 'local'
    },

    // Akcje gry
    async onRollDice() {
      if (!this.canRollDice) return
      
      // Gra lokalna
      if (this.isLocalGame) {
        const result = chinczykLocalGame.rollDice()
        
        if (result.success) {
          this.currentDice = result.value
          this.movablePawns = result.movablePawns
          this.gameState = chinczykLocalGame.getGameState()
          this.currentTurn = this.gameState.currentTurn
          
          // Jeśli brak możliwych ruchów i nie wyrzucono 6, tura zmieniona
          if (result.turnChanged) {
            setTimeout(() => {
              this.currentDice = null
              this.movablePawns = []
            }, 1000)
          }
        }
        return
      }
      
      // Gra online
      try {
        await chinczykService.rollDice()
      } catch (error) {
        console.error('Błąd przy rzucie kostką:', error)
      }
    },

    async onPawnClicked(pawn) {
      if (!this.isMyTurn || !this.currentDice) return
      
      // Sprawdź czy pionek można ruszyć
      if (!this.movablePawns.some(p => p.id === pawn.id)) return
      
      // Gra lokalna
      if (this.isLocalGame) {
        const result = chinczykLocalGame.movePawn(pawn.id)
        
        if (result.success) {
          this.gameState = result.gameState
          this.currentDice = this.gameState.currentDice
          this.currentTurn = this.gameState.currentTurn
          this.movablePawns = []
          this.selectedPawn = null
          
          // Sprawdź wygranego
          if (result.winner !== null) {
            this.winner = {
              index: result.winner,
              name: this.players[result.winner].name
            }
          }
        }
        return
      }
      
      // Gra online
      try {
        await chinczykService.movePawn(pawn.id)
        this.selectedPawn = null
      } catch (error) {
        console.error('Błąd przy ruchu pionka:', error)
      }
    },

    // Pomocnicze
    getPlayerColor(index) {
      const colors = ['red', 'blue', 'green', 'yellow']
      return colors[index] || 'gray'
    },

    getCurrentPlayerName() {
      return this.players[this.currentTurn]?.name || 'Gracz'
    },

    getCurrentPlayerColor() {
      const colors = ['red', 'blue', 'green', 'yellow']
      return colors[this.currentTurn] || 'gray'
    },

    getPawnsInGoal(playerIndex) {
      if (!this.gameState) return 0
      const color = this.getPlayerColor(playerIndex)
      const pawns = this.gameState.pawns[color] || []
      return pawns.filter(p => p.inGoal).length
    },

    sendChatMessage(message) {
      chinczykService.sendChatMessage(message)
    },

    // Event handlers
    setupSocketListeners() {
      chinczykService.onPlayerJoined((data) => {
        this.players = data.players
        this.addSystemMessage(`${data.playerName} dołączył do gry`)
      })

      chinczykService.onPlayerLeft((data) => {
        this.players = data.players
        this.addSystemMessage(`${data.playerName} opuścił grę`)
      })

      chinczykService.onGameStarted((data) => {
        this.gameStarted = true
        this.gameState = data.gameState
        this.currentTurn = 0
        this.addSystemMessage('Gra rozpoczęta!')
      })

      chinczykService.onGameStateUpdate((data) => {
        this.gameState = data.gameState
      })

      chinczykService.onDiceRolled((data) => {
        this.currentDice = data.value
        this.movablePawns = data.movablePawns || []
        
        if (data.playerId !== this.myPlayerId) {
          const player = this.players.find(p => p.id === data.playerId)
          this.addSystemMessage(`${player?.name || 'Gracz'} wyrzucił ${data.value}`)
        }
      })

      chinczykService.onPawnMoved((data) => {
        this.gameState = data.gameState
        this.currentDice = null
        this.movablePawns = []
        
        if (data.captured) {
          this.addSystemMessage(`Pionek został zbity!`)
        }
      })

      chinczykService.onTurnChanged((data) => {
        this.currentTurn = data.currentTurn
        this.currentDice = null
        this.movablePawns = []
        
        const player = this.players[data.currentTurn]
        this.addSystemMessage(`Tura gracza: ${player?.name || 'Gracz'}`)
      })

      chinczykService.onGameFinished((data) => {
        const winnerPlayer = this.players[data.winnerIndex]
        this.winner = {
          name: winnerPlayer?.name || 'Gracz',
          index: data.winnerIndex
        }
        this.addSystemMessage(`🎉 ${this.winner.name} wygrał grę!`)
      })

      chinczykService.onChatMessage((data) => {
        this.chatMessages.push({
          author: data.playerName,
          text: data.message,
          time: this.formatTime(new Date()),
          color: this.getPlayerColor(data.playerIndex),
          isSystem: false
        })
      })
    },

    addSystemMessage(text) {
      this.chatMessages.push({
        author: 'System',
        text,
        time: this.formatTime(new Date()),
        color: '#333',
        isSystem: true
      })
    },

    formatTime(date) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  },

  mounted() {
    this.setupSocketListeners()
    
    // Sprawdź status połączenia socket
    const checkConnection = () => {
      const socket = chinczykService.getSocket()
      this.socketConnected = socket.connected
      console.log('Socket status:', socket.connected ? '✅ Połączony' : '❌ Niepołączony')
    }
    
    checkConnection()
    setInterval(checkConnection, 1000)
  },

  beforeUnmount() {
    chinczykService.cleanup()
  }
}
</script>

<style scoped>
.game-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

/* Room Selection */
.room-selection {
  text-align: center;
  padding: 40px 20px;
}

.room-selection h1 {
  margin-bottom: 40px;
  color: #333;
}

.room-options {
  display: flex;
  gap: 30px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.option-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  min-width: 300px;
}

.option-card h2 {
  margin-bottom: 20px;
  color: #444;
  font-size: 1.3em;
}

.option-card input,
.option-card select {
  width: 100%;
  padding: 12px;
  margin-bottom: 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
  box-sizing: border-box;
}

.option-card input:focus,
.option-card select:focus {
  outline: none;
  border-color: #4CAF50;
}

.option-card button {
  width: 100%;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background 0.3s;
}

.option-card button:hover:not(:disabled) {
  background: #45a049;
}

.option-card button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #f44336;
  background: #ffebee;
  padding: 12px 20px;
  border-radius: 8px;
  margin-top: 20px;
  display: inline-block;
}

.warning-message {
  background: #fff3cd;
  color: #856404;
  border: 2px solid #ffc107;
  padding: 20px;
  border-radius: 8px;
  margin: 20px auto;
  max-width: 600px;
  text-align: center;
}

.warning-message code {
  background: rgba(0,0,0,0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

/* Mode Selector */
.mode-selector {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 30px 0;
}

.mode-btn {
  padding: 15px 30px;
  font-size: 1.1em;
  border: 2px solid #ddd;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-btn:hover {
  border-color: #4CAF50;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.mode-btn.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

/* Local Game Setup */
.local-game-setup {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  max-width: 500px;
  margin: 0 auto;
}

.local-game-setup h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.player-inputs {
  margin: 20px 0;
}

.player-input {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.player-input label {
  min-width: 80px;
  font-weight: 500;
  color: #555;
}

.player-input input {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
  transition: border-color 0.3s;
}

.player-input input:focus {
  outline: none;
  border-color: #4CAF50;
}

.player-count-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 20px 0;
}

.player-count-selector label {
  font-weight: 500;
  color: #555;
}

.player-count-selector select {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
  cursor: pointer;
}

.start-local-btn {
  width: 100%;
  padding: 15px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

.start-local-btn:hover {
  background: #45a049;
}

/* Lobby */
.lobby {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  padding: 40px 20px;
}

.lobby h1 {
  margin-bottom: 20px;
  color: #333;
}

.room-id {
  font-size: 1.2em;
  margin-bottom: 10px;
}

.room-id strong {
  color: #4CAF50;
  font-size: 1.5em;
  padding: 5px 15px;
  background: #f0f9f0;
  border-radius: 8px;
}

.share-info {
  color: #666;
  margin-bottom: 30px;
}

.players-waiting {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin-bottom: 25px;
}

.players-waiting h3 {
  margin-bottom: 15px;
  color: #444;
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  background: #f9f9f9;
  border-radius: 8px;
  text-align: left;
}

.color-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #333;
}

.you-badge {
  margin-left: auto;
  background: #4CAF50;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: bold;
}

.lobby-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.start-btn {
  padding: 14px 30px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background 0.3s;
}

.start-btn:hover:not(:disabled) {
  background: #45a049;
}

.start-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.leave-btn {
  padding: 14px 30px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background 0.3s;
}

.leave-btn:hover {
  background: #da190b;
}

.waiting-text {
  margin-top: 20px;
  color: #666;
  font-style: italic;
}

/* Game Screen */
.game-screen {
  width: 100%;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #ddd;
}

.game-header h1 {
  margin: 0;
  color: #333;
}

.room-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.room-info span {
  color: #666;
  font-weight: bold;
}

.leave-small-btn {
  padding: 8px 16px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}

.leave-small-btn:hover {
  background: #da190b;
}

.game-board {
  display: flex;
  gap: 30px;
  align-items: flex-start;
  justify-content: center;
  flex-wrap: wrap;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 320px;
  max-width: 380px;
}

.waiting-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  text-align: center;
}

.waiting-panel h3 {
  margin: 0 0 15px 0;
  color: #444;
  font-size: 1.2em;
}

.waiting-panel .share-info {
  color: #666;
  margin-bottom: 10px;
  font-size: 0.9em;
}

.waiting-panel .share-info strong {
  color: #4CAF50;
  font-size: 1.2em;
  padding: 3px 8px;
  background: #f0f9f0;
  border-radius: 4px;
}

.waiting-panel .player-count {
  font-size: 1.1em;
  font-weight: bold;
  color: #333;
  margin: 15px 0;
}

.waiting-panel .start-btn {
  width: 100%;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 10px;
}

.waiting-panel .start-btn:hover:not(:disabled) {
  background: #45a049;
}

.waiting-panel .start-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.turn-indicator {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.turn-indicator h3 {
  margin: 0 0 12px 0;
  color: #444;
  font-size: 1em;
}

.current-player {
  padding: 15px;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  font-size: 1.1em;
  text-align: center;
  position: relative;
}

.your-turn {
  display: block;
  font-size: 0.85em;
  margin-top: 5px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.game-info {
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  text-align: center;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-info p {
  margin: 0;
  color: #666;
  font-weight: 500;
}

.players-info {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.players-info h3 {
  margin: 0 0 15px 0;
  color: #444;
  font-size: 1em;
}

/* Winner Modal */
.winner-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.winner-content {
  background: white;
  border-radius: 20px;
  padding: 50px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  animation: slideIn 0.5s;
}

@keyframes slideIn {
  from {
    transform: translateY(-100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.winner-content h2 {
  margin: 0 0 20px 0;
  font-size: 2.5em;
  color: #333;
}

.winner-name {
  font-size: 1.8em;
  font-weight: bold;
  margin: 20px 0 30px 0;
}

.winner-content button {
  padding: 15px 40px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.2em;
  cursor: pointer;
  transition: background 0.3s;
}

.winner-content button:hover {
  background: #45a049;
}

/* Responsive */
@media (max-width: 768px) {
  .room-options {
    flex-direction: column;
    align-items: center;
  }
  
  .game-board {
    flex-direction: column;
    align-items: center;
  }
  
  .sidebar {
    width: 100%;
    max-width: 100%;
  }
}

.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: Arial, sans-serif;
}
.game-board {
  display: flex;
  margin-top: 20px;
}
.sidebar {
  margin-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 320px;
}
.players-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>