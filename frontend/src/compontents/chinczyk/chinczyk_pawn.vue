<template>
  <svg class="pawn" viewBox="0 0 100 100" role="img" :aria-label="`pawn-${pawn.color}`">
    <!-- base (podstawa) -->
    <ellipse cx="50" cy="85" rx="20" ry="8" :fill="pawn.color" stroke="#fff" stroke-width="2"/>
    
    <!-- stem (trzpień) -->
    <rect x="45" y="60" width="10" height="25" :fill="pawn.color" stroke="#fff" stroke-width="2"/>
    
    <!-- middle bulge (środkowe wybrzuszenie) -->
    <circle cx="50" cy="55" r="15" :fill="pawn.color" stroke="#fff" stroke-width="2"/>
    
    <!-- neck (szyja) -->
    <rect x="47" y="40" width="6" height="15" :fill="pawn.color" stroke="#fff" stroke-width="2"/>
    
    <!-- head (głowa) -->
    <circle cx="50" cy="30" r="12" :fill="pawn.color" stroke="#fff" stroke-width="2"/>
    
    <!-- top point (czubek) -->
    <polygon points="50,12 45,25 55,25" :fill="pawn.color" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
  </svg>
</template>

<script>
export default {
  props: ['pawn']
};
</script>

<style scoped>
.pawn {
  width: 80%;
  height: 80%;
  display: block;
  margin: 0 auto;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
}

@media (max-width: 400px) {
  .pawn { filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); }
}
</style>