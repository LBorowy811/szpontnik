<template>
  <div class="square" :class="isDark ? 'dark' : 'light'"></div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  x: { type: Number, required: true },
  y: { type: Number, required: true }
})
const isDark = computed(() => (props.x + props.y) % 2 === 1)
</script>

<style scoped>
.square { width: 100%; height: 100%; }
.light  { background: #d8c1ab; }
.dark   { background: #69503c; }
</style>
