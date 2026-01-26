<template>
  <div class="chinczyk-layout">
    <!-- Lewa kolumna: Tura, Kostka, Gracze -->
    <aside class="chinczyk-sidebar">
      <!-- Status gry / Tura -->
      <div class="sidebar-panel">
        <h3>{{ state.gameStarted ? 'Obecna tura' : 'Oczekiwanie na graczy' }}</h3>
        
        <div v-if="!state.gameStarted" class="waiting-info">
          <p>Gracze: {{ state.players.length }}/{{ state.maxPlayers }}</p>
          <button 
            v-if="canStartGame" 
            @click="startGame"
            :disabled="state.players.length < 2"
            class="start-btn"
          >
            Rozpocznij grę
          </button>
        </div>

        <div v-else class="current-turn" :style="{ backgroundColor: getCurrentPlayerColor() }">
          {{ getCurrentPlayerName() }}
          <span v-if="isMyTurn" class="your-turn-badge">Twoja kolej!</span>
        </div>
      </div>

      <!-- Kostka -->
      <div v-if="state.gameStarted" class="sidebar-panel">
        <h3>Kostka</h3>
        <Dice 
          :canRoll="canRollDice"
          :value="currentDice"
          @roll="onRollDice" 
        />
        <p v-if="currentDice && movablePawns.length > 0" class="dice-hint">
          Wybierz pionek do ruchu
        </p>
        <p v-else-if="currentDice && movablePawns.length === 0" class="dice-hint">
          Brak możliwych ruchów
        </p>
      </div>

      <!-- Lista graczy -->
      <div class="sidebar-panel">
        <h3>Gracze</h3>
        <PlayerInfo
          v-for="(player, idx) in state.players"
          :key="idx"
          :player="player"
          :color="getPlayerColor(idx)"
          :isActive="state.gameStarted && idx === state.currentTurn"
          :pawnsInGoal="getPawnsInGoal(idx)"
        />
      </div>
    </aside>

    <!-- Główna zawartość: plansza + czat -->
    <div class="chinczyk-main">
      <section class="play-row">
        <div class="board-area">
          <Board 
            :gameState="state.gameState"
            :selectedPawn="selectedPawn"
            :movablePawns="movablePawns"
            @pawn-clicked="onPawnClicked"
          />
        </div>

        <RoomChat game-key="chinczyk" :game-id="state.gameId" />
      </section>

      <!-- Sloty graczy -->
      <section class="playersJoinInfo">
        <div class="players-grid" :class="{ 'multi-player': playerSlots.length > 2 }">
          <div 
            v-for="(player, idx) in playerSlots" 
            :key="idx"
            v-if="!state.gameStarted || player"
            class="player-slot"
          >
            <div class="slot-photo"></div>
            <div class="slot-meta">
              <div class="slot-name">{{ player?.username || 'wolne miejsce' }}</div>

              <button 
                v-if="!player && !state.gameStarted" 
                class="slot-join" 
                type="button" 
                @click="handleJoin(idx)"
              >
                Dołącz
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Ostatnie ruchy -->
      <section class="movesLog">
        <h3>Ostatnie ruchy</h3>
        <div class="moves-table-wrap">
          <table class="moves-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Gracz</th>
                <th>Z</th>
                <th>Do</th>
                <th>Typ</th>
                <th>Czas</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="state.moves.length === 0">
                <td colspan="6" style="text-align: center; color: #999;">Brak ruchów</td>
              </tr>
              <tr v-for="(m, i) in state.moves.slice().reverse()" :key="m.id || i">
                <td>{{ m.id }}</td>
                <td>{{ m.playerName }}</td>
                <td>{{ m.from }}</td>
                <td>{{ m.to }}</td>
                <td>{{ m.captured ? 'bicie' : 'ruch' }}</td>
                <td>{{ formatTime(m.time) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>

  <!-- Modal wygranej -->
  <div v-if="state.status === 'finished'" class="end-modal-backdrop">
    <div class="end-modal">
      <h2 class="end-title">🎉 Koniec gry! 🎉</h2>
      <p class="end-subtitle" v-if="winnerName">Wygrał: {{ winnerName }}</p>

      <div class="end-actions">
        <button class="end-btn" type="button" @click="exitToHome">
          Wyjdź
        </button>
        <div class="rematch-box">
          <button class="end-btn primary" type="button" @click="requestRematch" :disabled="myPlayerIndex === null">
            Zagraj ponownie
          </button>
          <div class="rematch-count">{{ state.rematchCount }}/{{ state.players.length }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import Board from "@/compontents/chinczyk/chinczyk_board.vue";
import Dice from "@/compontents/chinczyk/chinczyk_dice.vue";
import PlayerInfo from "@/compontents/chinczyk/chinczyk_playerInfo.vue";
import RoomChat from "@/components/common/RoomChat.vue";
import socket from "@/services/socket";

const route = useRoute();
const router = useRouter();

const selectedPawn = ref(null);
const movablePawns = ref([]);
const currentDice = ref(null);

const state = reactive({
  gameId: null,
  players: [],
  maxPlayers: 4,
  gameStarted: false,
  gameState: null,
  currentTurn: 0,
  status: "ongoing",
  winnerIndex: null,
  rematchCount: 0,
  moves: [],
});

const colors = ['red', 'blue', 'green', 'yellow'];

function normalizePlayer(p) {
  if (!p) return null;
  return {
    username: p.username,
    userId: p.userId,
    socketId: p.socketId,
  };
}

function applyGame(game) {
  state.gameId = game?.id ?? null;
  
  const playersArray = Array.isArray(game?.players) ? game.players : [];
  state.players = playersArray.map(normalizePlayer).filter(p => p !== null);
  
  state.maxPlayers = game?.maxPlayers || 4;
  state.gameStarted = game?.gameStarted || false;
  state.gameState = game?.gameState || null;
  state.status = game?.status || "ongoing";
  state.winnerIndex = game?.winnerIndex ?? null;
  state.moves = Array.isArray(game?.moves) ? game.moves : [];
  
  if (state.gameState) {
    state.currentTurn = state.gameState.currentTurn || 0;
    // Synchronizuj currentDice tylko gdy backend resetuje go do null
    // (po wykonaniu ruchu). Dzięki temu gracz może rzucić ponownie po wyrzuceniu 6
    if (state.gameState.currentDice === null && currentDice.value !== null) {
      console.log("[CHINCZYK] Backend zresetował currentDice - synchronizuję lokalny stan");
      currentDice.value = null;
      movablePawns.value = [];
    }
  }

  const ready = game?.rematchReady;
  state.rematchCount = ready ? Object.keys(ready).length : 0;

  console.log("[CHINCZYK] applyGame ->", {
    players: state.players.length,
    gameStarted: state.gameStarted,
    currentTurn: state.currentTurn,
    localCurrentDice: currentDice.value,
    gameStateCurrentDice: state.gameState?.currentDice
  });
}

function setupSocketListeners() {
  socket.off("chinczyk:state");
  socket.on("chinczyk:state", (game) => {
    console.log("[CHINCZYK] chinczyk:state received", game);
    applyGame(game);
  });

  socket.off("chinczyk:rematchStatus");
  socket.on("chinczyk:rematchStatus", (payload) => {
    if (String(payload?.gameId) !== String(state.gameId)) return;
    state.rematchCount = payload?.count ?? state.rematchCount;
  });

  socket.off("chinczyk:rematchStarted");
  socket.on("chinczyk:rematchStarted", async ({ newGameId }) => {
    if (!newGameId) return;
    console.log("[REMATCH] started -> newGameId:", newGameId);
    router.replace({ query: { ...route.query, gameId: newGameId } });
    
    try {
      const game = await socketWatchGame(newGameId);
      applyGame(game);
    } catch (e) {
      console.error("[REMATCH] watch new game failed", e);
    }
  });
}

function socketCreateGame() {
  return new Promise((resolve, reject) => {
    socket.emit("chinczyk:createGame", {}, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || "createGame failed"));
      resolve(resp.game);
    });
  });
}

