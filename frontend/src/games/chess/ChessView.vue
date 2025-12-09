<template>
  <GameLayout
    :score="score"
    :moves="moves"
    :game-id="gameId"
    @join="handleJoin"
  >
    <template #board>
      <BoardChess />
    </template>
  </GameLayout>
</template>

<script setup>
import { ref, reactive } from "vue";
import GameLayout from "@/games/GameLayout.vue";
import BoardChess from "@/components/chess/BoardChess.vue";

const gameId = ref("chess-001");

const score = reactive({
  left: 0,
  right: 0,
});

const moves = ref([]);

function handleJoin({ side }) {
}
</script>
