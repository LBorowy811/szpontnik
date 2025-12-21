<template>
  <BaseBoard
    :rows="8"
    :cols="8"
    :labels="labels"
    :pieces="usedPieces"
    @piece-click="onPieceClick"
    @square-click="onSquareClick"
  >
    <template #piece="{ piece }">
      <Piece
        :color="piece.color"
        :selected="selectedPiece && selectedPiece.id === piece.id"
        :king="piece.king"
       />
    </template>

  </BaseBoard>
</template>

<script setup>
import { computed } from "vue";
import BaseBoard from "@/components/common/BaseBoard.vue";
import Piece from "@/components/checkers/Piece.vue";
import { makeCheckersStartPieces } from "@/components/checkers/checkersStartPieces.js";

const props = defineProps({
  pieces: { type: Array, default: null },
  selectedPiece: { type: Object, default: null },
});

const emit = defineEmits(["piece-click", "square-click"]);

const labels = {
  cols: ["1", "2", "3", "4", "5", "6", "7", "8"],
  rows: ["1", "2", "3", "4", "5", "6", "7", "8"],
};

const usedPieces = computed(() => {
  if (!props.pieces || props.pieces.length === 0) {
    return makeCheckersStartPieces();
  }
  return props.pieces;
});

function onPieceClick(p) {
  emit("piece-click", p);
}

function onSquareClick(pos) {
  emit("square-click", pos); //x i y
}
</script>

<style scoped>
</style>