function socketWatchGame(gameId) {
  return new Promise((resolve, reject) => {
    socket.emit("chinczyk:watchGame", { gameId }, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || "watchGame failed"));
      resolve(resp.game);
    });
  });
}

function socketJoinGame({ gameId, username, userId }) {
  return new Promise((resolve, reject) => {
    socket.emit("chinczyk:joinGame", { gameId, username, userId }, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || "joinGame failed"));
      resolve(resp.game);
    });
  });
}

function socketMove(payload) {
  return new Promise((resolve, reject) => {
    socket.emit("chinczyk:move", payload, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || "move failed"));
      resolve(resp.data);
    });
  });
}

function getLoggedUserOrNull() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const myUser = computed(() => getLoggedUserOrNull());

const myPlayerIndex = computed(() => {
  const me = myUser.value;
  if (!me?.id) return null;
  
  for (let i = 0; i < state.players.length; i++) {
    if (state.players[i]?.userId === me.id) {
      return i;
    }
  }
  return null;
});

const isMyTurn = computed(() => {
  if (myPlayerIndex.value === null) return false;
  return state.currentTurn === myPlayerIndex.value;
});

const canStartGame = computed(() => {
  return myPlayerIndex.value === 0 && !state.gameStarted;
});

const canRollDice = computed(() => {
  const localDiceNull = currentDice.value === null;
  const result = isMyTurn.value && localDiceNull && state.gameStarted && state.status === "ongoing";
  
  console.log("[CHINCZYK] canRollDice:", {
    result,
    isMyTurn: isMyTurn.value,
    localDiceNull,
    currentDiceValue: currentDice.value,
    gameStarted: state.gameStarted,
    status: state.status
  });
  
  return result;
});

