<template>
  <section class="play-row" id="play-row">
    <div id="board-area">
      <slot name="board" />
    </div>
    <ChatPanel
      id="chat"
      :messages="messages"
      @send="onSend"
    />
  </section>

  <section class="playersJoinInfo" id="players">
    <div class="players-grid">
      <div id="Player1" class="player-slot">
        <div class="slot-photo"></div>
        <div class="slot-meta">
          <div class="slot-name">(wolne miejsce)</div>
          <button class="slot-join" type="button" @click="onJoin('left')">Dołącz</button>
        </div>
      </div>

      <div class="score">
        {{ score.left }} : {{ score.right }}
      </div>

      <div id="Player2" class="player-slot">
        <div class="slot-photo"></div>
        <div class="slot-meta">
          <div class="slot-name">(wolne miejsce)</div>
          <button class="slot-join" type="button" @click="onJoin('right')">Dołącz</button>
        </div>
      </div>
    </div>
  </section>

  <section class="movesLog" id="moves-log">
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
          <tr v-for="(m, i) in moves" :key="m.id ?? i">
            <td>{{ i + 1 }}</td>
            <td>{{ m.player }}</td>
            <td>{{ m.from.x }},{{ m.from.y }}</td>
            <td>{{ m.to.x }},{{ m.to.y }}</td>
            <td>{{ m.type }}</td>
            <td>{{ m.time }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import ChatPanel from '@/components/checkers/ChatPanel.vue'

const props = defineProps({
  messages: { type: Array, required: true },
  score: { type: Object, required: true },
  moves: { type: Array, required: true }, 
  gameId: { type: [String, Number], required: false }
})

const emit = defineEmits(['send', 'join'])

function onSend(payload) {
  emit('send', payload) 
}

function onJoin(side) {
  emit('join', { side, gameId: props.gameId || null })
}
</script>

<style scoped>

.play-row{
  width: 1150px;
  margin: 0 auto 16px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: center;
}

.playersJoinInfo{
  width: 950px;
  margin: 24px auto 0;
}

.players-grid{
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  column-gap: 48px;
  align-items: center;
}

.player-slot{
  display: flex;
  align-items: center;
  gap: 16px;
  width: 360px;
  height: 150px;
  margin: 0 auto;
  background: #fff;
  border: 3px solid #333;
  border-radius: 8px;
  padding: 12px;
}
.slot-photo{
  width: 140px;
  height: 110px;
  border: 3px solid #333;
  border-radius: 6px;
  background: #f3f3f3;
  flex-shrink: 0;
}
.slot-meta{
  display: grid;
  align-content: start;
  gap: 12px;
  width: 100%;
}
.slot-name{
  padding: 8px 10px;
  font-weight: 600;
  min-height: 38px;
  background: #fff;
}
.slot-join{
  align-self: start;
  padding: 8px 14px;
  font-weight: 600;
  border: 3px solid #333;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.slot-join:hover{ background: #f5f5f5; }

.score{
  min-width: 100px;
  height: 80px;
  background: #fff;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 28px;
  letter-spacing: 2px;
}
.movesLog{
  width: 820px;
  margin: 24px auto 48px;
}
.movesLog h3{ margin: 0 0 12px; font-size: 1.1rem; }
.moves-table-wrap{
  border: 3px solid #333;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  max-height: 220px;
  display: grid;
}
.moves-table{
  border-collapse: collapse;
  width: 100%;
  font-size: 0.95rem;
}
.moves-table thead th{
  position: sticky;
  top: 0;
  background: #eee;
  border-bottom: 2px solid #333;
  text-align: left;
  padding: 10px 12px;
}
.moves-table tbody td{
  padding: 8px 12px;
  border-bottom: 1px solid #e6e6e6;
  white-space: nowrap;
}
.moves-table tbody tr:nth-child(even){ background: #fafafa; }
</style>
