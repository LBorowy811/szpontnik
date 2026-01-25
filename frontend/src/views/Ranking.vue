<template>
  <div class="ranking-page">
    <div class="title">
      <span>Ranking wygranych</span>
    </div>

    <div class="tabs">
      <button
        v-for="game in games"
        :key="game.key"
        class="tab-btn"
        :class="{ active: activeGame === game.key }"
        @click="selectGame(game.key)"
      >
        {{ game.label }}
      </button>
    </div>

    <div class="table">
      <div class="thead">
        <div class="col pos">#</div>
        <div class="col player">Gracz</div>
        <div class="col wins">Wygrane</div>
        <div class="col losses">Przegrane</div>
        <div class="col draws">Remisy</div>
        <div class="col ratio">%</div>
      </div>

      <div v-if="loading" class="empty">
        Wczytywanie...
      </div>

      <div v-else-if="ranking.length === 0" class="empty">
        Brak danych dla tej gry.
      </div>

      <div v-else v-for="(player, index) in ranking" :key="player.username" class="row">
        <div class="col pos">{{ index + 1 }}</div>
        <div class="col player">{{ player.username }}</div>
        <div class="col wins">{{ player.wins }}</div>
        <div class="col losses">{{ player.losses }}</div>
        <div class="col draws">{{ player.draws }}</div>
        <div class="col ratio">{{ player.win_percentage }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const games = [
  { key: 'dice', label: 'Kości' },
  { key: 'checkers', label: 'Warcaby' },
  { key: 'tictactoe', label: 'Kółko i krzyżyk' },
];

const activeGame = ref('dice');
const ranking = ref([]);
const loading = ref(false);

const API_URL = `http://${window.location.hostname}:3000`;

async function fetchRanking(gameType) {
  loading.value = true;
  try {
    const response = await axios.get(`${API_URL}/api/ranking/${gameType}`, {
      withCredentials: true
    });
    ranking.value = response.data.ranking || [];
  } catch (error) {
    console.error('Błąd pobierania rankingu:', error);
    ranking.value = [];
  } finally {
    loading.value = false;
  }
}

function selectGame(gameKey) {
  activeGame.value = gameKey;
  fetchRanking(gameKey);
}

onMounted(() => {
  fetchRanking(activeGame.value);
});
</script>

<style scoped>
.ranking-page {
  color: var(--font-color);
  font-size: 1.2rem;
}

.title {
  border: 2px solid var(--border-color-dimmed);
  display: flex;
  margin: 1rem;
  justify-content: center;
  padding: 10px;
  color: var(--border-color-dimmed);
  transition: border-color 0.3s ease, color 0.3s ease;
  cursor: default;
}

.tabs {
  display: flex;
  gap: 10px;
  margin: 1rem;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 10px 16px;
  border: 2px solid var(--border-color-dimmed);
  background: var(--bg-color);
  color: var(--font-color);
  font-family: "JetBrains Mono";
  font-size: 1rem;
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
}

.tab-btn:hover {
  border-color: var(--active-item);
  color: var(--active-item);
}

.tab-btn.active {
  border-color: var(--active-item);
  color: var(--active-item);
  background: rgba(66, 184, 131, 0.1);
}

.table {
  margin: 1rem;
  border: 2px solid var(--border-color-dimmed);
  overflow: hidden;
  background: var(--bg-color);
  transition: border-color 0.3s ease;
}

.table:hover {
  border-color: var(--font-color);
}

.thead, .row {
  display: grid;
  grid-template-columns: 60px 1fr 100px 100px 100px 80px;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
}

.thead {
  background: var(--bg-app-color);
  color: var(--font-color);
  font-weight: 700;
}

.row {
  border-top: 1px solid var(--border-color-dimmed);
  transition: background-color 0.2s ease;
}

.row:hover {
  background-color: rgba(66, 184, 131, 0.05);
}

.row:first-of-type {
  background-color: rgba(255, 215, 0, 0.1);
}

.row:nth-of-type(2) {
  background-color: rgba(192, 192, 192, 0.1);
}

.row:nth-of-type(3) {
  background-color: rgba(205, 127, 50, 0.1);
}

.col.pos {
  font-weight: 700;
  text-align: center;
}

.col.wins {
  color: var(--active-item);
  font-weight: 600;
}

.col.losses {
  color: #ff6b6b;
  font-weight: 600;
}

.col.draws {
  color: var(--font-color);
  opacity: 0.7;
}

.col.ratio {
  font-weight: 700;
}

.empty {
  padding: 18px 14px;
  opacity: 0.85;
  color: var(--font-color);
  text-align: center;
}
</style>
