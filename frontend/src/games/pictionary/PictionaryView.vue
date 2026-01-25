<template>
  <div class="pictionary-page">
    <div class="title">
      <span>Kalambury: {{ roomName || `Pokój #${state.gameId?.slice(-6) || ''}` }}</span>
    </div>

    <section class="play-row">
      <div id="board-area">
        <PictionaryBoard
          :is-drawer="isDrawer"
          :word-to-draw="state.currentWord"
          :drawer-name="drawerName"
          :round-start-time="state.roundStartTime"
          :round-duration="state.roundDuration"
          :canvas-data="state.canvas"
          @draw="handleDraw"
          @clear="handleClear"
          @skip="handleSkip"
        />
      </div>

      <div id="side-panel">
        <RoomChat game-key="pictionary" :game-id="state.gameId" />
      </div>
    </section>

    <section class="players-section">
      <h3>Gracze</h3>
      <div class="players-list">
        <div
          v-for="(player, index) in state.players"
          :key="player?.userId || index"
          class="player-card"
          :class="{ 'is-drawer': index === state.currentDrawerIndex, 'is-me': isMyPlayer(player) }"
        >
          <div class="player-name">
            {{ player?.username || 'Oczekiwanie...' }}
            <span v-if="index === state.currentDrawerIndex" class="drawer-badge">Rysuje</span>
          </div>
          <div class="player-score">{{ getPlayerScore(player?.userId) }} pkt</div>
        </div>

        <div
          v-for="i in emptySlots"
          :key="`empty-${i}`"
          class="player-card empty"
        >
          <div class="player-name">Oczekiwanie na gracza...</div>
          <button v-if="!myPlayerIndex && state.players.length < state.maxPlayers" class="join-btn" @click="handleJoin">
            Dołącz
          </button>
        </div>
      </div>
    </section>

    <section v-if="!isDrawer" class="guess-section">
      <h3>Zgadnij słowo</h3>
      <div class="guess-input-group">
        <input
          v-model="guessInput"
          class="guess-input"
          type="text"
          placeholder="Wpisz swoje zgadywanie..."
          @keydown.enter="submitGuess"
          :disabled="myPlayerIndex === null"
        />
        <button class="guess-btn" @click="submitGuess" :disabled="!guessInput.trim() || myPlayerIndex === null">
          Zgadnij
        </button>
      </div>
    </section>

    <section class="guesses-section">
      <h3>Ostatnie zgadywania</h3>
      <div class="guesses-list">
        <div
          v-for="(guess, i) in recentGuesses"
          :key="i"
          class="guess-item"
          :class="{ correct: guess.correct }"
        >
          <span class="guess-username">{{ guess.username }}:</span>
          <span class="guess-text">{{ guess.correct ? '✓ Zgadł!' : guess.guess }}</span>
        </div>
        <div v-if="recentGuesses.length === 0" class="empty-guesses">
          Brak zgadywań
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PictionaryBoard from '@/components/pictionary/PictionaryBoard.vue';
import RoomChat from '@/components/common/RoomChat.vue';
import socket from '@/services/socket';

const route = useRoute();
const router = useRouter();

const roomName = ref('');
const guessInput = ref('');

const state = reactive({
  gameId: null,
  players: [],
  maxPlayers: 8,
  minPlayers: 2,
  currentDrawerIndex: 0,
  currentWord: '',
  canvas: [],
  guesses: [],
  scores: {},
  roundStartTime: Date.now(),
  roundDuration: 60000,
  status: 'waiting',
});

function getLoggedUserOrNull() {
  try {
    const raw = localStorage.getItem('user');
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

const isDrawer = computed(() => {
  return myPlayerIndex.value === state.currentDrawerIndex;
});

const drawerName = computed(() => {
  const drawer = state.players[state.currentDrawerIndex];
  return drawer?.username || 'Gracz';
});

const emptySlots = computed(() => {
  return Math.max(0, state.maxPlayers - state.players.length);
});

const recentGuesses = computed(() => {
  return [...state.guesses].reverse().slice(0, 10);
});

function isMyPlayer(player) {
  const me = myUser.value;
  if (!me?.id || !player?.userId) return false;
  return String(player.userId) === String(me.id);
}

function getPlayerScore(userId) {
  if (!userId) return 0;
  return state.scores[userId] || 0;
}

function applyGame(game) {
  console.log('[PICTIONARY] applyGame, canvas length:', game?.canvas?.length);
  state.gameId = game?.id ?? null;
  roomName.value = game?.roomName || '';
  state.players = Array.isArray(game?.players) ? game.players : [];
  state.maxPlayers = game?.maxPlayers || 8;
  state.minPlayers = game?.minPlayers || 2;
  state.currentDrawerIndex = game?.currentDrawerIndex ?? 0;
  state.currentWord = game?.currentWord || '';
  state.canvas = game?.canvas || [];
  state.guesses = game?.guesses || [];
  state.scores = game?.scores || {};
  state.roundStartTime = game?.roundStartTime || Date.now();
  state.roundDuration = game?.roundDuration || 60000;
  state.status = game?.status || 'waiting';
}

function setupSocketListeners() {
  socket.off('pictionary:state');
  socket.on('pictionary:state', (game) => {
    console.log('[PICTIONARY] pictionary:state received', game);
    applyGame(game);
  });

  socket.off('pictionary:canvasUpdate');
  socket.on('pictionary:canvasUpdate', ({ canvas, drawData }) => {
    if (!isDrawer.value) {
      state.canvas = canvas;
    }
  });
}

function socketCreateGame() {
  return new Promise((resolve, reject) => {
    socket.emit('pictionary:createGame', {}, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || 'createGame failed'));
      resolve(resp.game);
    });
  });
}

