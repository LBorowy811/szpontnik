<template>
  <GameLayout
    :messages="messages"
    :score="score"
    :moves="moves"
    :game-id="gameId"
    @send="handleChatSend"
    @join="handleJoin"
  >
    <template #board>
      <BoardChess :pieces="pieces" @pieceClick="handlePieceClick" />
    </template>

  </GameLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import GameLayout from '@/components/common/GameLayout.vue'
import BoardChess from '@/components/chess/BoardChess.vue'
import { makeChessStartPieces } from '@/components/chess/chessStartPieces.js'


const gameId = ref('chess-001')
const messages = ref([])
const score = reactive({ left: 0, right: 0 })
const moves = ref([])
const pieces = ref(makeChessStartPieces())

function handleChatSend(payload){
  messages.value.push({ id: Date.now(), author: 'Ja', text: payload.text, time: payload.time })
}
function handleJoin({ side }){
}
function handlePieceClick(piece) {
  console.log('Kliknięta figura:', piece)
}
</script>
