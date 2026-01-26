<template>
  <div class="tournament-bracket">
    <div class="header">
      <h1>{{ tournament?.name }}</h1>
      <div class="status-badge" :class="tournament?.status">
        {{ getStatusLabel(tournament?.status) }}
      </div>
    </div>

    <div class="tournament-info">
      <p><strong>Gra:</strong> {{ getGameName(tournament?.gameType) }}</p>
      <p><strong>Gracze:</strong> {{ tournament?.players.length }}/{{ tournament?.maxPlayers }}</p>
      <p v-if="tournament?.winner"><strong>Zwycięzca:</strong> {{ tournament.winner.username }}</p>
    </div>

    <!-- Przyciski akcji -->
    <div class="actions" v-if="tournament">
      <button 
        v-if="canStart"
        @click="handleStart"
        class="start-btn"
      >
        Rozpocznij turniej
      </button>
      <button 
        v-if="canJoin"
        @click="handleJoin"
        class="join-btn"
      >
        Dołącz do turnieju
      </button>
      <button @click="goBack" class="back-btn">
        Powrót do listy
      </button>
    </div>

    <!-- Drabinka turniejowa -->
    <div class="bracket" v-if="tournament?.bracket">
      <!-- Ćwierćfinały (jeśli są) -->
      <div v-if="tournament.bracket.quarterfinals" class="round">
        <h2>Ćwierćfinały</h2>
        <div class="matches">
          <div 
            v-for="match in tournament.bracket.quarterfinals" 
            :key="match.id"
            class="match-card"
            :class="{ 
              finished: match.status === 'finished',
              'in-progress': match.status === 'in_progress'
            }"
          >
            <div class="match-header">
              <span class="match-id">{{ getMatchLabel(match.id) }}</span>
              <span class="match-status">{{ getStatusLabel(match.status) }}</span>
            </div>
            <div class="players">
              <div 
                v-for="(player, idx) in match.players" 
                :key="idx"
                class="player"
                :class="{ winner: match.winner?.userId === player?.userId }"
              >
                {{ player?.username || 'Oczekiwanie...' }}
              </div>
            </div>
            <button 
              v-if="match.status === 'waiting' && match.players.length === 2"
              @click="startMatch(match)"
              class="match-btn"
            >
              Rozpocznij mecz
            </button>
            <button 
              v-if="match.gameId && match.status === 'in_progress'"
              @click="watchMatch(match)"
              class="match-btn"
            >
              Oglądaj mecz
            </button>
          </div>
        </div>
      </div>

      <!-- Półfinały -->
      <div v-if="tournament.bracket.semifinals" class="round">
        <h2>Półfinały</h2>
        <div class="matches">
          <div 
            v-for="match in tournament.bracket.semifinals" 
            :key="match.id"
            class="match-card"
            :class="{ 
              finished: match.status === 'finished',
              'in-progress': match.status === 'in_progress'
            }"
          >
            <div class="match-header">
              <span class="match-id">{{ getMatchLabel(match.id) }}</span>
              <span class="match-status">{{ getStatusLabel(match.status) }}</span>
            </div>
            <div class="players">
              <div 
                v-for="(player, idx) in match.players" 
                :key="idx"
                class="player"
                :class="{ winner: match.winner?.userId === player?.userId }"
              >
                {{ player?.username || 'Oczekiwanie...' }}
              </div>
            </div>
            <button 
              v-if="match.status === 'waiting' && match.players.length === 2"
              @click="startMatch(match)"
              class="match-btn"
            >
              Rozpocznij mecz
            </button>
            <button 
              v-if="match.gameId && match.status === 'in_progress'"
              @click="watchMatch(match)"
              class="match-btn"
            >
              Oglądaj mecz
            </button>
          </div>
        </div>
      </div>

      <!-- Finał -->
      <div v-if="tournament.bracket.final" class="round final-round">
        <h2>Finał</h2>
        <div class="matches">
          <div 
            class="match-card final-match"
            :class="{ 
              finished: tournament.bracket.final.status === 'finished',
              'in-progress': tournament.bracket.final.status === 'in_progress'
            }"
          >
            <div class="match-header">
              <span class="match-id">Finał</span>
              <span class="match-status">{{ getStatusLabel(tournament.bracket.final.status) }}</span>
            </div>
            <div class="players">
              <div 
                v-for="(player, idx) in tournament.bracket.final.players" 
                :key="idx"
                class="player"
                :class="{ winner: tournament.bracket.final.winner?.userId === player?.userId }"
              >
                {{ player?.username || 'Oczekiwanie...' }}
              </div>
            </div>
            <button 
              v-if="tournament.bracket.final.status === 'waiting' && tournament.bracket.final.players.length === 2"
              @click="startMatch(tournament.bracket.final)"
              class="match-btn"
            >
              Rozpocznij finał
            </button>
            <button 
              v-if="tournament.bracket.final.gameId && tournament.bracket.final.status === 'in_progress'"
              @click="watchMatch(tournament.bracket.final)"
              class="match-btn"
            >
              Oglądaj finał
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import socket from '@/services/socket';
import { getTournament, joinTournament, startTournament, createMatchGame } from '@/services/tournamentService';

