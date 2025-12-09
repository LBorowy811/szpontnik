<template>
  <BaseBoard
    :rows="8"
    :cols="8"
    :labels="labels"
    :pieces="usedPieces"
    @pieceClick="onPieceClick"
  >
    <template #piece="{ piece }">
      <ChessPiece :piece="piece" />
    </template>
  </BaseBoard>
</template>

<script setup>
import { computed } from "vue";
import BaseBoard from "@/components/common/BaseBoard.vue";
import ChessPiece from "@/components/chess/ChessPiece.vue";
import { makeChessStartPieces } from "./chessStartPieces";

const props = defineProps({
  pieces: { type: Array, default: null },
});

const emit = defineEmits(["pieceClick", "movePiece"]);

const labels = {
  cols: ["A", "B", "C", "D", "E", "F", "G", "H"],
  rows: ["1", "2", "3", "4", "5", "6", "7", "8"],
};

const usedPieces = computed(() => props.pieces ?? makeChessStartPieces());

function onPieceClick(p) {
  emit("pieceClick", p);
}
</script>
