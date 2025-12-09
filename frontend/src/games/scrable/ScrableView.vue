<!-- src/games/scrable/ScrableView.vue -->
<template>
  <GameLayout
    :score="score"
    :moves="moves"
    :game-id="gameId"
    @join="handleJoin"
  >
    <template #board>
      <div class="scrable-board-wrapper">
        <ScrableBoard />
        <ScrableRack />
      </div>
    </template>
  </GameLayout>
</template>

<script setup>
import { ref, reactive } from "vue";
import GameLayout from "@/games/GameLayout.vue";
import ScrableBoard from "@/components/scrable/ScrableBoard.vue";
import ScrableRack from "@/components/scrable/ScrableRack.vue";

const gameId = ref("scrable-001");

const score = reactive({
  left: 0,
  right: 0,
});

const moves = ref([]);

function handleJoin({ side }) {
}
</script>

<style scoped>
.scrable-board-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
</style>