const route = useRoute();
const router = useRouter();

const tournament = ref(null);
const user = ref(null);

const availableGames = {
  checkers: 'Warcaby',
  tictactoe: 'Kółko i krzyżyk',
  chinczyk: 'Chińczyk'
};

const canStart = computed(() => {
  if (!tournament.value || !user.value) return false;
  return tournament.value.creatorId === user.value.id && 
         tournament.value.status === 'waiting' &&
         tournament.value.players.length === tournament.value.maxPlayers;
});

const canJoin = computed(() => {
  if (!tournament.value || !user.value) return false;
  const isInTournament = tournament.value.players.some(p => p.userId === user.value.id);
  return !isInTournament && 
         tournament.value.status === 'waiting' &&
         tournament.value.players.length < tournament.value.maxPlayers;
});

function getGameName(type) {
  return availableGames[type] || type;
}

function getStatusLabel(status) {
  const labels = {
    waiting: 'Oczekiwanie',
    in_progress: 'W trakcie',
    finished: 'Zakończony'
  };
  return labels[status] || status;
}

function getMatchLabel(matchId) {
  const labels = {
    qf1: 'Ćwierćfinał 1',
    qf2: 'Ćwierćfinał 2',
    qf3: 'Ćwierćfinał 3',
    qf4: 'Ćwierćfinał 4',
    sf1: 'Półfinał 1',
    sf2: 'Półfinał 2',
    final: 'Finał'
  };
  return labels[matchId] || matchId;
}

async function loadTournament() {
  try {
    tournament.value = await getTournament(route.params.id);
  } catch (e) {
    console.error('Błąd ładowania turnieju:', e);
    alert(e.message);
  }
}

async function handleJoin() {
  try {
    if (!user.value) {
      alert('Musisz być zalogowany');
      return;
    }

    await joinTournament({
      tournamentId: route.params.id,
      userId: user.value.id,
      username: user.value.username
    });

    await loadTournament();
  } catch (e) {
    alert(e.message);
  }
}

async function handleStart() {
  try {
    if (!user.value) return;

    await startTournament({
      tournamentId: route.params.id,
      userId: user.value.id
    });

    await loadTournament();
  } catch (e) {
    alert(e.message);
  }
}

async function startMatch(match) {
  try {
    console.log('[TOURNAMENT] startMatch called', { matchId: match.id, gameId: match.gameId });
    
    if (!match.gameId) {
      console.log('[TOURNAMENT] Creating match game...');
      const result = await createMatchGame({
        tournamentId: route.params.id,
        matchId: match.id
      });
      
      console.log('[TOURNAMENT] Match game created', result);
      
      await loadTournament();
      
      const updatedMatch = findMatchById(match.id);
      if (!updatedMatch || !updatedMatch.gameId) {
        throw new Error('Nie udało się utworzyć gry dla meczu');
      }
      match = updatedMatch;
      
      console.log('[TOURNAMENT] Updated match', match);
    }

    const gameRoutes = {
      checkers: 'Checkers',
      tictactoe: 'TicTacToe',
      chinczyk: 'Chinczyk'
    };

    const routeName = gameRoutes[tournament.value.gameType];
    if (!routeName) {
      throw new Error('Nieobsługiwana gra');
    }

    console.log('[TOURNAMENT] Redirecting to game', {
      routeName,
      gameId: match.gameId,
      tournament: route.params.id,
      match: match.id
    });

    router.push({
      name: routeName,
      query: { 
        gameId: match.gameId,
        tournament: route.params.id,
        matchId: match.id
      }
    });
  } catch (e) {
    console.error('[TOURNAMENT] Error starting match:', e);
    alert(e.message);
  }
}

