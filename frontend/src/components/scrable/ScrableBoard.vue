<template>
  <div class="scrable-board-wrapper">
    <div class="scrable-board">
      <template v-for="row in size" :key="'r-' + row">
        <div
          v-for="col in size"
          :key="'c-' + row + '-' + col"
          class="cell"
          :class="cellClass(col - 1, row - 1)"
        >
          <span
            v-if="multiplierAt(col - 1, row - 1)"
            class="cell-label"
          >
            {{ multiplierAt(col - 1, row - 1) }}
          </span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
const size = 15;

const special = new Map();

[
  [0, 0], [0, 7], [0, 14],
  [7, 0], [7, 14],
  [14, 0], [14, 7], [14, 14],
].forEach(([x, y]) => special.set(`${x},${y}`, "3S"));

for (let i = 1; i < size - 1; i += 2) {
  if (i !== 7) {
    special.set(`${i},${i}`, "2S");
    special.set(`${size - 1 - i},${i}`, "2S");
  }
}

[
  [5, 1], [9, 1],
  [1, 5], [5, 5], [9, 5], [13, 5],
  [1, 9], [5, 9], [9, 9], [13, 9],
  [5, 13], [9, 13],
].forEach(([x, y]) => special.set(`${x},${y}`, "3L"));

[
  [3, 0], [11, 0],
  [6, 2], [8, 2],
  [0, 3], [7, 3], [14, 3],
  [2, 6], [6, 6], [8, 6], [12, 6],
  [3, 7], [11, 7],
  [2, 8], [6, 8], [8, 8], [12, 8],
  [0, 11], [7, 11], [14, 11],
  [6, 12], [8, 12],
  [3, 14], [11, 14],
].forEach(([x, y]) => special.set(`${x},${y}`, "2L"));

function multiplierAt(x, y) {
  return special.get(`${x},${y}`) || null;
}

function cellClass(x, y) {
  const m = multiplierAt(x, y);
  return {
    "cell--3s": m === "3S",
    "cell--2s": m === "2S",
    "cell--3l": m === "3L",
    "cell--2l": m === "2L",
  };
}
</script>

<style scoped>
.scrable-board-wrapper {
  background: #707579;
  padding: 12px;
  border-radius: 10px;
  display: inline-block;
}

.scrable-board {
  width: 480px;
  height: 480px;
  display: grid;
  grid-template-rows: repeat(15, 1fr);
  grid-template-columns: repeat(15, 1fr);
  gap: 1px;
  background: #bfc3c7;
}

.cell {
  background: #d7dadc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.65rem;
}

.cell--3s {
  background: #b9413d;
  color: #fff;
}
.cell--2s {
  background: #d07a7a;
  color: #fff;
}
.cell--3l {
  background: #244c82;
  color: #fff;
}
.cell--2l {
  background: #486b9c;
  color: #fff;
}

.cell-label {
  font-size: 0.6rem;
  font-weight: 700;
  user-select: none;
}
</style>
