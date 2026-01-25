<template>
  <div class="board-tic-tac-toe">
    <div
      v-for="row in 3"
      :key="row"
      class="board-row"
    >
      <div
        v-for="col in 3"
        :key="col"
        class="board-cell"
        :class="{ 'cell-filled': board[row - 1][col - 1] }"
        @click="handleCellClick(col - 1, row - 1)"
      >
        {{ board[row - 1][col - 1] || '' }}
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  board: {
    type: Array,
    required: true,
    default: () => [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ],
  },
});

const emit = defineEmits(['square-click']);

function handleCellClick(x, y) {
  emit('square-click', { x, y });
}
</script>

<style scoped>
.board-tic-tac-toe {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  max-width: min(70vh, 70vw, 600px);
  aspect-ratio: 1;
  background: var(--bg-color);
  padding: 16px;
  border: 2px solid var(--border-color-dimmed);
}

.board-row {
  display: flex;
  gap: 4px;
  flex: 1;
}

.board-cell {
  flex: 1;
  background: var(--bg-app-color);
  border: 2px solid var(--border-color-dimmed);
  display: grid;
  place-items: center;
  font-size: clamp(48px, 12vw, 96px);
  font-weight: 800;
  color: var(--font-color);
  cursor: pointer;
  transition: border-color 0.3s ease, background-color 0.2s ease;
  font-family: "JetBrains Mono", monospace;
}

.board-cell:hover:not(.cell-filled) {
  background: var(--bg-color);
  border-color: var(--active-item);
}

.board-cell.cell-filled {
  cursor: not-allowed;
}

.board-cell.cell-filled:hover {
  background: var(--bg-app-color);
  border-color: var(--border-color-dimmed);
}
</style>
