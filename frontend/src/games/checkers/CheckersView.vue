<template>
  <GameLayout
    :score="score"
    :moves="moves"
    :game-id="state.gameId"
    :players="state.players"
    @join="handleJoin"
  >
    <template #board>
      <BoardCheckers
        :pieces="state.pieces"
        :selected-piece="selectedPiece"
        @piece-click="handlePieceClick"
        @square-click="handleSquareClick"
      />
    </template>
    <template #side>
      <RoomChat game-key="checkers" :game-id="state.gameId" />
    </template>
  </GameLayout>
  <div v-if="state.status !== 'ongoing' && !isTournamentMatch" class="end-modal-backdrop">
    <div class="end-modal">
      <h2 class="end-title">{{ endTitle }}</h2>
      <p class="end-subtitle" v-if="endMessage">{{ endMessage }}</p>

      <div class="end-actions">
        <button class="end-btn" type="button" @click="exitToHome">
          Wyjdź
        </button>

        <div class="rematch-box">
            <button class="end-btn primary" type="button" @click="requestRematch" :disabled="myPlayerIndex === null" style="opacity: 0.95;">
              Zagraj ponownie
            </button>
          <div class="rematch-count">{{ state.rematchCount }}/2</div>
        </div>
      </div>
    </div>
  </div>
  
  <div v-if="state.status !== 'ongoing' && isTournamentMatch" class="end-modal-backdrop">
    <div class="end-modal">
      <h2 class="end-title">{{ endTitle }}</h2>
      <p class="end-subtitle" v-if="endMessage">{{ endMessage }}</p>
      <p class="end-subtitle">Przekierowywanie do turnieju...</p>
    </div>
  </div>


</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import GameLayout from "@/games/GameLayout.vue";
import BoardCheckers from "@/components/checkers/BoardCheckers.vue";
import RoomChat from "@/components/common/RoomChat.vue";
import socket from "@/services/socket";
import { makeCheckersStartPieces } from "@/components/checkers/checkersStartPieces.js";
import { reportMatchResult } from "@/services/tournamentService";

const route = useRoute();
const router = useRouter();

const score = ref([0, 0]);
const moves = ref([]);
const selectedPiece = ref(null);

const isTournamentMatch = computed(() => {
  return !!(route.query.tournament && route.query.matchId);
});

const tournamentId = computed(() => route.query.tournament);
const matchId = computed(() => route.query.matchId);

const state = reactive({
  gameId: null,
  players: [null, null],
  pieces: makeCheckersStartPieces(),
  currentTurn: "white",
  validMoves: [],
  forcedPieceId: null,
  status: "ongoing",
  winner: null,
  winnerIndex: null,
  finishReason: null,
  rematchCount: 0,
});

function normalizePlayer(p) {
  if (!p) return null;
  return {
    username: p.username,
    userId: p.userId,
    socketId: p.socketId,
    color: p.color,
  };
}


function applyGame(game) {
  state.gameId = game?.id ?? null;

  const playersArray = Array.isArray(game?.players) ? game.players : [];
  state.players = [
    normalizePlayer(playersArray[0]),
    normalizePlayer(playersArray[1]),
  ];

  state.pieces = game?.pieces || makeCheckersStartPieces();
  state.currentTurn = game?.currentTurn || "white";
  moves.value = game?.moves ?? [];
  
  if (Array.isArray(game?.score)) {
    score.value = [game.score[0] ?? 0, game.score[1] ?? 0];
  } else {
    score.value = [0, 0];
  }
  
  state.forcedPieceId = game?.mustContinueCapture?.pieceId ?? null;
  state.status = game?.status || "ongoing";
  state.winner = game?.winner ?? null;
  state.winnerIndex = game?.winnerIndex ?? null;
  state.finishReason = game?.finishReason ?? null;

  const ready = game?.rematchReady;
  state.rematchCount = ready ? Object.keys(ready).length : 0;

  console.log("[CHECKERS] applyGame -> players:", state.players, "turn:", state.currentTurn);

  const me = getLoggedUserOrNull();
  const forced = state.forcedPieceId
    ? (state.pieces.find(p => p.id === state.forcedPieceId) || null)
    : null;

  const forcedForMe =
    !!forced &&
    !!game?.mustContinueCapture?.userId &&
    !!me?.id &&
    String(game.mustContinueCapture.userId) === String(me.id);

  if (forcedForMe) {
    selectedPiece.value = forced;

    const caps = getCaptureMovesLocal(forced);
    state.validMoves = caps;
  } else {
    selectedPiece.value = null;
    state.validMoves = [];
  }


}

