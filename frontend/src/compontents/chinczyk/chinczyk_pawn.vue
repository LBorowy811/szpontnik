<template>
  <svg 
    class="pawn" 
    :class="{ 'selected': isSelected, 'movable': isMovable }"
    viewBox="0 0 100 100" 
    role="img" 
    :aria-label="`pawn-${pawn.color}`"
  >
    <ellipse cx="50" cy="85" rx="20" ry="8" :fill="pawn.color" stroke="#fff" stroke-width="2"/>
    <rect x="45" y="60" width="10" height="25" :fill="pawn.color" stroke="#fff" stroke-width="2"/>
    <circle cx="50" cy="55" r="15" :fill="pawn.color" stroke="#fff" stroke-width="2"/>
    <rect x="47" y="40" width="6" height="15" :fill="pawn.color" stroke="#fff" stroke-width="2"/>
    <circle cx="50" cy="30" r="12" :fill="pawn.color" stroke="#fff" stroke-width="2"/>
    <polygon points="50,12 45,25 55,25" :fill="pawn.color" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
  </svg>
</template>

<script>
export default {
  props: {
    pawn: {
      type: Object,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    isMovable: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style scoped>
.pawn {
  width: 80%;
  height: 80%;
  display: block;
  margin: 0 auto;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
  transition: transform 0.2s, filter 0.2s;
}

.pawn.selected {
  animation: bounce 0.5s infinite alternate;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));
}

.pawn.movable {
  cursor: pointer;
}

.pawn.movable:hover {
  transform: scale(1.15);
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
}

@keyframes bounce {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-5px);
  }
}

@media (max-width: 400px) {
  .pawn { 
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); 
  }
}
</style>

