<template>
    <div class="dice-page">
      <div class="title">
        <span>Gra: {{ roomName || `Pokój #${state.gameId?.slice(-6) || ''}` }}</span>
      </div>
  
      <!-- Panel gotowości -->
      <div v-if="state.status === 'waiting'" class="ready-panel">
        <h3>Oczekiwanie na graczy</h3>
        <div class="players-ready-list">
          <div 
            v-for="(player, index) in state.players" 
            :key="player?.userId || index"
            class="player-ready-item"
          >
            <span>{{ player?.username || 'Wolne miejsce' }}</span>
            <span v-if="player && state.playersReady?.[player.userId]" class="ready-badge">✓ Gotowy</span>
            <span v-else-if="player" class="not-ready-badge">Oczekuje...</span>
          </div>
        </div>
        <button 
          v-if="myPlayerIndex !== null && !state.playersReady?.[myUser?.id]"
          @click="setReady(true)"
          class="ready-btn"
        >
          Gotowy
        </button>
        <button 
          v-if="myPlayerIndex !== null && state.playersReady?.[myUser?.id]"
          @click="setReady(false)"
          class="ready-btn cancel"
        >
          Anuluj gotowość
        </button>
        <p v-if="canStart" class="start-info">Wszyscy gracze gotowi - gra rozpocznie się automatycznie!</p>
      </div>
  
      <!-- Gra -->
      <div v-if="state.status === 'ongoing' || state.status === 'finished'" class="game-container">
        <!-- Tabela punktacji - lewa strona -->
        <section class="score-section">
          <div class="score-table-container">
            <table class="score-table">
              <thead>
                <tr>
                  <th>Kategoria</th>
                  <th v-for="(player, index) in state.players" :key="index">
                    {{ player?.username || `Gracz ${index + 1}` }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <!-- Górna część -->
                <tr class="section-header">
                  <td :colspan="state.players.length + 1"><strong>Górna część</strong></td>
                </tr>
                <tr 
                  v-for="cat in upperCategories" 
                  :key="cat.key"
                  :class="{ 'clickable': isMyTurn && state.status === 'ongoing' && state.currentRoll > 0 && !isCategoryUsed(cat.key, 'upper') }"
                  @click="selectCategory(cat.key, 'upper')"
                >
                  <td>{{ cat.label }}</td>
                  <td 
                    v-for="(player, index) in state.players" 
                    :key="index"
                  >
                    <template v-if="index === myPlayerIndex && isMyTurn && state.status === 'ongoing' && state.currentRoll > 0 && !isCategoryUsed(cat.key, 'upper')">
                      {{ calculatePossibleScore(cat.key, 'upper') }}
                    </template>
                    <template v-else>
                      {{ getCategoryScore(player?.userId, cat.key, 'upper') ?? '' }}
                    </template>
                  </td>
                </tr>
                <tr class="bonus-row">
                  <td>Premia (≥63)</td>
                  <td v-for="(player, index) in state.players" :key="index">
                    {{ getPlayerScore(player?.userId)?.upperBonus || 0 }}
                  </td>
                </tr>
                <tr class="section-header">
                  <td :colspan="state.players.length + 1"><strong>Dolna część</strong></td>
                </tr>
                <tr 
                  v-for="cat in lowerCategories" 
                  :key="cat.key"
                  :class="{ 'clickable': isMyTurn && state.status === 'ongoing' && state.currentRoll > 0 && !isCategoryUsed(cat.key, 'lower') }"
                  @click="selectCategory(cat.key, 'lower')"
                >
                  <td>{{ cat.label }}</td>
                  <td 
                    v-for="(player, index) in state.players" 
                    :key="index"
                  >
                    <template v-if="index === myPlayerIndex && isMyTurn && state.status === 'ongoing' && state.currentRoll > 0 && !isCategoryUsed(cat.key, 'lower')">
                      {{ calculatePossibleScore(cat.key, 'lower') }}
                    </template>
                    <template v-else>
                      {{ getCategoryScore(player?.userId, cat.key, 'lower') ?? '' }}
                    </template>
                  </td>
                </tr>
                <tr class="total-row">
                  <td><strong>SUMA</strong></td>
                  <td 
                    v-for="(player, index) in state.players" 
                    :key="index"
                    class="total-score"
                  >
                    <strong>{{ getTotalScore(player?.userId) }}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Pole do rzucania kostkami - środek -->
        <section class="dice-section">
          <div class="dice-container">
            <h3>Runda {{ state.currentRound }}/13</h3>
            <div v-if="state.status === 'ongoing'" class="turn-info">
              <p>Tura gracza: <strong>{{ currentPlayerName }}</strong></p>
              <p>Rzut {{ state.currentRoll }}/3</p>
            </div>
            
            <div class="dice-area">
              <Dice
                v-for="(die, index) in state.currentDice"
                :key="index"
                :value="die"
                :kept="keptDiceIndices.includes(index)"
                @click="toggleKeepDie(index)"
              />
            </div>
            
            <div class="dice-actions" v-if="isMyTurn && state.status === 'ongoing'">
              <button 
                v-if="state.currentRoll < 3"
                @click="rollDice"
                :disabled="isRolling"
                class="action-btn"
              >
                {{ state.currentRoll === 0 ? 'Rzuć kostkami' : 'Rzuć ponownie' }}
              </button>
              <button 
                v-if="state.currentRoll > 0"
                @click="resetRoll"
                class="action-btn secondary"
              >
                Resetuj wybór
              </button>
            </div>
          </div>
        </section>

        <!-- Chat - prawa strona -->
        <section class="chat-section">
          <RoomChat game-key="dice" :game-id="state.gameId" />
        </section>
      </div>
  
      <!-- Modal końca gry -->
      <div v-if="state.status === 'finished'" class="end-modal-backdrop">
        <div class="end-modal">
          <h2 class="end-title">Koniec gry</h2>
          <div class="final-scores">
            <h3>Wyniki końcowe:</h3>
            <div 
              v-for="(player, index) in state.players" 
              :key="index"
              class="final-score-item"
              :class="{ 'winner': index === state.winnerIndex }"
            >
              {{ player?.username || `Gracz ${index + 1}` }}: {{ getTotalScore(player?.userId) }} pkt
              <span v-if="index === state.winnerIndex" class="winner-badge">🏆 Zwycięzca</span>
            </div>
          </div>
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
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import RoomChat from "@/components/common/RoomChat.vue";
  import Dice from "@/games/dice/Dice.vue";
  import socket from "@/services/socket";
  
  const route = useRoute();
  const router = useRouter();
  
  const roomName = ref("");
  const keptDiceIndices = ref([]);
  const isRolling = ref(false);
  
  const state = reactive({
    gameId: null,
    minPlayers: 2,
    maxPlayers: 4,
    players: [],
    scores: {},
    currentPlayerIndex: 0,
    currentRound: 1,
    currentRoll: 0,
    currentDice: [],
    keptDice: [],
    playersReady: {},
    status: 'waiting',
    winnerIndex: null,
    winner: null,
    rematchCount: 0,
  });
  
  const upperCategories = [
    { key: 'ones', label: 'Jedynki' },
    { key: 'twos', label: 'Dwójki' },
    { key: 'threes', label: 'Trójki' },
    { key: 'fours', label: 'Czwórki' },
    { key: 'fives', label: 'Piątki' },
    { key: 'sixes', label: 'Szóstki' },
  ];
  
  const lowerCategories = [
    { key: 'threeOfAKind', label: 'Trzy jednakowe' },
    { key: 'fourOfAKind', label: 'Cztery jednakowe' },
    { key: 'fullHouse', label: 'Ful' },
    { key: 'smallStraight', label: 'Mały strit' },
    { key: 'largeStraight', label: 'Duży strit' },
    { key: 'yahtzee', label: 'Generał' },
    { key: 'chance', label: 'Szansa' },
  ];
  
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
      if (String(state.players[i]?.userId) === String(me.id)) {
        return i;
      }
    }
    return null;
  });
  
  const isMyTurn = computed(() => {
    if (myPlayerIndex.value === null) return false;
    return state.currentPlayerIndex === myPlayerIndex.value;
  });
  
  const currentPlayerName = computed(() => {
    const player = state.players[state.currentPlayerIndex];
    return player?.username || `Gracz ${state.currentPlayerIndex + 1}`;
  });
  
  const canStart = computed(() => {
    if (state.status !== 'waiting') return false;
    if (state.players.length < state.minPlayers) return false;
    return state.players.every(p => state.playersReady?.[p.userId] === true);
  });
  
  function getPlayerScore(userId) {
    return state.scores[userId] || null;
  }
  
  function getCategoryScore(userId, category, type) {
    const score = getPlayerScore(userId);
    if (!score) return null;
    
    if (type === 'upper') {
      return score.upper[category];
    } else {
      return score.lower[category];
    }
  }
  
  function getTotalScore(userId) {
    const score = getPlayerScore(userId);
    if (!score) return 0;
    
    const upperSum = Object.values(score.upper).reduce((a, b) => a + (b || 0), 0);
    const lowerSum = Object.values(score.lower).reduce((a, b) => a + (b || 0), 0);
    return upperSum + score.upperBonus + lowerSum + (score.yahtzeeBonus || 0);
  }
  
  function isCategoryUsed(category, type) {
    const me = myUser.value;
    if (!me?.id) return true;
    
    const score = getPlayerScore(me.id);
    if (!score) return false;
    
    if (type === 'upper') {
      return score.upper[category] !== null;
    } else {
      return score.lower[category] !== null;
    }
  }
  
  // Funkcja obliczająca możliwe punkty dla kategorii
  function calculatePossibleScore(category, type) {
    if (!Array.isArray(state.currentDice) || state.currentDice.length === 0) return 0;
    
    const dice = state.currentDice;
    
    if (type === 'upper') {
      const categoryIndex = upperCategories.findIndex(c => c.key === category);
      if (categoryIndex === -1) return 0;
      
      const targetValue = categoryIndex + 1;
      return dice.filter(d => d === targetValue).length * targetValue;
    } else {
      // Dolna część
      const counts = [0, 0, 0, 0, 0, 0];
      dice.forEach(d => {
        if (d >= 1 && d <= 6) counts[d - 1]++;
      });
      const sorted = [...counts].sort((a, b) => b - a);
      const sum = dice.reduce((a, b) => a + b, 0);
      
      switch (category) {
        case 'threeOfAKind':
          return sorted[0] >= 3 ? sum : 0;
        case 'fourOfAKind':
          return sorted[0] >= 4 ? sum : 0;
        case 'fullHouse':
          return (sorted[0] === 3 && sorted[1] === 2) ? 25 : 0;
        case 'smallStraight':
          const has1234 = counts[0] > 0 && counts[1] > 0 && counts[2] > 0 && counts[3] > 0;
          const has2345 = counts[1] > 0 && counts[2] > 0 && counts[3] > 0 && counts[4] > 0;
          const has3456 = counts[2] > 0 && counts[3] > 0 && counts[4] > 0 && counts[5] > 0;
          return (has1234 || has2345 || has3456) ? 30 : 0;
        case 'largeStraight':
          const has12345 = counts[0] > 0 && counts[1] > 0 && counts[2] > 0 && counts[3] > 0 && counts[4] > 0;
          const has23456 = counts[1] > 0 && counts[2] > 0 && counts[3] > 0 && counts[4] > 0 && counts[5] > 0;
          return (has12345 || has23456) ? 40 : 0;
        case 'yahtzee':
          return sorted[0] === 5 ? 50 : 0;
        case 'chance':
          return sum;
        default:
          return 0;
      }
    }
  }
  
  function toggleKeepDie(index) {
    if (!isMyTurn.value || state.status !== 'ongoing' || state.currentRoll === 0) return;
    
    const idx = keptDiceIndices.value.indexOf(index);
    if (idx === -1) {
      keptDiceIndices.value.push(index);
    } else {
      keptDiceIndices.value.splice(idx, 1);
    }
  }
  
  function resetRoll() {
    keptDiceIndices.value = [];
  }
  
  async function rollDice() {
    if (!isMyTurn.value || isRolling.value) return;
    
    isRolling.value = true;
    const user = getLoggedUserOrNull();
    
    // Zapamiętaj wartości zaznaczonych kostek
    const keptValues = keptDiceIndices.value.map(idx => state.currentDice[idx]).filter(v => v !== undefined);
    
    try {
      await socketMove({
        action: 'roll',
        gameId: state.gameId,
        userId: user?.id,
        keepIndices: keptDiceIndices.value,
      });
      
      // Po rzucie, zmapuj zachowane kostki na nowe pozycje
      // Backend zwraca currentDice z zachowanymi kostkami na początku
      if (keptValues.length > 0 && Array.isArray(state.currentDice)) {
        // Zachowane kostki są na początku currentDice
        const newKeptIndices = [];
        for (let i = 0; i < keptValues.length && i < state.currentDice.length; i++) {
          if (state.currentDice[i] === keptValues[i]) {
            newKeptIndices.push(i);
          }
        }
        // Jeśli wartości się nie zgadzają (co może się zdarzyć), spróbuj znaleźć je w całej tablicy
        if (newKeptIndices.length < keptValues.length) {
          newKeptIndices.length = 0;
          keptValues.forEach(val => {
            const foundIdx = state.currentDice.findIndex((d, idx) => d === val && !newKeptIndices.includes(idx));
            if (foundIdx !== -1) {
              newKeptIndices.push(foundIdx);
            }
          });
        }
        keptDiceIndices.value = newKeptIndices;
      } else {
        keptDiceIndices.value = [];
      }
    } catch (e) {
      alert(e.message || "Nie udało się rzucić kostkami");
    } finally {
      isRolling.value = false;
    }
  }
  
  async function selectCategory(category, type) {
    if (!isMyTurn.value || state.status !== 'ongoing' || state.currentRoll === 0) return;
    if (isCategoryUsed(category, type)) return;
    
    const user = getLoggedUserOrNull();
    
    try {
      await socketMove({
        action: 'selectCategory',
        gameId: state.gameId,
        userId: user?.id,
        category: type === 'upper' ? category : category,
      });
      keptDiceIndices.value = [];
    } catch (e) {
      alert(e.message || "Nie udało się wybrać kategorii");
    }
  }
  
  async function setReady(ready) {
    const user = getLoggedUserOrNull();
    if (!user?.id) return;
    
    try {
      await socketMove({
        action: 'setReady',
        gameId: state.gameId,
        userId: user.id,
        ready: ready,
      });
    } catch (e) {
      alert(e.message || "Nie udało się ustawić gotowości");
    }
  }
  
  function applyGame(game) {
    state.gameId = game?.id ?? null;
    roomName.value = game?.roomName || "";
    
    state.players = Array.isArray(game?.players) ? game.players : [];
    state.scores = game?.scores || {};
    state.currentPlayerIndex = game?.currentPlayerIndex ?? 0;
    state.currentRound = game?.currentRound ?? 1;
    state.currentRoll = game?.currentRoll ?? 0;
    state.currentDice = Array.isArray(game?.currentDice) ? game.currentDice : [];
    state.keptDice = Array.isArray(game?.keptDice) ? game.keptDice : [];
    state.playersReady = game?.playersReady || {};
    state.status = game?.status || 'waiting';
    state.winnerIndex = game?.winnerIndex ?? null;
    state.winner = game?.winner ?? null;
    state.minPlayers = game?.minPlayers ?? 2;
    state.maxPlayers = game?.maxPlayers ?? 4;
    
    const ready = game?.rematchReady;
    state.rematchCount = ready ? Object.keys(ready).length : 0;
  }
  
  function setupSocketListeners() {
    socket.off("dice:state");
    socket.on("dice:state", (game) => {
      applyGame(game);
    });
    
    socket.off("dice:rematchStatus");
    socket.on("dice:rematchStatus", (payload) => {
      if (String(payload?.gameId) !== String(state.gameId)) return;
      state.rematchCount = payload?.count ?? state.rematchCount;
    });
    
    socket.off("dice:rematchStarted");
    socket.on("dice:rematchStarted", async ({ newGameId }) => {
      if (!newGameId) return;
      
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
      socket.emit("dice:createGame", {}, (resp) => {
        if (!resp?.ok) return reject(new Error(resp?.error || "createGame failed"));
        resolve(resp.game);
      });
    });
  }
  
  function socketWatchGame(gameId) {
    return new Promise((resolve, reject) => {
      socket.emit("dice:watchGame", { gameId }, (resp) => {
        if (!resp?.ok) return reject(new Error(resp?.error || "watchGame failed"));
        resolve(resp.game);
      });
    });
  }
  
  function socketJoinGame({ gameId, username, userId }) {
    return new Promise((resolve, reject) => {
      socket.emit("dice:joinGame", { gameId, username, userId }, (resp) => {
        if (!resp?.ok) return reject(new Error(resp?.error || "joinGame failed"));
        resolve(resp.game);
      });
    });
  }
  
  function socketMove(payload) {
    return new Promise((resolve, reject) => {
      socket.emit("dice:move", payload, (resp) => {
        if (!resp?.ok) return reject(new Error(resp?.error || "move failed"));
        resolve(resp.data);
      });
    });
  }
  
  function requestRematch() {
    const me = getLoggedUserOrNull();
    if (!me?.id) return;
    
    socket.emit("dice:rematchReady", { gameId: state.gameId, userId: me.id }, (resp) => {
      if (!resp?.ok) alert(resp?.error || "Nie udało się zgłosić rematchu");
    });
  }
  
  function exitToHome() {
    router.push("/");
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
          
          // Automatycznie dołącz jeśli gracz nie jest w grze i gra czeka
          if (myIndex === -1 && game.status === 'waiting') {
            const updatedGame = await socketJoinGame({
              gameId: gameIdFromUrl,
              username: me.username,
              userId: me.id,
            });
            applyGame(updatedGame);
          } else if (myIndex !== -1) {
            // Aktualizuj socketId jeśli już jest w grze
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
      console.error("Init socket dice error:", e);
    }
  });
  
  onUnmounted(() => {
    socket.off("dice:state");
    socket.off("dice:rematchStatus");
    socket.off("dice:rematchStarted");
  });
  </script>
  
  <style scoped>
  .dice-page {
    color: var(--font-color);
    padding: 1rem;
  }
  
  .title {
    border: 2px solid var(--border-color-dimmed);
    display: flex;
    margin: 1rem;
    justify-content: center;
    font-size: 1.2rem;
    padding: 10px;
    color: var(--font-color);
    transition: border-color 0.3s ease, color 0.3s ease;
    cursor: default;
  }
  
  .ready-panel {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
    border: 2px solid var(--border-color-dimmed);
    background: var(--bg-color);
    border-radius: 8px;
  }
  
  .players-ready-list {
    margin: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .player-ready-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    background: var(--bg-app-color);
    border-radius: 4px;
  }
  
  .ready-badge {
    color: green;
  }
  
  .not-ready-badge {
    color: orange;
  }
  
  .ready-btn {
    padding: 10px 20px;
    border: 2px solid var(--border-color-dimmed);
    background: var(--bg-color);
    color: var(--font-color);
    cursor: pointer;
    font-family: "JetBrains Mono", monospace;
    margin-top: 1rem;
  }
  
  .ready-btn:hover {
    border-color: var(--active-item);
    color: var(--active-item);
  }
  
  .ready-btn.cancel {
    background: var(--bg-app-color);
  }
  
  .start-info {
    margin-top: 1rem;
    color: green;
    font-weight: bold;
  }
  
  /* Główny kontener z trzema kolumnami */
  .game-container {
    display: flex;
    gap: 24px;
    max-width: 1400px;
    margin: 2rem auto;
    align-items: flex-start;
    justify-content: center;
  }
  
  /* Tabela punktacji - lewa kolumna */
  .score-section {
    flex: 0 0 400px;
    min-width: 0;
  }
  
  .score-table-container {
    overflow-x: auto;
    overflow-y: auto;
    max-height: 700px;
    border: 2px solid var(--border-color-dimmed);
    border-radius: 8px;
    background: var(--bg-color);
  }
  
  .score-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }
  
  .score-table th {
    padding: 10px 8px;
    text-align: left;
    background: var(--bg-app-color);
    border-bottom: 2px solid var(--border-color-dimmed);
    font-size: 0.8rem;
  }
  
  .score-table td {
    padding: 8px;
    border-bottom: 1px solid var(--border-color-dimmed);
    font-size: 0.8rem;
  }
  
  .score-table tbody tr:nth-child(even) {
    background: var(--bg-app-color);
  }
  
  .score-table tbody tr.clickable {
    cursor: pointer;
  }
  
  .score-table tbody tr.clickable:hover {
    background: var(--active-item);
    opacity: 0.8;
  }
  
  .score-table tbody tr.clickable td {
    font-weight: bold;
  }
  
  .section-header td {
    background: var(--bg-color);
    font-weight: bold;
    padding: 10px 8px;
  }
  
  .bonus-row td {
    font-style: italic;
  }
  
  .total-row td {
    background: var(--bg-app-color);
    font-weight: bold;
    font-size: 0.95rem;
  }
  
  .total-score {
    font-size: 1rem;
  }
  
  /* Pole do rzucania kostkami - środkowa kolumna */
  .dice-section {
    flex: 1;
    display: flex;
    justify-content: center;
    min-width: 0;
  }
  
  .dice-container {
    width: 100%;
    max-width: 500px;
    padding: 2rem;
    border: 2px solid var(--border-color-dimmed);
    background: var(--bg-color);
    border-radius: 8px;
  }
  
  .turn-info {
    margin: 1rem 0;
    text-align: center;
  }
  
  .dice-area {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin: 2rem 0;
    flex-wrap: wrap;
  }
  
  .dice-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1rem;
  }
  
  .action-btn {
    padding: 10px 20px;
    border: 2px solid var(--border-color-dimmed);
    background: var(--bg-color);
    color: var(--font-color);
    cursor: pointer;
    font-family: "JetBrains Mono", monospace;
  }
  
  .action-btn:hover:not(:disabled) {
    border-color: var(--active-item);
    color: var(--active-item);
  }
  
  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .action-btn.secondary {
    background: var(--bg-app-color);
  }
  
  /* Chat - prawa kolumna */
  .chat-section {
    flex: 0 0 320px;
    min-width: 0;
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
    width: 500px;
    background: var(--bg-color);
    border: 2px solid var(--border-color-dimmed);
    padding: 24px;
    color: var(--font-color);
    border-radius: 8px;
  }
  
  .end-title {
    margin: 0 0 20px;
    font-size: 24px;
    font-weight: 800;
  }
  
  .final-scores {
    margin: 20px 0;
  }
  
  .final-score-item {
    padding: 10px;
    margin: 5px 0;
    background: var(--bg-app-color);
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .final-score-item.winner {
    background: var(--active-item);
    font-weight: bold;
  }
  
  .winner-badge {
    font-size: 1.2rem;
  }
  
  .end-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 20px;
  }
  
  .end-btn {
    padding: 10px 14px;
    border: 2px solid var(--border-color-dimmed);
    background: var(--bg-color);
    color: var(--font-color);
    font-weight: 700;
    cursor: pointer;
    transition: border-color 0.3s ease, color 0.3s ease;
    font-family: "JetBrains Mono", monospace;
  }
  
  .end-btn:hover:not(:disabled) {
    border-color: red;
    color: red;
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
  }
  
  .end-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  </style>