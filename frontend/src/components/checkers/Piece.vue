<template>
  <div
    class="piece"
    :class="[
      color,
      {
        'piece-selected': selected,
        'piece-king': king
      }
    ]"
  >
    <!--litera K widoczna zawsze jesli pionek ma flage king ktora jest podana z backendu-->
    <span v-if="king" class="pieceKing-label">K</span>
  </div>
</template>

<script setup>
const props = defineProps({
  color: { type: String, required: true },
  selected: { type: Boolean, default: false },
  //flaga king z backendu
  king: { type: Boolean, default: false }
});
</script>

<style scoped>
.piece {
  width: 72%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  display: grid;
  place-items: center;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
  position: relative;
}

.piece.white {
  background: radial-gradient(circle at 30% 30%, #ffffff, #e0e0e0);
}
.piece.black {
  background: radial-gradient(circle at 30% 30%, #414040, #0d0d0d);
}

.piece-selected {
  outline: 4px solid #00ff99;
  outline-offset: 2px;
}

.piece-king {
  border: 3px solid #ffcc33;
}

.pieceKing-label {
  font-weight: 800;
  font-size: 26px;
  color: #ffcc33;
  text-shadow: 0 0 4px #000;
  user-select: none;
}
</style>
