<template>
  <div class="tictactoe-page">
    <div class="title">
      <span>Gra: {{ roomName || `Pokój #${state.gameId?.slice(-6) || ''}` }}</span>
    </div>

    <section class="play-row">
      <div id="board-area">
        <BoardTicTacToe
          :board="state.board"
          @square-click="handleSquareClick"
        />
      </div>

      <div id="side-panel">
        <RoomChat game-key="tictactoe" :game-id="state.gameId" />
      </div>
    </section>

    <section class="playersJoinInfo">
      <div class="players-grid">
        <div id="Player1" class="player-slot">
          <div class="slot-photo"></div>
          <div class="slot-meta">
            <div class="slot-name">{{ leftLabel }}</div>
            <button v-if="!hasLeft" class="slot-join" type="button" @click="handleJoin({ side: 'left' })">
              Dołącz
            </button>
          </div>
        </div>

        <div class="score">
          {{ score.left }} : {{ score.right }}
        </div>

        <div id="Player2" class="player-slot">
          <div class="slot-photo"></div>
          <div class="slot-meta">
            <div class="slot-name">{{ rightLabel }}</div>
            <button v-if="!hasRight" class="slot-join" type="button" @click="handleJoin({ side: 'right' })">
              Dołącz
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="movesLog">
      <h3>Ostatnie ruchy</h3>
      <div class="moves-table-wrap">
        <table class="moves-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Gracz</th>
              <th>Pole</th>
              <th>Symbol</th>
              <th>Czas</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(m, i) in moves" :key="m.id ?? i">
              <td>{{ m.id ?? (i + 1) }}</td>
              <td>{{ m.playerName || "Anonim" }}</td>
              <td>{{ m.x !== undefined && m.y !== undefined ? `${m.x},${m.y}` : '-' }}</td>
              <td>{{ m.symbol || '-' }}</td>
              <td>{{ formatTime(m.time) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    
    <div v-if="state.status !== 'ongoing'" class="end-modal-backdrop">
      <div class="end-modal">
        <h2 class="end-title">{{ endTitle }}</h2>
        <p class="end-subtitle" v-if="endMessage">{{ endMessage }}</p>
        
        <div class="end-actions">
          <button class="end-btn" type="button" @click="exitToHome">
            Wyjdź
          </button>
          
          <div class="rematch-box">
            <button class="end-btn primary" type="button" @click="requestRematch" :disabled="!mySide" style="opacity: 0.95;">
              Zagraj ponownie
            </button>
            <div class="rematch-count">{{ state.rematchCount }}/2</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import BoardTicTacToe from "@/components/tictactoe/tictactoeBoard.vue";
import RoomChat from "@/components/common/RoomChat.vue";
import socket from "@/services/socket";

const route = useRoute();
const router = useRouter();

const score = reactive({ left: 0, right: 0 });
const moves = ref([]);
const roomName = ref("");

const state = reactive({
  gameId: null,
  players: { left: null, right: null },
  board: [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ],
  currentTurn: "X",
  status: "ongoing",
  winner: null,
  rematchCount: 0,
});

function normalizePlayer(p) {
  if (!p) return null;
  return {
    username: p.username,
    userId: p.userId,
    socketId: p.socketId,
    symbol: p.symbol,
  };
}

function applyGame(game) {
  state.gameId = game?.id ?? null;
  roomName.value = game?.roomName || "";
  
  state.players = {
    left: normalizePlayer(game?.players?.left),
    right: normalizePlayer(game?.players?.right),
  };
  
  state.board = game?.board || [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
  state.currentTurn = game?.currentTurn || "X";
  moves.value = game?.moves ?? [];
  score.left = game?.score?.left ?? 0;
  score.right = game?.score?.right ?? 0;
  state.status = game?.status || "ongoing";
  state.winner = game?.winner ?? null;
  
  const ready = game?.rematchReady;
  state.rematchCount = ready ? (ready.left ? 1 : 0) + (ready.right ? 1 : 0) : 0;
}

function normalizePlayerForLabel(p) {
  if (!p) return { exists: false, label: "wolne miejsce" };
  const label = (p.username || p.name || "").toString().trim();
  return { exists: true, label: label || "wolne miejsce" };
}

const leftNorm = computed(() => normalizePlayerForLabel(state.players?.left));
const rightNorm = computed(() => normalizePlayerForLabel(state.players?.right));

const hasLeft = computed(() => leftNorm.value.exists);
const hasRight = computed(() => rightNorm.value.exists);

const leftLabel = computed(() => leftNorm.value.label);
const rightLabel = computed(() => rightNorm.value.label);

function formatTime(time) {
  if (!time) return "";
  const d = new Date(time);
  if (Number.isNaN(d.getTime())) return time;
  return d.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function setupSocketListeners() {
  socket.off("tictactoe:state");
  socket.on("tictactoe:state", (game) => {
    console.log("[TICTACTOE] tictactoe:state received", game);
    applyGame(game);
  });
  
  socket.off("tictactoe:rematchStatus");
  socket.on("tictactoe:rematchStatus", (payload) => {
    if (String(payload?.gameId) !== String(state.gameId)) return;
    state.rematchCount = payload?.count ?? state.rematchCount;
  });
  
  socket.off("tictactoe:rematchStarted");
  socket.on("tictactoe:rematchStarted", async ({ newGameId }) => {
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
    socket.emit("tictactoe:createGame", {}, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || "createGame failed"));
      resolve(resp.game);
    });
  });
}

function socketWatchGame(gameId) {
  return new Promise((resolve, reject) => {
    socket.emit("tictactoe:watchGame", { gameId }, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || "watchGame failed"));
      resolve(resp.game);
    });
  });
}

