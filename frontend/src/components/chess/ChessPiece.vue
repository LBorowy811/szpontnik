<template>
  <span class="symbol" :class="colorClass">
    {{ symbol }}
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  piece: {
    type: Object,
    required: true,
  },
});

const symbolsMap = {
  p: "♟",
  r: "♜",
  n: "♞",
  b: "♝",
  q: "♛",
  k: "♚",
};

const symbol = computed(() => symbolsMap[props.piece.type] ?? "?");

const colorClass = computed(() =>
  props.piece.color === "white" ? "whitePiece" : "blackPiece"
);
</script>

<style scoped>
.symbol {
  font-size: 2.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  cursor: pointer;
}

.whitePiece {
  color: #ffffff;
}

.blackPiece {
  color: #111111;
}
</style>
