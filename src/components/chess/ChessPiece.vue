<template>
  <img class="icon" :src="src" :alt="alt" draggable="false" />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type:  { type: String, required: true }, 
  color: { type: String, required: true } 
})

const filename = computed(() => `${props.color}_${props.type}.svg`)
const src = computed(() => new URL(`/src/assets/chess/${filename.value}`, import.meta.url).href)
const alt = computed(() => `${props.color} ${props.type}`)
</script>

<style scoped>
.icon{
  width: 80%;
  height: 80%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}
</style>
