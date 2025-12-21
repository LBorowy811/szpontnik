<template>
  <div class="rack-wrapper">
    <div class="rack">
      <ScrableTile
        v-for="tile in rackTiles"
        :key="tile.id"
        :letter="tile.letter"
        :score="tile.score"
        size="rack"
      />
    </div>
  </div>
</template>

<script setup>
import ScrableTile from "@/components/scrable/ScrableTile.vue";

const rackTiles = [
  { id: 1, letter: "A", score: 1 },
  { id: 2, letter: "A", score: 1 },
  { id: 3, letter: "S", score: 1 },
  { id: 4, letter: "Z", score: 1 },
  { id: 5, letter: "Ś", score: 5 },
  { id: 6, letter: "T", score: 2 },
  { id: 7, letter: "I", score: 1 },
];
</script>

<style scoped>
.rack-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.rack {
  background: #c3a26c;
  padding: 10px 18px;
  border-radius: 10px;
  display: flex;
  gap: 8px;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.4);
}
</style>
