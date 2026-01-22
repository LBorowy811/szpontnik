<template>
  <div class="pictionary-board">
    <div class="board-header">
      <div v-if="isDrawer" class="drawer-info">
        <span class="word-to-draw">Narysuj: <strong>{{ wordToDraw }}</strong></span>
      </div>
      <div v-else class="guesser-info">
        <span>Zgadnij co rysuje {{ drawerName }}</span>
      </div>
      <div class="timer">
        <span>Czas: {{ timeLeft }}s</span>
      </div>
    </div>

    <canvas
      ref="canvas"
      class="drawing-canvas"
      width="800"
      height="600"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="stopDrawing"
    />

    <div v-if="isDrawer" class="controls">
      <div class="color-picker">
        <button
          v-for="color in colors"
          :key="color"
          class="color-btn"
          :class="{ active: selectedColor === color }"
          :style="{ backgroundColor: color }"
          @click="selectColor(color)"
        />
      </div>

      <div class="brush-size">
        <label>Grubość:</label>
        <input
          v-model.number="brushSize"
          type="range"
          min="1"
          max="20"
          step="1"
        />
        <span>{{ brushSize }}px</span>
      </div>

      <div class="actions">
        <button class="action-btn" @click="clearCanvas">Wyczyść</button>
        <button class="action-btn skip" @click="skipRound">Pomiń rundę</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  isDrawer: {
    type: Boolean,
    default: false,
  },
  wordToDraw: {
    type: String,
    default: '',
  },
  drawerName: {
    type: String,
    default: 'Gracz',
  },
  roundStartTime: {
    type: Number,
    default: Date.now(),
  },
  roundDuration: {
    type: Number,
    default: 60000,
  },
  canvasData: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['draw', 'clear', 'skip']);

const canvas = ref(null);
const ctx = ref(null);
const isDrawing = ref(false);
const selectedColor = ref('#000000');
const brushSize = ref(3);
const timeLeft = ref(60);

const colors = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
];

let animationFrameId = null;
let lastX = 0;
let lastY = 0;
let hasSkippedOnTimeout = false;

onMounted(() => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext('2d');
    ctx.value.lineCap = 'round';
    ctx.value.lineJoin = 'round';

    // Narysuj białe tło
    ctx.value.fillStyle = '#FFFFFF';
    ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height);
  }

  // Timer
  updateTimer();
});

function updateTimer() {
  hasSkippedOnTimeout = false; // Reset przy nowym timerze

  const update = () => {
    const elapsed = Date.now() - props.roundStartTime;
    const remaining = Math.max(0, Math.floor((props.roundDuration - elapsed) / 1000));
    timeLeft.value = remaining;

    if (remaining > 0) {
      animationFrameId = requestAnimationFrame(update);
    } else if (remaining === 0 && !hasSkippedOnTimeout && props.isDrawer) {
      // Automatycznie pomiń rundę gdy czas się skończy (tylko rysujący)
      hasSkippedOnTimeout = true;
      emit('skip');
    }
  };

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  update();
}

watch(() => props.roundStartTime, () => {
  updateTimer();

  // Gdy zmienia się runda (nowy roundStartTime), wyczyść canvas dla rysującego
  if (props.isDrawer && ctx.value && canvas.value) {
    console.log('[PICTIONARY BOARD] Nowa runda - czyszczenie canvas dla rysującego');
    ctx.value.fillStyle = '#FFFFFF';
    ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height);
  }
});

// Watch na zmianę statusu isDrawer - gdy zostajesz rysującym, wyczyść canvas
watch(() => props.isDrawer, (newIsDrawer, oldIsDrawer) => {
  if (newIsDrawer && !oldIsDrawer && ctx.value && canvas.value) {
    console.log('[PICTIONARY BOARD] Zostałeś rysującym - czyszczenie canvas');
    ctx.value.fillStyle = '#FFFFFF';
    ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height);
  }
});

watch(() => props.canvasData, (newData, oldData) => {
  if (!props.isDrawer) {
    console.log('[PICTIONARY BOARD] canvasData zmienione, długość:', newData?.length, 'oldData:', oldData?.length);

    if (!ctx.value || !canvas.value) return;

    if (newData && newData.length === 0) {
      // Canvas został wyczyszczony - wyczyść lokalny canvas
      console.log('[PICTIONARY BOARD] Czyszczenie canvas dla zgadującego');
      ctx.value.fillStyle = '#FFFFFF';
      ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height);
    } else if (newData && newData.length > 0) {
      // Jeśli to pierwsze załadowanie danych (oldData nie istnieje lub jest puste)
      // lub canvas został wyczyszczony i teraz są nowe dane
      if (!oldData || oldData.length === 0 || oldData.length > newData.length) {
        console.log('[PICTIONARY BOARD] Przerysowanie całego canvas');
        // Wyczyść i narysuj wszystko od nowa
        ctx.value.fillStyle = '#FFFFFF';
        ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height);

        // Narysuj wszystkie ruchy
        newData.forEach(drawData => {
          redrawFromData(drawData);
        });
      } else {
        // Normalny przyrost - narysuj tylko ostatni element
        const lastDrawData = newData[newData.length - 1];
        redrawFromData(lastDrawData);
      }
    }
  }
}, { deep: true });