function setupSocketListeners() {
  socket.off("checkers:state");
  socket.on("checkers:state", (game) => {
    console.log("[CHECKERS] checkers:state received", game);
    applyGame(game);
  });
  socket.off("checkers:rematchStatus");
  socket.on("checkers:rematchStatus", (payload) => {
    if (String(payload?.gameId) !== String(state.gameId)) return;
    state.rematchCount = payload?.count ?? state.rematchCount;
  });

  socket.off("checkers:rematchStarted");
  socket.on("checkers:rematchStarted", async ({ newGameId }) => {
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

watch(() => state.status, async (newStatus) => {
  if (!isTournamentMatch.value) return;
  if (newStatus !== 'finished' && newStatus !== 'draw') return;
  
  const user = getLoggedUserOrNull();
  if (!user?.id) return;
  
  let winnerId = null;
  if (newStatus === 'finished' && state.winnerIndex !== null) {
    winnerId = state.players[state.winnerIndex]?.userId;
  }
  
  try {
    await reportMatchResult({
      tournamentId: tournamentId.value,
      matchId: matchId.value,
      winnerId: winnerId
    });
    
    setTimeout(() => {
      router.push({ 
        name: 'TournamentBracket', 
        params: { id: tournamentId.value } 
      });
    }, 2000);
  } catch (error) {
    console.error('Błąd zgłaszania wyniku turnieju:', error);
  }
});

function socketCreateGame() {
  return new Promise((resolve, reject) => {
    socket.emit("checkers:createGame", {}, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || "createGame failed"));
      resolve(resp.game);
    });
  });
}

function socketWatchGame(gameId) {
  return new Promise((resolve, reject) => {
    socket.emit("checkers:watchGame", { gameId }, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || "watchGame failed"));
      resolve(resp.game);
    });
  });
}

function socketJoinGame({ gameId, username, userId }) {
  return new Promise((resolve, reject) => {
    socket.emit("checkers:joinGame", { gameId, username, userId }, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || "joinGame failed"));
      resolve(resp.game);
    });
  });
}


function socketMove(payload) {
  return new Promise((resolve, reject) => {
    console.log("[FRONT MOVE] socket.connected =", socket.connected, "socket.id =", socket.id, "payload =", payload);

    socket.emit("checkers:move", payload, (resp) => {
      console.log("[FRONT MOVE ACK]", resp);
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
  
  if (!Array.isArray(state.players)) return null;
  
  for (let i = 0; i < state.players.length; i++) {
    if (state.players[i]?.userId === me.id) {
      return i;
    }
  }
  return null;
});


const myColor = computed(() => {
  const index = myPlayerIndex.value;
  if (index === null) return null;
  return state.players[index]?.color || null;
});


const isMyTurn = computed(() => {
  if (!myColor.value) return false;
  return state.currentTurn === myColor.value;
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
    const winnerIndex = state.winnerIndex;
    if (winnerIndex !== null && winnerIndex >= 0 && winnerIndex < state.players.length) {
      return `Wygrał ${state.players[winnerIndex]?.username || "gracz"}`;
    }
    return "Gra zakończona.";
  }

  return "";
});


async function handleJoin({ playerIndex, gameId }) {
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
      username,
      userId,
    });
    applyGame(updatedGame);
  } catch (e) {
    alert(e.message || "Nie udało się dołączyć");
  }
}

function inBoard(x, y) {
  return x >= 0 && x < 8 && y >= 0 && y < 8;
}

function pieceAt(x, y) {
  return state.pieces.find(p => p.x === x && p.y === y) || null;
}

function getKingSlideMoves(piece) {
  const moves = [];
  const dirs = [
    { dx: 1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: -1, dy: -1 },
  ];

  for (const { dx, dy } of dirs) {
    let x = piece.x + dx;
    let y = piece.y + dy;

    while (inBoard(x, y) && !pieceAt(x, y)) {
      moves.push({ x, y, capturedId: null });
      x += dx;
      y += dy;
    }
  }

  return moves;
}

function getSimpleMoves(piece) {
  const moves = [];

  const dirs = [];
  if (piece.king) {
    dirs.push({ dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 });
  } else {
    if (piece.color === "white") dirs.push({ dx: -1, dy: -1 }, { dx: 1, dy: -1 });
    if (piece.color === "black") dirs.push({ dx: -1, dy: 1 }, { dx: 1, dy: 1 });
  }

  for (const { dx, dy } of dirs) {
    const nx = piece.x + dx;
    const ny = piece.y + dy;
    if (!inBoard(nx, ny)) continue;
    if (pieceAt(nx, ny)) continue;
    moves.push({ x: nx, y: ny });
  }

  return moves;
}

