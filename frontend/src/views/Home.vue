<template>
  <div class="home">
    <div class="cards">
      <div class="card" v-for="game in games" :key="game.name">
        <img :src="game.img" :alt="game.name" />
        <span>{{ game.name }}</span>
      </div>
    </div>
  </div>
  <div style="margin: 1rem;">
    <router-link to="/login">Zaloguj się</router-link>
  </div>
</template>

<script setup>
const games = [
  { name: "Szachy", img: new URL('../assets/gry/placeholder.png', import.meta.url).href },
  { name: "Warcaby", img: new URL('../assets/gry/placeholder.png', import.meta.url).href },
  { name: "Chińczyk", img: new URL('../assets/gry/placeholder.png', import.meta.url).href },
  { name: "Domino", img: new URL('../assets/gry/placeholder.png', import.meta.url).href },
  { name: "Gomoku", img: new URL('../assets/gry/placeholder.png', import.meta.url).href },
  { name: "Kalambury", img: new URL('../assets/gry/placeholder.png', import.meta.url).href },
  { name: "Kości", img: new URL('../assets/gry/placeholder.png', import.meta.url).href },
  { name: "Literaki", img: new URL('../assets/gry/placeholder.png', import.meta.url).href },
  { name: "Kulki", img: new URL('../assets/gry/placeholder.png', import.meta.url).href },
  { name: "Mahjong", img: new URL('../assets/gry/placeholder.png', import.meta.url).href },
  { name: "Monopol", img: new URL('../assets/gry/placeholder.png', import.meta.url).href },
  { name: "Piłka", img: new URL('../assets/gry/placeholder.png', import.meta.url).href },
  { name: "Reversi", img: new URL('../assets/gry/placeholder.png', import.meta.url).href },
  { name: "Tryktrak", img: new URL('../assets/gry/placeholder.png', import.meta.url).href },
  { name: "Makao", img: new URL('../assets/gry/placeholder.png', import.meta.url).href },
];
</script>

<style scoped>
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
  border: 2px solid rgba(255, 255, 255, 0.251);
  padding: 0.5rem;
  cursor: pointer;
  transition: border-color 0.3s ease, transform 0.2s ease;
  font-family: "JetBrains Mono";
  color: var(--font-color);
}

.card:hover {
  border-color: var(--active-item);
  transform: translateY(-5px);
  color: var(--active-item);
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

<style>
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-thumb {
  background: #42b88372;
}
</style>