function getMousePos(e) {
  const rect = canvas.value.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function getTouchPos(e) {
  const rect = canvas.value.getBoundingClientRect();
  const touch = e.touches[0];
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
}

function startDrawing(e) {
  if (!props.isDrawer) return;

  isDrawing.value = true;
  const pos = getMousePos(e);
  lastX = pos.x;
  lastY = pos.y;
}

function draw(e) {
  if (!isDrawing.value || !props.isDrawer) return;

  const pos = getMousePos(e);

  ctx.value.strokeStyle = selectedColor.value;
  ctx.value.lineWidth = brushSize.value;

  ctx.value.beginPath();
  ctx.value.moveTo(lastX, lastY);
  ctx.value.lineTo(pos.x, pos.y);
  ctx.value.stroke();

  const drawData = {
    type: 'line',
    x1: lastX,
    y1: lastY,
    x2: pos.x,
    y2: pos.y,
    color: selectedColor.value,
    width: brushSize.value,
  };

  emit('draw', drawData);

  lastX = pos.x;
  lastY = pos.y;
}

function stopDrawing() {
  isDrawing.value = false;
}

function handleTouchStart(e) {
  if (!props.isDrawer) return;
  e.preventDefault();

  isDrawing.value = true;
  const pos = getTouchPos(e);
  lastX = pos.x;
  lastY = pos.y;
}

function handleTouchMove(e) {
  if (!isDrawing.value || !props.isDrawer) return;
  e.preventDefault();

  const pos = getTouchPos(e);

  ctx.value.strokeStyle = selectedColor.value;
  ctx.value.lineWidth = brushSize.value;

  ctx.value.beginPath();
  ctx.value.moveTo(lastX, lastY);
  ctx.value.lineTo(pos.x, pos.y);
  ctx.value.stroke();

  const drawData = {
    type: 'line',
    x1: lastX,
    y1: lastY,
    x2: pos.x,
    y2: pos.y,
    color: selectedColor.value,
    width: brushSize.value,
  };

  emit('draw', drawData);

  lastX = pos.x;
  lastY = pos.y;
}

function redrawFromData(drawData) {
  if (!ctx.value || !drawData) return;

  ctx.value.strokeStyle = drawData.color;
  ctx.value.lineWidth = drawData.width;

  ctx.value.beginPath();
  ctx.value.moveTo(drawData.x1, drawData.y1);
  ctx.value.lineTo(drawData.x2, drawData.y2);
  ctx.value.stroke();
}

function selectColor(color) {
  selectedColor.value = color;
}

function clearCanvas() {
  if (!ctx.value) return;

  ctx.value.fillStyle = '#FFFFFF';
  ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height);

  emit('clear');
}

function skipRound() {
  emit('skip');
}

defineExpose({
  clearCanvas,
});
</script>

<style scoped>
.pictionary-board {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--bg-color);
  border: 2px solid var(--border-color-dimmed);
  color: var(--font-color);
}

.drawer-info,
.guesser-info {
  font-size: 1.1rem;
}

.word-to-draw strong {
  color: var(--active-item);
  font-weight: 800;
  font-size: 1.3rem;
}

.timer {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--active-item);
}

.drawing-canvas {
  border: 2px solid var(--border-color-dimmed);
  background: #FFFFFF;
  cursor: crosshair;
  display: block;
}

.drawing-canvas:not([data-drawer="true"]) {
  cursor: not-allowed;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: var(--bg-color);
  border: 2px solid var(--border-color-dimmed);
}

.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-btn {
  width: 36px;
  height: 36px;
  border: 2px solid var(--border-color-dimmed);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: var(--active-item);
  border-width: 3px;
  transform: scale(1.15);
}

.brush-size {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--font-color);
}

.brush-size label {
  font-weight: 600;
}

.brush-size input[type="range"] {
  flex: 1;
  max-width: 200px;
}

.brush-size span {
  min-width: 40px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 10px 16px;
  border: 2px solid var(--border-color-dimmed);
  background: var(--bg-color);
  color: var(--font-color);
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
  font-family: 'JetBrains Mono', monospace;
}

.action-btn:hover {
  border-color: var(--active-item);
  color: var(--active-item);
}

.action-btn.skip:hover {
  border-color: #ff6b6b;
  color: #ff6b6b;
}
</style>