function findMatchById(matchId) {
  const bracket = tournament.value.bracket;
  
  if (bracket.quarterfinals) {
    const qf = bracket.quarterfinals.find(m => m.id === matchId);
    if (qf) return qf;
  }
  
  if (bracket.semifinals) {
    const sf = bracket.semifinals.find(m => m.id === matchId);
    if (sf) return sf;
  }
  
  if (bracket.final && bracket.final.id === matchId) {
    return bracket.final;
  }
  
  return null;
}

function watchMatch(match) {
  startMatch(match);
}

function goBack() {
  router.push({ name: 'Tournaments' });
}

onMounted(() => {
  const userData = localStorage.getItem('user');
  if (userData) {
    user.value = JSON.parse(userData);
  }

  loadTournament();

  socket.on('tournament:update', (updatedTournament) => {
    if (updatedTournament.id === route.params.id) {
      tournament.value = updatedTournament;
    }
  });
});

onUnmounted(() => {
  socket.off('tournament:update');
});
</script>

<style scoped>
.tournament-bracket {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border-color-dimmed);
}

.header h1 {
  margin: 0;
  color: var(--font-color);
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
}

.status-badge.waiting {
  background-color: #fbbf24;
  color: #000;
}

.status-badge.in_progress {
  background-color: #3b82f6;
  color: white;
}

.status-badge.finished {
  background-color: #10b981;
  color: white;
}

.tournament-info {
  margin-bottom: 1.5rem;
}

.tournament-info p {
  margin: 0.5rem 0;
  color: var(--font-color);
}

.actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.start-btn, .join-btn, .back-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--border-color);
  background-color: var(--bg-color);
  color: var(--font-color);
  cursor: pointer;
  font-family: 'JetBrains Mono';
  transition: all 0.3s ease;
}

.start-btn {
  background-color: var(--active-item);
  color: white;
  border-color: var(--active-item);
}

.join-btn {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.start-btn:hover, .join-btn:hover, .back-btn:hover {
  opacity: 0.8;
}

.bracket {
  display: flex;
  gap: 2rem;
  overflow-x: auto;
  padding: 1rem 0;
}

.round {
  flex: 1;
  min-width: 300px;
}

.round h2 {
  color: var(--font-color);
  margin-bottom: 1rem;
  text-align: center;
  font-size: 1.3rem;
}

.matches {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.match-card {
  border: 2px solid var(--border-color-dimmed);
  padding: 1rem;
  background-color: var(--bg-color);
  transition: all 0.3s ease;
}

.match-card.in-progress {
  border-color: #3b82f6;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}

.match-card.finished {
  border-color: #10b981;
}

.match-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color-dimmed);
}

.match-id {
  font-weight: 600;
  color: var(--font-color);
}

.match-status {
  font-size: 0.85rem;
  color: var(--border-color);
}

.players {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.player {
  padding: 0.5rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-left: 3px solid transparent;
  color: var(--font-color);
}

.player.winner {
  border-left-color: #10b981;
  background-color: rgba(16, 185, 129, 0.1);
  font-weight: 600;
}

.match-btn {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid var(--active-item);
  background-color: var(--active-item);
  color: white;
  cursor: pointer;
  font-family: 'JetBrains Mono';
  transition: all 0.3s ease;
}

.match-btn:hover {
  opacity: 0.8;
}

.final-round {
  border-left: 3px solid #fbbf24;
  padding-left: 1.5rem;
}

.final-match {
  border-color: #fbbf24;
  box-shadow: 0 0 15px rgba(251, 191, 36, 0.3);
}
</style>