function getCaptureMovesLocal(piece) {
  const moves = [];
  const at = (x, y) => state.pieces.find(p => p.x === x && p.y === y) || null;

  const dirs = [
    { dx: 1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: -1, dy: -1 },
  ];

  if (piece.king) {
    for (const { dx, dy } of dirs) {
      let x = piece.x + dx;
      let y = piece.y + dy;
      let enemy = null;

      while (inBoard(x, y)) {
        const occ = at(x, y);

        if (!occ) {
          if (enemy) {
            moves.push({ x, y, capturedId: enemy.id });
          }
        } else {
          if (occ.color === piece.color) break;
          if (enemy) break;
          enemy = occ;
        }

        x += dx;
        y += dy;
      }
    }
    return moves;
  }

  for (const { dx, dy } of dirs) {
    const midX = piece.x + dx;
    const midY = piece.y + dy;
    const landX = piece.x + 2 * dx;
    const landY = piece.y + 2 * dy;

    if (!inBoard(midX, midY) || !inBoard(landX, landY)) continue;

    const middle = at(midX, midY);
    const landing = at(landX, landY);

    if (middle && middle.color !== piece.color && !landing) {
      moves.push({ x: landX, y: landY, capturedId: middle.id });
    }
  }

  return moves;
}


function handlePieceClick(piece) {
  if (state.status !== "ongoing") return;
  if (!myColor.value) return;

  if (piece.color !== myColor.value) return;
  if (!isMyTurn.value) return;
  if (state.forcedPieceId && piece.id !== state.forcedPieceId) return;

  if (selectedPiece.value?.id === piece.id) {
    if (state.forcedPieceId && piece.id === state.forcedPieceId) {
      return;
    }

    selectedPiece.value = null;
    state.validMoves = [];
    return;
  }


  selectedPiece.value = piece;

  const caps = getCaptureMovesLocal(piece);
  if (caps.length > 0) {
    state.validMoves = caps;
  } else {
    if (piece.king) {
      state.validMoves = getKingSlideMoves(piece);
    } else {
      state.validMoves = getSimpleMoves(piece).map(m => ({ ...m, capturedId: null }));
    }
  }

}

async function handleSquareClick(pos) {
  if (state.status !== "ongoing") return;
  if (!selectedPiece.value) return;
  if (!myColor.value) return;
  if (!isMyTurn.value) return;

  const move = state.validMoves.find(m => m.x === pos.x && m.y === pos.y);
  if (!move) return;

  const from = { x: selectedPiece.value.x, y: selectedPiece.value.y };
  const to = { x: pos.x, y: pos.y };
  const user = getLoggedUserOrNull();
  
  try {
    await socketMove({
      gameId: state.gameId,
      pieceId: selectedPiece.value.id,
      from,
      to,
      capturedId: move.capturedId ?? null,
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
        const playersArray = Array.isArray(game?.players) ? game.players : [];
        const myIndex = playersArray.findIndex(p => String(p?.userId) === String(me.id));
        
        if (myIndex !== -1) {
          const updatedGame = await socketJoinGame({
            gameId: gameIdFromUrl,
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
    console.error("Init socket checkers error:", e);
  }
});

function requestRematch() {
  const me = getLoggedUserOrNull();
  if (!me?.id) return;

  console.log("[REMATCH] emit checkers:rematchReady", { gameId: state.gameId, userId: me.id });

  socket.emit("checkers:rematchReady", { gameId: state.gameId, userId: me.id }, (resp) => {
    console.log("[REMATCH] ACK", resp);
    if (!resp?.ok) alert(resp?.error || "Nie udało się zgłosić rematchu");
  });
}

function exitToHome() {
  router.push("/");
}

</script>

<style scoped>
.end-modal-backdrop{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  display: grid;
  place-items: center;
  z-index: 9999;
}

.end-modal{
  width: 420px;
  background: #1f1f1f;
  border: 2px solid #444;
  border-radius: 10px;
  padding: 18px;
  color: #f5f5f5;
}

.end-title{
  margin: 0 0 14px;
  font-size: 20px;
  font-weight: 800;
}

.end-actions{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.end-btn{
  padding: 10px 14px;
  border-radius: 8px;
  border: 2px solid #f5f5f5;
  background: #262626;
  color: #f5f5f5;
  font-weight: 700;
  cursor: pointer;
}

.end-btn.primary{
  background: #2f2f2f;
}

.rematch-box{
  display: grid;
  gap: 6px;
  justify-items: center;
}

.rematch-count{
  font-size: 12px;
  opacity: 0.85;
}
.end-btn:disabled{
  opacity: 0.45;
  cursor: not-allowed;
}
.end-subtitle{
  margin: 0 0 14px;
  opacity: 0.9;
  font-size: 14px;
}

</style>