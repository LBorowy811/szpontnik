<template>
    <div 
      class="die"
      :class="{ 'kept': kept }"
      @click="$emit('click')"
    >
      <div class="die-face" :data-value="value">
        <div 
          v-for="n in getDotsForValue(value)" 
          :key="n" 
          class="dot"
          :class="`dot-${n}`"
        ></div>
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    value: {
      type: Number,
      required: true,
      validator: (val) => val >= 1 && val <= 6
    },
    kept: {
      type: Boolean,
      default: false
    }
  });
  
  defineEmits(['click']);
  
  // Funkcja zwracająca pozycje kropek dla wartości kostki
  function getDotsForValue(value) {
    const dots = {
      1: [5],
      2: [1, 9],
      3: [1, 5, 9],
      4: [1, 3, 7, 9],
      5: [1, 3, 5, 7, 9],
      6: [1, 3, 4, 6, 7, 9]
    };
    return dots[value] || [];
  }
  </script>
  
  <style scoped>
  .die {
    width: 80px;
    height: 80px;
    border: 2px solid var(--border-color-dimmed);
    background: white;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    padding: 10px;
    box-sizing: border-box;
    box-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1);
    position: relative;
  }
  
  .die:hover {
    border-color: var(--active-item);
    transform: scale(1.1);
    box-shadow: 
      0 4px 8px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  }
  
  .die.kept {
    background: var(--active-item);
    border-color: var(--active-item);
    box-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  }
  
  .die-face {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .dot {
    width: 12px;
    height: 12px;
    background: #333;
    border-radius: 50%;
    position: absolute;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
  }
  
  .die.kept .dot {
    background: white;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  
  /* Pozycje kropek dla różnych wartości kostki */
  /* 1 */
  .die-face[data-value="1"] .dot-5 {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  
  /* 2 */
  .die-face[data-value="2"] .dot-1 {
    top: 20%;
    left: 20%;
  }
  .die-face[data-value="2"] .dot-9 {
    bottom: 20%;
    right: 20%;
  }
  
  /* 3 */
  .die-face[data-value="3"] .dot-1 {
    top: 20%;
    left: 20%;
  }
  .die-face[data-value="3"] .dot-5 {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .die-face[data-value="3"] .dot-9 {
    bottom: 20%;
    right: 20%;
  }
  
  /* 4 */
  .die-face[data-value="4"] .dot-1 {
    top: 20%;
    left: 20%;
  }
  .die-face[data-value="4"] .dot-3 {
    top: 20%;
    right: 20%;
  }
  .die-face[data-value="4"] .dot-7 {
    bottom: 20%;
    left: 20%;
  }
  .die-face[data-value="4"] .dot-9 {
    bottom: 20%;
    right: 20%;
  }
  
  /* 5 */
  .die-face[data-value="5"] .dot-1 {
    top: 20%;
    left: 20%;
  }
  .die-face[data-value="5"] .dot-3 {
    top: 20%;
    right: 20%;
  }
  .die-face[data-value="5"] .dot-5 {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .die-face[data-value="5"] .dot-7 {
    bottom: 20%;
    left: 20%;
  }
  .die-face[data-value="5"] .dot-9 {
    bottom: 20%;
    right: 20%;
  }
  
  /* 6 */
  .die-face[data-value="6"] .dot-1 {
    top: 20%;
    left: 20%;
  }
  .die-face[data-value="6"] .dot-3 {
    top: 20%;
    right: 20%;
  }
  .die-face[data-value="6"] .dot-4 {
    top: 50%;
    left: 20%;
    transform: translateY(-50%);
  }
  .die-face[data-value="6"] .dot-6 {
    top: 50%;
    right: 20%;
    transform: translateY(-50%);
  }
  .die-face[data-value="6"] .dot-7 {
    bottom: 20%;
    left: 20%;
  }
  .die-face[data-value="6"] .dot-9 {
    bottom: 20%;
    right: 20%;
  }
  </style>