<template>
  <div class="usermenutop">
    <div class="nav">
      <div class="left">
        <img src="../assets/icons/makajler32x32.png" alt="Logo" class="logo" />
        <span>Szpontnik</span>
      </div>
      <div class="middle">
        gry online, zagraj z innymi osobami
      </div>
      <button>Zaloguj się</button>
    </div>
  </div>
</template>

<script>
</script>

<style scoped>
.usermenutop {
  font-family: "JetBrains Mono";
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  height: 50px;
  padding: 0 1rem;
  margin: 10px;
  background-color: var(--bg-color);
  border: 2px solid transparent;
  transition: border-color 0.3s ease;
  display: flex;
  align-items: center;
  font-size: 1.2rem;
}

.usermenutop:hover {
  border-color: white;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 0;
  color: var(--font-color);
}

.left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 2px solid transparent;
  transition: border-color 0.3s ease, color 0.3s ease;
  cursor: pointer;
  padding: 0 8px;
}

.left:hover {
  border-color: var(--active-item);
  color: var(--active-item);
}

.logo {
  width: 32px;
  height: 32px;
}

.middle {
  flex: 1;
  text-align: center;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
  font-size: 1.2rem;
}

button {
  background: none;
  border: 2px solid transparent;
  padding: 4px;
  font-family: inherit;
  font-size: inherit;
  color: var(--font-color);
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
}

button:hover {
  border-color: var(--active-item);
  color: var(--active-item);
}
</style>