const winnerName = computed(() => {
  if (state.winnerIndex === null || state.winnerIndex === undefined) return null;
  return state.players[state.winnerIndex]?.username || "Gracz";
});

const playerSlots = computed(() => {
  const slots = [];
  for (let i = 0; i < state.maxPlayers; i++) {
    slots.push(state.players[i] || null);
  }
  return slots;
});

async function handleJoin({ gameId }) {
  const user = getLoggedUserOrNull();
  if (!user?.id || !user?.username) {
    alert("Musisz być zalogowany, żeby dołączyć do gry.");
    return;
  }

  const realGameId = gameId || route.query.gameId || state.gameId;
  if (!realGameId) {
    alert("Brak ID gry (odśwież stronę).");
    return;
  }

  try {
    const updatedGame = await socketJoinGame({
      gameId: realGameId,
      username: user.username,
      userId: user.id,
    });
    applyGame(updatedGame);
  } catch (e) {
    alert(e.message || "Nie udało się dołączyć");
  }
}

async function startGame() {
  const user = getLoggedUserOrNull();
  if (!user?.id) return;

  try {
    const result = await socketMove({
      gameId: state.gameId,
      action: 'startGame',
      userId: user.id,
    });
    
    if (result.game) {
      applyGame(result.game);
    }
  } catch (e) {
    alert(e.message || "Nie udało się rozpocząć gry");
  }
}

async function onRollDice() {
  console.log("[CHINCZYK] onRollDice - START", {
    canRollDice: canRollDice.value,
    currentDice: currentDice.value,
    isMyTurn: isMyTurn.value,
    gameStarted: state.gameStarted
  });
  
  if (!canRollDice.value) return;
  
  const user = getLoggedUserOrNull();
  if (!user?.id) return;

  try {
    const result = await socketMove({
      gameId: state.gameId,
      action: 'rollDice',
      userId: user.id,
    });
    
    console.log("[CHINCZYK] onRollDice - RESULT", result);
    
    if (result.result) {
      currentDice.value = result.result.value;
      movablePawns.value = result.result.movablePawns || [];
      
      if (result.result.shouldChangeTurn) {
        setTimeout(() => {
          currentDice.value = null;
          movablePawns.value = [];
        }, 1500);
      }
    }
  } catch (e) {
    console.error("Błąd przy rzucie kostką:", e);
  }
}

