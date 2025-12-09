<template>
  <section class="play-row" id="play-row">
    <div id="board-area">
      <slot name="board" />
    </div>

    <!--miejsce na chat zamiast tego diva side-panel/lub w nim-->
    <div id="side-panel">
      <slot name="side"></slot>
    </div>
  </section>

  <section class="playersJoinInfo" id="players">
    <div class="players-grid">
      <div id="Player1" class="player-slot">
        <div class="slot-photo"></div>
        <div class="slot-meta">
          <div class="slot-name">wolne miejsve</div>
          <button class="slot-join" type="button" @click="onJoin('left')">
            Dolacz
          </button>
        </div>
      </div>

      <div class="score">
        {{ score.left }} : {{ score.right }}
      </div>

      <div id="Player2" class="player-slot">
        <div class="slot-photo"></div>
        <div class="slot-meta">
          <div class="slot-name">wolne miejsve</div>
          <button class="slot-join" type="button" @click="onJoin('right')">
            Dolacz
          </button>
        </div>
      </div>
    </div>
  </section>

  <section class="movesLog" id="moves-log">
    <h3>{{ isScrable ? 'Punktacja' : 'Ostatnie ruchy' }}</h3>

    <slot name="moves">
      <div class="moves-table-wrap">
        <table class="moves-table">
          <thead>
            <tr v-if="isScrable">
              <th>#</th>
              <th>Gracz</th>
              <th>Słowo</th>
              <th>Punkty</th>
              <th>Czas</th>
            </tr>

            <tr v-else>
              <th>#</th>
              <th>Gracz</th>
              <th>Z</th>
              <th>Do</th>
              <th>Typ</th>
              <th>Czas</th>
            </tr>
          </thead>

          <tbody>
            <template v-if="isScrable">
              <tr v-for="(m, i) in moves" :key="m.id ?? i">
                <td>{{ i + 1 }}</td>
                <td>{{ m.player }}</td>
                <td>{{ m.word }}</td>
                <td>{{ m.points }}</td>
                <td>{{ m.time }}</td>
              </tr>
            </template>

            <template v-else>
              <tr v-for="(m, i) in moves" :key="m.id ?? i">
                <td>{{ m.id ?? (moves.length+ i + 1) }}</td>
                <td>{{ formatPlayer(m) }}</td>
                <td>{{ formatCoords(m.from) }}</td>
                <td>{{ formatCoords(m.to) }}</td>
                <td>{{ defaultMoveType(m) }}</td>
                <td>{{ formatTime(m.time) }}</td>
              </tr>
            </template>

          </tbody>
        </table>
      </div>
    </slot>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  score: { type: Object, required: true },
  moves: { type: Array, required: true },
  gameId: { type: [String, Number], required: false },
})

const emit = defineEmits(['join'])

function onJoin(side) {
  emit('join', { side, gameId: props.gameId || null })
}

const isScrable = computed(() => {
  const id = (props.gameId ?? '').toString().toLowerCase()
  return id.includes('scrable') || id.includes('literaki')
})


function formatCoords(pos) {
  if (!pos) return ''
  return `${pos.x},${pos.y}`
}

function formatPlayer(m) {
  if (m.player) return m.player
  if (m.playerName) return m.playerName

  if (m.playerColor === 'white') return 'Białe'
  if (m.playerColor === 'black') return 'Czarne'
  return ''
}

function defaultMoveType(m) {
  if (m.type) return m.type
  return m.capturedId ? 'bicie' : 'ruch'
}

function formatTime(time) {
  if (!time) return ''
  const d = new Date(time)
  if (Number.isNaN(d.getTime())) {
    return time
  }
  return d.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

</script>

<style scoped>
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
}

#side-panel {
  width: 260px;
  min-height: 200px;
  background: black;
  border-radius: 8px;
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

.score {
  min-width: 100px;
  height: 80px;
  background: #1f1f1f;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 28px;
  letter-spacing: 2px;
  color: #f5f5f5;
  border-radius: 8px;
  border: 2px solid #444;
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
</style>
