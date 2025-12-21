<template>
  <div class="board-wrap">
    <div class="board">
      <!--pola-->
      <template v-for="y in rows" :key="'r-' + y">
        <SquareBase
          v-for="x in cols"
          :key="'c-' + y + '-' + x"
          :x="x - 1"
          :y="y - 1"
          @click="onSquareClick(x - 1, y - 1)"
        />
      </template>
      <div class="pieces-layer">
        <div
          v-for="p in pieces"
          :key="p.id"
          class="piece-cell"
          :style="{ gridColumn: p.x + 1, gridRow: p.y + 1 }"
          @click.stop="onPieceClick(p)"
        >
          <slot name="piece" :piece="p" />
        </div>
      </div>
    </div>

    <!--oznaczenia kolumn-->
    <div
      v-for="(label, i) in labels.cols"
      :key="'col-' + i"
      class="label-col"
      :style="{ left: ((i + 0.5) * (100 / cols)) + '%' }"
    >
      {{ label }}
    </div>

    <!--wierszy-->
    <div
      v-for="(label, i) in labels.rows"
      :key="'row-' + i"
      class="label-row"
      :style="{ top: ((i + 0.5) * (100 / rows)) + '%' }"
    >
      {{ label }}
    </div>
  </div>
</template>

<script setup>
import SquareBase from "./SquareBase.vue";

const props = defineProps({
  rows: { type: Number, default: 8 },
  cols: { type: Number, default: 8 },
  labels: {
    type: Object,
    default: () => ({
      cols: ["1", "2", "3", "4", "5", "6", "7", "8"],
      rows: ["1", "2", "3", "4", "5", "6", "7", "8"],
    }),
  },
  pieces: { type: Array, default: () => [] },
});

//kebab case?? XD
const emit = defineEmits(["piece-click", "square-click"]);

function onPieceClick(piece) {
  emit("piece-click", piece);
}

function onSquareClick(x, y) {
  emit("square-click", { x, y });
}
</script>

<style scoped>
.board {
  position: relative;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  width: 650px;
  height: 650px;
  border: 5px solid #333;
  border-radius: 8px;
  overflow: hidden;
}

.pieces-layer {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  z-index: 2;
  pointer-events: none;
}

.piece-cell {
  display: grid;
  place-items: center;
  cursor: pointer;
  pointer-events: auto;
}

.board-wrap {
  position: relative;
  display: inline-block;
}

.label-col {
  position: absolute;
  bottom: -26px;
  transform: translateX(-50%);
  font-weight: 600;
  font-size: 14px;
  color: #333;
  pointer-events: none;
}

.label-row {
  position: absolute;
  left: -26px;
  transform: translateY(-50%);
  font-weight: 600;
  font-size: 14px;
  color: #333;
  pointer-events: none;
}
</style>
