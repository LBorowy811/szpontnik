<template>
  <div class="home">
    <div class="title">
      <span>Tryb rozgrywki: Casual</span>
    </div>
    <div class="cards">
      <div class="card" v-for="game in games" :key="game.name" @click="openGame(game)">
        <img :src="game.img" :alt="game.name" />
        <span>{{ game.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const games = [
  { name: "Szachy", img: new URL('../assets/home/szachy.png', import.meta.url).href },
  { name: "Warcaby", img: new URL('../assets/home/warcaby.png', import.meta.url).href },
  { name: "Chińczyk", img: new URL('../assets/home/chinczyk.png', import.meta.url).href },
  { name: "Domino", img: new URL('../assets/home/domino.png', import.meta.url).href },
  { name: "Gomoku", img: new URL('../assets/home/gomoku.png', import.meta.url).href },
  { name: "Kalambury", img: new URL('../assets/home/kalambury.png', import.meta.url).href },
  { name: "Kości", img: new URL('../assets/home/kości.png', import.meta.url).href },
  { name: "Literaki", img: new URL('../assets/home/literaki.png', import.meta.url).href },
  { name: "Kółko i krzyżyk", img: new URL('../assets/home/kolko-i-krzyzyk.png', import.meta.url).href },
  { name: "Mahjong", img: new URL('../assets/home/mahjong.png', import.meta.url).href },
  { name: "Monopol", img: new URL('../assets/home/monopol.png', import.meta.url).href },
  { name: "Piłka", img: new URL('../assets/home/placeholder.png', import.meta.url).href },
  { name: "Reversi", img: new URL('../assets/home/placeholder.png', import.meta.url).href },
  { name: "Tryktrak", img: new URL('../assets/home/placeholder.png', import.meta.url).href },
  { name: "Makao", img: new URL('../assets/home/placeholder.png', import.meta.url).href },
];
function openGame(game) {
  const path = gameRoutes[game.name];
  if (!path) return;
  router.push(path);
}

const router = useRouter();

const gameRoutes = {
  "Warcaby": "/games/checkers/rooms",
  "Chińczyk": "/games/chinczyk/rooms",
  "Kółko i krzyżyk": "/games/tictactoe/rooms",
  "Kości": "/games/dice/rooms",
};

</script>

<style>
.title {
  border: 2px solid var(--border-color-dimmed);
  display: flex;
  margin: 1rem;
  justify-content: center;
  font-size: 1.2rem;
  padding: 10px;
  color: var(--border-color-dimmed);
  transition: border-color 0.3s ease, color 0.3s ease;
  cursor: default;
}

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
