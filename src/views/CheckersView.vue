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
      <BoardCheckers />
    </template>
  </GameLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import GameLayout from '@/components/common/GameLayout.vue'
import BoardCheckers from '@/components/checkers/BoardCheckers.vue'

const gameId = ref('checkers-001')
const messages = ref([])
const score = reactive({ left: 0, right: 0 })
const moves = ref([])

function handleChatSend(payload){
  messages.value.push({ id: Date.now(), author: 'Ja', text: payload.text, time: payload.time })
}
function handleJoin({ side }){
}
</script>
