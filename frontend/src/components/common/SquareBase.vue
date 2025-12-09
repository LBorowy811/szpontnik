<template>
  <div
    class="square"
    :class="colorClass"
    @click="handleClick"
  ></div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
})

const emit = defineEmits(['click'])

const colorClass = computed(() =>
  (props.x + props.y) % 2 === 0 ? 'square--light' : 'square--dark'
)

function handleClick() {
  emit('click', { x: props.x, y: props.y })
}
</script>

<style scoped>
.square {
  width: 100%;
  height: 100%;
}
.square--light {
  background: #305826;
}
.square--dark {
  background: #a6b19d;
}
</style>