function socketJoinGame({ gameId, side, username, userId }) {
  return new Promise((resolve, reject) => {
    socket.emit("tictactoe:joinGame", { gameId, side, username, userId }, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || "joinGame failed"));
      resolve(resp.game);
    });
  });
}

function socketMove(payload) {
  return new Promise((resolve, reject) => {
    socket.emit("tictactoe:move", payload, (resp) => {
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

const mySide = computed(() => {
  const me = myUser.value;
  if (!me?.id) return null;
  if (state.players?.left?.userId === me.id) return "left";
  if (state.players?.right?.userId === me.id) return "right";
  return null;
});

const mySymbol = computed(() => {
  if (mySide.value === "left") return state.players?.left?.symbol || null;
  if (mySide.value === "right") return state.players?.right?.symbol || null;
  return null;
});

const isMyTurn = computed(() => {
  if (!mySymbol.value) return false;
  return state.currentTurn === mySymbol.value;
});

const endTitle = computed(() => {
  if (state.status === "draw") return "Remis";
  if (state.status === "finished") return "Koniec gry";
  return "";
});

const endMessage = computed(() => {
  if (state.status === "draw") {
    return "Gra zakończyła się remisem.";
  }
  
  if (state.status === "finished") {
    if (state.winnerSide === "left") {
      return `Wygrał ${state.players?.left?.username || "gracz"}`;
    }
    if (state.winnerSide === "right") {
      return `Wygrał ${state.players?.right?.username || "gracz"}`;
    }
    return "Gra zakończona.";
  }
  
  return "";
});

async function handleJoin({ side, gameId }) {
  const user = getLoggedUserOrNull();
  if (!user?.id || !user?.username) {
    alert("Musisz być zalogowany, żeby dołączyć do gry.");
    return;
  }
  const username = user.username;
  const userId = user.id;
  
  const realGameId = gameId || route.query.gameId || state.gameId;
  if (!realGameId) {
    alert("Brak ID gry (odśwież stronę).");
    return;
  }
  
  try {
    const updatedGame = await socketJoinGame({
      gameId: realGameId,
      side,
      username,
      userId,
    });
    applyGame(updatedGame);
  } catch (e) {
    alert(e.message || "Nie udało się dołączyć");
  }
}

async function handleSquareClick(pos) {
  if (state.status !== "ongoing") return;
  if (!mySymbol.value) return;
  if (!isMyTurn.value) return;
  
  if (state.board[pos.y][pos.x] !== null) return;
  
  const user = getLoggedUserOrNull();
  
  try {
    await socketMove({
      gameId: state.gameId,
      x: pos.x,
      y: pos.y,
      userId: user?.id,
    });
  } catch (e) {
    alert(e.message || "Nie udało się wykonać ruchu");
  }
}

onMounted(async () => {
  setupSocketListeners();
  const gameIdFromUrl = route.query.gameId;
  const me = getLoggedUserOrNull();
  
  try {
    if (gameIdFromUrl) {
      const game = await socketWatchGame(gameIdFromUrl);
      applyGame(game);
      
      if (me?.id) {
        let side = null;
        
        if (game?.players?.left?.userId === me.id) side = "left";
        if (game?.players?.right?.userId === me.id) side = "right";
        
        if (side) {
          const updatedGame = await socketJoinGame({
            gameId: gameIdFromUrl,
            side,
            username: me.username,
            userId: me.id,
          });
          
          applyGame(updatedGame);
        }
      }
    } else {
      const game = await socketCreateGame();
      applyGame(game);
      
      router.replace({
        query: { ...route.query, gameId: game.id },
      });
    }
  } catch (e) {
    console.error("Init socket tictactoe error:", e);
  }
});

function requestRematch() {
  const me = getLoggedUserOrNull();
  if (!me?.id) return;
  
  socket.emit("tictactoe:rematchReady", { gameId: state.gameId, userId: me.id }, (resp) => {
    if (!resp?.ok) alert(resp?.error || "Nie udało się zgłosić rematchu");
  });
}

function exitToHome() {
  router.push("/");
}
</script>

<style scoped>
.tictactoe-page {
  color: var(--font-color);
}

.title {
  border: 2px solid var(--border-color-dimmed);
  display: flex;
  margin: 1rem;
  justify-content: center;
  font-size: 1.2rem;
  padding: 10px;
  color: var(--border-color-dimmed);
  transition: border-color 0.3s ease, color 0.3s ease;
  cursor: default;
}

.play-row {
  width: 1150px;
  margin: 0 auto 16px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: center;
}

#board-area {
  flex-shrink: 0;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

#side-panel {
  width: 260px;
  height: 500px;
  background: var(--bg-color);
  border: 2px solid var(--border-color-dimmed);
  flex-shrink: 0;
  overflow: hidden;
}

.playersJoinInfo {
  width: 950px;
  margin: 24px auto 0;
}

.players-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  column-gap: 48px;
  align-items: center;
}

.player-slot {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 360px;
  height: 150px;
  margin: 0 auto;
  background: var(--bg-color);
  border: 2px solid var(--border-color-dimmed);
  padding: 12px;
}

.slot-photo {
  width: 140px;
  height: 110px;
  border: 2px solid var(--border-color-dimmed);
  background: var(--bg-app-color);
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
  background: var(--bg-app-color);
  color: var(--font-color);
  display: flex;
  align-items: center;
}

.slot-join {
  align-self: start;
  padding: 8px 14px;
  font-weight: 600;
  border: 2px solid var(--border-color-dimmed);
  background: var(--bg-color);
  color: var(--font-color);
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
  font-family: "JetBrains Mono", monospace;
}

.slot-join:hover {
  border-color: var(--active-item);
  color: var(--active-item);
}

.score {
  min-width: 100px;
  height: 80px;
  background: var(--bg-color);
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 28px;
  letter-spacing: 2px;
  color: var(--font-color);
  border: 2px solid var(--border-color-dimmed);
}

.movesLog {
  width: 820px;
  margin: 24px auto 48px;
}

.movesLog h3 {
  margin: 0 0 12px;
  font-size: 1.1rem;
  color: var(--font-color);
}

.moves-table-wrap {
  border: 2px solid var(--border-color-dimmed);
  background: var(--bg-app-color);
  max-height: 220px;
  overflow-y: auto;
  overflow-x: hidden;
}

.moves-table {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.95rem;
  color: var(--font-color);
}

.moves-table thead th {
  position: sticky;
  top: 0;
  background: var(--bg-app-color);
  border-bottom: 2px solid var(--border-color-dimmed);
  text-align: left;
  padding: 10px 12px;
}

.moves-table tbody td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color-dimmed);
  white-space: nowrap;
}

.moves-table tbody tr:nth-child(even) {
  background: var(--bg-color);
}

.moves-table tbody tr:nth-child(odd) {
  background: var(--bg-app-color);
}

.end-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: grid;
  place-items: center;
  z-index: 9999;
}

