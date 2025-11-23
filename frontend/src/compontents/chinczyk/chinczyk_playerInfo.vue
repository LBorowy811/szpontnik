<template>
  <div class="player-info">
    <div class="color-box" :style="{ backgroundColor: player.color }"></div>
    <span>{{ player.name }}</span>
  </div>
</template>

<script>
export default {
  props: ['player']
};
</script>

<style>
.player-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.color-box {
  width: 20px;
  height: 20px;
  border: 1px solid #333;
}
</style>
