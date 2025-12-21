<template>
  <div class="tile" :class="sizeClass">
    <span class="tile-letter">{{ letter }}</span>
    <span class="tile-score">{{ score }}</span>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  letter: { type: String, required: true },
  score: { type: Number, required: true },
  size: { type: String, default: "board" },
});

const sizeClass = computed(() =>
  props.size === "rack" ? "tile--rack" : "tile--board"
);
</script>

<style scoped>
.tile {
  position: relative;
  background: #f6e4b6;
  border-radius: 6px;
  border: 2px solid #c5aa73;
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "JetBrains Mono", monospace;
  user-select: none;
}

.tile--board {
  width: 85%;
  height: 85%;
  font-size: 1.2rem;
}

.tile--rack {
  width: 56px;
  height: 56px;
  font-size: 1.4rem;
}

.tile-letter {
  font-weight: 700;
}

.tile-score {
  position: absolute;
  right: 4px;
  bottom: 2px;
  font-size: 0.7rem;
  font-weight: 600;
}
</style>
