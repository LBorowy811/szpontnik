<template>
  <div class="home">
    <div class="cards">
      <router-link to="/account-settings" class="card">
        <img src="../assets/ustawienia/konto.png"/>
        <span>Ustawienia konta</span>
      </router-link>
      <div class="card">
        <img src="../assets/ustawienia/ustawienia.png"/>
        <span>Ustawienia witryny</span>
      </div>
      <div class="card">
        <img src="../assets/ustawienia/ranking.png"/>
        <span>Mój ranking</span>
      </div>
    </div>
  </div>
</template>

<script>
</script>

<style>
.cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin: 1rem 1rem;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--bg-color);
  border: 2px solid var(--border-color-dimmed);
  padding: 0.5rem;
  cursor: pointer;
  transition: border-color 0.3s ease, transform 0.2s ease;
  font-family: "JetBrains Mono";
  color: var(--font-color);
  text-decoration: none;
}

.card:hover {
  border-color: var(--active-item);
  transform: translateY(-5px);
  color: var(--active-item);
  background-color: var(--bg-color);
}

.card img {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  margin-bottom: 0.5rem;
}

.card span {
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
}
</style>