function socketWatchGame(gameId) {
  return new Promise((resolve, reject) => {
    socket.emit('pictionary:watchGame', { gameId }, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || 'watchGame failed'));
      resolve(resp.game);
    });
  });
}

function socketJoinGame({ gameId, username, userId }) {
  return new Promise((resolve, reject) => {
    socket.emit('pictionary:joinGame', { gameId, username, userId }, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || 'joinGame failed'));
      resolve(resp.game);
    });
  });
}

async function handleJoin() {
  const user = getLoggedUserOrNull();
  if (!user?.id || !user?.username) {
    alert('Musisz być zalogowany, żeby dołączyć do gry.');
    return;
  }

  const realGameId = route.query.gameId || state.gameId;
  if (!realGameId) {
    alert('Brak ID gry (odśwież stronę).');
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
    alert(e.message || 'Nie udało się dołączyć');
  }
}

function handleDraw(drawData) {
  const user = getLoggedUserOrNull();
  if (!user?.id) return;

  socket.emit('pictionary:draw', {
    gameId: state.gameId,
    drawData,
    userId: user.id,
  }, (resp) => {
    if (!resp?.ok) {
      console.error('Błąd rysowania:', resp?.error);
    }
  });
}

function handleClear() {
  const user = getLoggedUserOrNull();
  if (!user?.id) return;

  socket.emit('pictionary:clearCanvas', {
    gameId: state.gameId,
    userId: user.id,
  }, (resp) => {
    if (!resp?.ok) {
      console.error('Błąd czyszczenia:', resp?.error);
    }
  });
}

function handleSkip() {
  const user = getLoggedUserOrNull();
  if (!user?.id) return;

  socket.emit('pictionary:skipRound', {
    gameId: state.gameId,
    userId: user.id,
  }, (resp) => {
    if (!resp?.ok) {
      alert(resp?.error || 'Nie udało się pominąć rundy');
    }
  });
}

function submitGuess() {
  if (!guessInput.value.trim()) return;

  const user = getLoggedUserOrNull();
  if (!user?.id) return;

  socket.emit('pictionary:guess', {
    gameId: state.gameId,
    guessWord: guessInput.value.trim(),
    userId: user.id,
  }, (resp) => {
    if (!resp?.ok) {
      alert(resp?.error || 'Nie udało się wysłać zgadywania');
      return;
    }

    if (resp.correct) {
      guessInput.value = '';
    } else {
      guessInput.value = '';
    }
  });
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
    console.error('Init socket pictionary error:', e);
  }
});
</script>

<style scoped>
.pictionary-page {
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
  width: 1200px;
  margin: 0 auto 16px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: center;
}

#board-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

#side-panel {
  width: 300px;
  height: 600px;
  background: var(--bg-color);
  border: 2px solid var(--border-color-dimmed);
  flex-shrink: 0;
  overflow: hidden;
}

.players-section {
  width: 1200px;
  margin: 24px auto 0;
}

.players-section h3 {
  margin: 0 0 12px;
  font-size: 1.1rem;
  color: var(--font-color);
}

.players-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.player-card {
  background: var(--bg-color);
  border: 2px solid var(--border-color-dimmed);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.3s ease;
}

.player-card.is-drawer {
  border-color: var(--active-item);
  background: rgba(66, 184, 131, 0.1);
}

.player-card.is-me {
  border-color: #ffa500;
}

.player-card.empty {
  opacity: 0.6;
  border-style: dashed;
}

.player-name {
  font-weight: 700;
  font-size: 1rem;
  color: var(--font-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-badge {
  background: var(--active-item);
  color: #000;
  padding: 2px 8px;
  font-size: 0.75rem;
  border-radius: 4px;
  font-weight: 800;
}

.player-score {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--active-item);
}

.join-btn {
  padding: 8px 12px;
  border: 2px solid var(--border-color-dimmed);
  background: var(--bg-color);
  color: var(--font-color);
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
  font-family: 'JetBrains Mono', monospace;
}

.join-btn:hover {
  border-color: var(--active-item);
  color: var(--active-item);
}

.guess-section {
  width: 1200px;
  margin: 24px auto 0;
}

.guess-section h3 {
  margin: 0 0 12px;
  font-size: 1.1rem;
  color: var(--font-color);
}

.guess-input-group {
  display: flex;
  gap: 12px;
}

.guess-input {
  flex: 1;
  padding: 12px;
  border: 2px solid var(--border-color-dimmed);
  background: var(--form-input-bg-color);
  color: var(--font-color);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
  font-family: 'JetBrains Mono', monospace;
}

.guess-input:focus {
  border-color: var(--active-item);
}

.guess-input::placeholder {
  color: var(--form-input-placeholder);
}

.guess-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.guess-btn {
  padding: 12px 24px;
  border: 2px solid var(--border-color-dimmed);
  background: var(--bg-color);
  color: var(--font-color);
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
  font-family: 'JetBrains Mono', monospace;
}

.guess-btn:hover:not(:disabled) {
  border-color: var(--active-item);
  color: var(--active-item);
}

.guess-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.guesses-section {
  width: 1200px;
  margin: 24px auto 48px;
}

.guesses-section h3 {
  margin: 0 0 12px;
  font-size: 1.1rem;
  color: var(--font-color);
}

.guesses-list {
  border: 2px solid var(--border-color-dimmed);
  background: var(--bg-app-color);
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
}

.guess-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color-dimmed);
  color: var(--font-color);
}

.guess-item:last-child {
  border-bottom: none;
}

.guess-item.correct {
  color: var(--active-item);
  font-weight: 700;
}

.guess-username {
  font-weight: 600;
  margin-right: 8px;
}

.empty-guesses {
  padding: 18px;
  text-align: center;
  opacity: 0.6;
  color: var(--font-color);
}
</style>