async function onPawnClicked(pawn) {
  console.log("[CHINCZYK] onPawnClicked - START", {
    pawnId: pawn.id,
    currentDice: currentDice.value,
    isMyTurn: isMyTurn.value
  });
  
  if (!isMyTurn.value || !currentDice.value) return;
  
  if (!movablePawns.value.some(p => p.id === pawn.id)) return;
  
  const user = getLoggedUserOrNull();
  if (!user?.id) return;

  try {
    const result = await socketMove({
      gameId: state.gameId,
      action: 'movePawn',
      userId: user.id,
      pawnId: pawn.id,
    });
    
    console.log("[CHINCZYK] onPawnClicked - RESULT", result);
    
    movablePawns.value = [];
    selectedPawn.value = null;
  } catch (e) {
    console.error("Błąd przy ruchu pionka:", e);
  }
}

function getPlayerColor(index) {
  return colors[index] || 'gray';
}

function getCurrentPlayerName() {
  return state.players[state.currentTurn]?.username || 'Gracz';
}

function getCurrentPlayerColor() {
  return getPlayerColor(state.currentTurn);
}

function getPawnsInGoal(playerIndex) {
  if (!state.gameState) return 0;
  const color = getPlayerColor(playerIndex);
  const pawns = state.gameState.pawns?.[color] || [];
  return pawns.filter(p => p.inGoal).length;
}

function exitToHome() {
  router.push("/");
}

function requestRematch() {
  const user = getLoggedUserOrNull();
  if (!user?.id) return;

  socket.emit("chinczyk:rematchReady", { gameId: state.gameId, userId: user.id }, (resp) => {
    if (!resp?.ok) {
      alert(resp?.error || "Błąd rematch");
    }
  });
}

onMounted(async () => {
  setupSocketListeners();

  const gameIdParam = route.query.gameId;

  if (gameIdParam) {
    try {
      const game = await socketWatchGame(gameIdParam);
      applyGame(game);
      
      const user = getLoggedUserOrNull();
      if (user?.id && user?.username) {
        const isInGame = game.players?.some(p => p.userId === user.id);
        if (!isInGame && game.players.length < game.maxPlayers) {
          await handleJoin({ gameId: gameIdParam });
        }
      }
    } catch (e) {
      console.error("Błąd ładowania gry:", e);
    }
  } else {
    try {
      const game = await socketCreateGame();
      applyGame(game);
      router.replace({ query: { gameId: game.id } });
    } catch (e) {
      console.error("Błąd tworzenia gry:", e);
    }
  }
});

onUnmounted(() => {
  socket.off("chinczyk:state");
  socket.off("chinczyk:rematchStatus");
  socket.off("chinczyk:rematchStarted");
});

// Funkcja do formatowania czasu
function formatTime(time) {
  if (!time) return '';
  const d = new Date(time);
  if (isNaN(d.getTime())) return time;
  return d.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
</script>

<style scoped>
.game-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.waiting-panel,
.turn-indicator {
  background: var(--bg-color-secondary);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.waiting-panel h3,
.turn-indicator h3 {
  margin: 0 0 0.5rem 0;
  color: var(--font-color);
}

.player-count {
  font-size: 1.1rem;
  margin: 0.5rem 0;
}

.start-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
}

.start-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.current-player {
  padding: 0.75rem;
  border-radius: 5px;
  color: white;
  font-weight: bold;
  margin-top: 0.5rem;
}

.your-turn {
  display: block;
  font-size: 0.9rem;
  margin-top: 0.25rem;
  opacity: 0.9;
}

.game-info {
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 5px;
  padding: 0.75rem;
  text-align: center;
  color: var(--font-color);
}

.players-info {
  background: var(--bg-color-secondary);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
}

.players-info h3 {
  margin: 0 0 0.75rem 0;
  color: var(--font-color);
}

.end-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.end-modal {
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  text-align: center;
}

.end-title {
  margin: 0 0 1rem 0;
  color: var(--font-color);
}

.end-subtitle {
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
  color: var(--font-color);
}

.end-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.end-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--border-color);
  border-radius: 5px;
  background: var(--bg-color-secondary);
  color: var(--font-color);
  cursor: pointer;
  font-size: 1rem;
}