.end-modal {
  width: 420px;
  background: var(--bg-color);
  border: 2px solid var(--border-color-dimmed);
  padding: 18px;
  color: var(--font-color);
}

.end-title {
  margin: 0 0 14px;
  font-size: 20px;
  font-weight: 800;
  color: var(--font-color);
}

.end-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.end-btn {
  padding: 10px 14px;
  border: 2px solid var(--border-color-dimmed);
  background: var(--bg-color);
  color: var(--font-color);
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease, transform 0.2s ease;
  font-family: "JetBrains Mono", monospace;
}

.end-btn:hover:not(:disabled) {
  border-color: red;
  color: red;
  transform: translateY(-2px);
}

.end-btn.primary {
  background: var(--bg-app-color);
}

.end-btn.primary:hover:not(:disabled) {
  border-color: var(--active-item);
  color: var(--active-item);
}

.rematch-box {
  display: grid;
  gap: 6px;
  justify-items: center;
}

.rematch-count {
  font-size: 12px;
  opacity: 0.85;
  color: var(--font-color);
}

.end-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  pointer-events: none;
}

.end-btn:disabled:hover {
  border-color: var(--border-color-dimmed);
  color: var(--font-color);
}

.end-subtitle {
  margin: 0 0 14px;
  opacity: 0.9;
  font-size: 14px;
  color: var(--font-color);
}
</style>