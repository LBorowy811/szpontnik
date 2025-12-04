<template>
  <div class="sidebar">
    <div class="menu">
      <div class="menu-item">
        <img src="../assets/icons/console.png" alt="Casual" class="icon" />
        <span>Casual</span>
      </div>
      <div class="menu-item">
        <img src="../assets/icons/ranking.png" alt="Rankingowa" class="icon" />
        <span>Rankingowa</span>
      </div>
      <div class="menu-item">
        <img src="../assets/icons/trophy.png" alt="Turnieje" class="icon" />
        <span>Turnieje</span>
      </div>
    </div>

    <div class="bottom">
      <div class="menu-item">
        <img src="../assets/icons/setting.png" alt="Ustawienia" class="icon" />
        <span>Ustawienia</span>
      </div>
    </div>
  </div>
</template>

<script>
</script>

<style scoped>
.sidebar {
  font-family: "JetBrains Mono";
  position: fixed;
  top: 60px;
  left: 0;
  bottom: 0;
  width: 200px;
  padding: 0.5rem;
  margin: 10px;
  background-color: var(--bg-color);
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: border-color 0.3s ease;
}

.sidebar:hover {
  border-color: white;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bottom {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 6px 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
  font-size: 1.2rem;
  color: var(--font-color);
}

.menu-item:hover {
  border-color: var(--active-item);
  color: var(--active-item);
}

.icon {
  width: 32px;
  height: 32px;
  filter: brightness(0) invert(1);
}

.menu-item:hover .icon {
  filter: invert(62%) sepia(41%) saturate(749%) hue-rotate(96deg) brightness(92%) contrast(89%);
}
</style>