.end-btn.primary {
  background: #4CAF50;
  border-color: #4CAF50;
  color: white;
}

.end-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rematch-box {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rematch-count {
  font-size: 0.9rem;
  color: var(--font-color);
}

/* Layout główny: sidebar + main content */
.chinczyk-layout {
  display: flex;
  gap: 24px;
  max-width: 1600px;
  margin: 0 auto;
  padding: 16px;
}

/* Lewa kolumna - sidebar */
.chinczyk-sidebar {
  flex: 0 0 280px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-panel {
  background: #1f1f1f;
  border: 2px solid #444;
  border-radius: 8px;
  padding: 16px;
}

.sidebar-panel h3 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  color: #e0e0e0;
  font-weight: 600;
}

.waiting-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.waiting-info p {
  margin: 0;
  color: #aaa;
  font-size: 0.95rem;
}

.start-btn {
  width: 100%;
  padding: 10px;
  background: #262626;
  color: #f5f5f5;
  border: 2px solid #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.start-btn:hover:not(:disabled) {
  background: #3a3a3a;
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-turn {
  padding: 12px;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  text-align: center;
  font-size: 1rem;
}

.your-turn-badge {
  display: block;
  font-size: 0.85em;
  margin-top: 6px;
  opacity: 0.9;
}

.dice-hint {
  margin: 8px 0 0 0;
  color: #aaa;
  font-size: 0.9rem;
  text-align: center;
}

/* Główna zawartość - dokładnie jak GameLayout */
.chinczyk-main {
  flex: 1;
  min-width: 0;
}

.play-row {
  width: 1150px;
  margin: 0 auto 16px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: center;
}

.board-area {
  flex-shrink: 0;
}

.playersJoinInfo {
  width: 950px;
  margin: 24px auto 0;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(300px, 1fr));
  gap: 24px;
  max-width: 1200px;
}

.player-slot {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 360px;
  height: 150px;
  margin: 0 auto;
  background: #1f1f1f;
  border: 2px solid #454444;
  border-radius: 8px;
  padding: 12px;
}

.slot-photo {
  width: 140px;
  height: 110px;
  border: 2px solid #444444;
  border-radius: 6px;
  background: #2a2a2a;
  flex-shrink: 0;
}

.slot-meta {
  display: grid;
  align-content: start;
  gap: 12px;
  width: 100%;
}

.slot-name {
  padding: 8px 10px;
  font-weight: 600;
  min-height: 38px;
  background: #151515;
  color: #f5f5f5;
  border-radius: 4px;
}

.slot-join {
  align-self: start;
  padding: 8px 14px;
  font-weight: 600;
  border: 2px solid #f5f5f5;
  border-radius: 6px;
  background: #262626;
  color: #f5f5f5;
  cursor: pointer;
}

.slot-join:hover {
  background: #3a3a3a;
}

.movesLog {
  width: 820px;
  margin: 24px auto 48px;
}

.movesLog h3 {
  margin: 0 0 12px;
  font-size: 1.1rem;
  color: #e0e0e0;
}

.moves-table-wrap {
  border: 2px solid #444;
  border-radius: 8px;
  background: #181818;
  max-height: 220px;
  overflow-y: auto;
  overflow-x: hidden;
}

.moves-table {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.95rem;
  color: #ddd;
}

.moves-table thead th {
  position: sticky;
  top: 0;
  background: #242424;
  border-bottom: 2px solid #444;
  text-align: left;
  padding: 10px 12px;
}

.moves-table tbody td {
  padding: 8px 12px;
  border-bottom: 1px solid #333;
  white-space: nowrap;
}

.moves-table tbody tr:nth-child(even) {
  background: #1b1b1b;
}

.moves-table tbody tr:nth-child(odd) {
  background: #151515;
}

/* Responsywność */
@media (max-width: 1400px) {
  .chinczyk-layout {
    flex-direction: column;
  }

  .chinczyk-sidebar {
    flex: none;
    width: 100%;
  }
}
</style>


