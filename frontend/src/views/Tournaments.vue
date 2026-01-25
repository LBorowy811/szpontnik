<template>
  <div class="tournaments">
    <div class="title">
      <span>Turnieje</span>
    </div>

    <!-- Przyciski wyboru gry -->
    <div class="game-selector">
      <button 
        v-for="game in availableGames" 
        :key="game.type"
        @click="selectedGame = game.type"
        :class="{ active: selectedGame === game.type }"
        class="game-btn"
      >
        {{ game.name }}
      </button>
      <button @click="showCreateModal = true" class="create-btn">
        Utwórz turniej
      </button>
    </div>

    <!-- Lista turniejów -->
    <div class="tournament-list">
      <div 
        v-for="tournament in filteredTournaments" 
        :key="tournament.id"
        class="tournament-card"
        @click="openTournament(tournament)"
      >
        <div class="tournament-header">
          <h3>{{ tournament.name }}</h3>
          <span class="status" :class="tournament.status">
            {{ getStatusLabel(tournament.status) }}
          </span>
        </div>
        <div class="tournament-info">
          <p>Gra: {{ getGameName(tournament.gameType) }}</p>
          <p>Gracze: {{ tournament.players.length }}/{{ tournament.maxPlayers }}</p>
          <p>Utworzono: {{ formatDate(tournament.createdAt) }}</p>
        </div>
      </div>
      
      <div v-if="filteredTournaments.length === 0" class="no-tournaments">
        Brak turniejów dla wybranej gry
      </div>
    </div>

    <!-- Modal tworzenia turnieju -->
    <div v-if="showCreateModal" class="modal-backdrop" @click="showCreateModal = false">
      <div class="modal" @click.stop>
        <h2>Utwórz nowy turniej</h2>
        <form @submit.prevent="createNewTournament">
          <div class="form-group">
            <label>Nazwa turnieju:</label>
            <input v-model="newTournament.name" required />
          </div>
          <div class="form-group">
            <label>Gra:</label>
            <select v-model="newTournament.gameType" required>
              <option v-for="game in availableGames" :key="game.type" :value="game.type">
                {{ game.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Liczba graczy:</label>
            <select v-model="newTournament.maxPlayers" required>
              <option :value="4">4 (półfinały + finał)</option>
              <option :value="8">8 (ćwierćfinały + półfinały + finał)</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" @click="showCreateModal = false" class="cancel-btn">Anuluj</button>
            <button type="submit" class="submit-btn">Utwórz</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import socket from '@/services/socket';
import { createTournament, listTournaments } from '@/services/tournamentService';

const router = useRouter();

const selectedGame = ref('checkers');
const tournaments = ref([]);
const showCreateModal = ref(false);
const newTournament = ref({
  name: '',
  gameType: 'checkers',
  maxPlayers: 4
});

const availableGames = [
  { type: 'checkers', name: 'Warcaby' },
  { type: 'tictactoe', name: 'Kółko i krzyżyk' },
  { type: 'chinczyk', name: 'Chińczyk' }
];

const filteredTournaments = computed(() => {
  return tournaments.value.filter(t => t.gameType === selectedGame.value);
});

function getGameName(type) {
  return availableGames.find(g => g.type === type)?.name || type;
}

function getStatusLabel(status) {
  const labels = {
    waiting: 'Oczekiwanie',
    in_progress: 'W trakcie',
    finished: 'Zakończony'
  };
  return labels[status] || status;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('pl-PL', { 
    day: '2-digit', 
    month: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

async function loadTournaments() {
  try {
    tournaments.value = await listTournaments();
  } catch (e) {
    console.error('Błąd ładowania turniejów:', e);
  }
}

async function createNewTournament() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      alert('Musisz być zalogowany');
      return;
    }

    await createTournament({
      name: newTournament.value.name,
      gameType: newTournament.value.gameType,
      userId: user.id,
      username: user.username,
      maxPlayers: newTournament.value.maxPlayers
    });

    showCreateModal.value = false;
    newTournament.value = { name: '', gameType: 'checkers', maxPlayers: 4 };
    await loadTournaments();
  } catch (e) {
    alert(e.message);
  }
}

function openTournament(tournament) {
  router.push({ 
    name: 'TournamentBracket', 
    params: { id: tournament.id } 
  });
}

onMounted(() => {
  loadTournaments();
  
  // Nasłuchuj aktualizacji listy turniejów
  socket.on('tournament:list', (data) => {
    if (data.ok) {
      tournaments.value = data.tournaments;
    }
  });
});

onUnmounted(() => {
  socket.off('tournament:list');
});
</script>

<style scoped>
.tournaments {
  padding: 1rem;
}

.title {
  border: 2px solid var(--border-color-dimmed);
  display: flex;
  margin-bottom: 1rem;
  justify-content: center;
  font-size: 1.2rem;
  padding: 10px;
  color: var(--border-color);
  transition: border-color 0.3s ease, color 0.3s ease;
}

.game-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.game-btn, .create-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--border-color-dimmed);
  background-color: var(--bg-color);
  color: var(--font-color);
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'JetBrains Mono';
  font-size: 1rem;
}

.game-btn:hover, .create-btn:hover {
  border-color: var(--active-item);
  color: var(--active-item);
}

.game-btn.active {
  background-color: var(--active-item);
  color: white;
  border-color: var(--active-item);
}

.create-btn {
  margin-left: auto;
  background-color: var(--active-item);
  color: white;
  border-color: var(--active-item);
}

.tournament-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.tournament-card {
  border: 2px solid var(--border-color-dimmed);
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: var(--bg-color);
}

.tournament-card:hover {
  border-color: var(--active-item);
  transform: translateY(-3px);
}

.tournament-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.tournament-header h3 {
  margin: 0;
  color: var(--font-color);
  font-size: 1.1rem;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status.waiting {
  background-color: #fbbf24;
  color: #000;
}

.status.in_progress {
  background-color: #3b82f6;
  color: white;
}

.status.finished {
  background-color: #10b981;
  color: white;
}

.tournament-info p {
  margin: 0.25rem 0;
  color: var(--font-color);
  font-size: 0.9rem;
}

.no-tournaments {
  grid-column: 1 / -1;
  text-align: center;
  padding: 2rem;
  color: var(--border-color-dimmed);
  font-size: 1.1rem;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: var(--bg-color);
  border: 2px solid var(--border-color);
  padding: 2rem;
  min-width: 400px;
  max-width: 500px;
}

.modal h2 {
  margin-top: 0;
  color: var(--font-color);
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--font-color);
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid var(--border-color-dimmed);
  background-color: var(--bg-color);
  color: var(--font-color);
  font-family: 'JetBrains Mono';
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--active-item);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.cancel-btn, .submit-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--border-color);
  background-color: var(--bg-color);
  color: var(--font-color);
  cursor: pointer;
  font-family: 'JetBrains Mono';
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.submit-btn {
  background-color: var(--active-item);
  color: white;
  border-color: var(--active-item);
}

.submit-btn:hover {
  opacity: 0.9;
}
</style>