<template>
  <div class="player-info" :class="{ active: isActive }">
    <div class="color-box" :style="{ backgroundColor: color }"></div>
    <div class="player-details">
      <span class="player-name">{{ player.name }}</span>
      <span class="pawns-count">Pionki w mecie: {{ pawnsInGoal }}/4</span>
    </div>
    <div v-if="isActive" class="active-indicator">▶</div>
  </div>
</template>

<script>
export default {
  props: {
    player: {
      type: Object,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: false
    },
    pawnsInGoal: {
      type: Number,
      default: 0
    }
  }
};
</script>

<style scoped>
.player-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #f9f9f9;
  margin-bottom: 10px;
  transition: all 0.3s;
}

.player-info.active {
  background: #e8f5e9;
  border-left: 4px solid #4CAF50;
  font-weight: bold;
}

.color-box {
  width: 32px;
  height: 32px;
  border: 2px solid #333;
  border-radius: 4px;
  flex-shrink: 0;
}

.player-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-grow: 1;
}

.player-name {
  font-size: 1em;
  color: #333;
}

.pawns-count {
  font-size: 0.85em;
  color: #666;
}

.active-indicator {
  color: #4CAF50;
  font-size: 1.2em;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
