<template>
  <div class="rooms-page">
      <div class="title">
        <span>{{ isRanked ? 'Pokoje rankingowe' : 'Pokoje' }}: {{ gameLabel }}</span>
      </div>
      <div class="create">
        <button class="create-btn" type="button" @click="openCreateModal">
          Stwórz pokój
        </button>
    </div>

    <div class="table">
      <div class="thead">
        <div class="col room">Pokój</div>
        <div class="col status">Status</div>
        <div class="col action">Akcja</div>
      </div>

      <div v-if="rooms.length === 0" class="empty">
        Brak dostępnych pokoi.
      </div>

      <div v-for="r in rooms" :key="r.id" class="row">
        <div class="col room">
          {{ r.roomName ? r.roomName : `Pokój #${r.id.slice(-6)}` }}
        </div>

        <div class="col status">
          <span class="badge" :class="r.status">
            {{ r.status === "waiting" ? "Oczekuje" : "Trwa" }}
          </span>
        </div>

        <div class="col action">
          <button v-if="r.status === 'waiting'" class="btn" type="button" @click="joinRoom(r.id)">
            Dołącz
          </button>

          <button v-else class="btn" type="button" @click="watchRoom(r.id)">
            Oglądaj
          </button>
        </div>
      </div>
    </div>
    <div v-if="isCreateOpen" class="modal-backdrop" @click.self="closeCreateModal">
      <div class="modal" @click.stop>
        <h3 class="modal-title">Utworzyć pokój?</h3>

        <label class="modal-label">
          Nazwa pokoju
          <input 
            v-model="newRoomName" 
            class="modal-input" 
            type="text" 
            placeholder="nazwa pokoju" 
            maxlength="40" 
            @keydown.enter.prevent="confirmCreateRoom"
            @input="checkInput"/>
        </label>

        <div class="modal-actions">
          <button 
            class="modal-btn" 
            type="button" 
            @click="closeCreateModal">
            Anuluj
          </button>
          <button 
            class="modal-btn primary" 
            type="button" 
            :disabled="isCreating || !newRoomName.trim()" 
            @click="confirmCreateRoom">
            {{ isCreating ? "Tworzenie..." : "Stwórz" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import socket from "@/services/socket";

const route = useRoute();
const router = useRouter();

const gameKey = computed(() => String(route.params.gameKey || ""));
const isRanked = computed(() => route.query.ranked === 'true');
const gameLabel = computed(() => {
  if (gameKey.value === "checkers") return "Warcaby";
  if (gameKey.value === "tictactoe") return "Kółko i krzyżyk";
  if (gameKey.value === "chinczyk") return "Chińczyk";
  if (gameKey.value === "dice") return "Kości";
  if (gameKey.value === "pictionary") return "Kalambury";
  return gameKey.value;
});

const rooms = ref([]);

const isCreateOpen = ref(false);
const newRoomName = ref("");
const isCreating = ref(false);

function openCreateModal() {
  isCreateOpen.value = true;
  newRoomName.value = `${gameLabel.value} #${Math.floor(Math.random() * 900 + 100)}`;
}

function closeCreateModal() {
  isCreateOpen.value = false;
  isCreating.value = false;
  newRoomName.value = "";
}

function fetchRooms() {
  socket.emit("rooms:list", { gameKey: gameKey.value, ranked: isRanked.value }, (resp) => {
    if (!resp?.ok) return;
    rooms.value = resp.rooms || [];
  });
}

function confirmCreateRoom() {
  if (!newRoomName.value.trim()) return;

  isCreating.value = true;

  socket.emit(
    "rooms:create",
    { gameKey: gameKey.value, roomName: newRoomName.value.trim(), ranked: isRanked.value },
    (resp) => {
      isCreating.value = false;

      if (!resp?.ok) {
        alert(resp?.error || "Nie udało się utworzyć pokoju");
        return;
      }

      closeCreateModal();
      router.push({
        path: `/games/${gameKey.value}`,
        query: { gameId: resp.roomId },
      });
    }
  );
}

function joinRoom(roomId) {
  router.push({
    path: `/games/${gameKey.value}`,
    query: { gameId: roomId },
  });
}

function watchRoom(roomId) {
  router.push({
    path: `/games/${gameKey.value}`,
    query: { gameId: roomId },
  });
}

function onRoomsUpdated(payload) {
  if (!payload) return;
  if (payload.gameKey !== gameKey.value) return;
  rooms.value = payload.rooms || [];
}

onMounted(() => {
  fetchRooms();
  socket.on("rooms:updated", onRoomsUpdated);
});

onUnmounted(() => {
  socket.off("rooms:updated", onRoomsUpdated);
});

watch([gameKey, isRanked], () => {
  fetchRooms();
});
</script>

<style scoped>
.rooms-page{
  color: var(--font-color);
  gap: 1rem;
  font-size: 1.2rem;
}

.title {
  border: 2px solid var(--border-color-dimmed);
  display: flex;
  justify-content: center;
  padding: 10px;
  color: var(--font-color);
  transition: border-color 0.3s ease, color 0.3s ease;
  cursor: default;
}

.create {
  display: flex;
  justify-content: center;
  margin: 1rem;
}

.create-btn{
  border: 2px solid var(--border-color-dimmed);
  font-size: 1.2rem;
  width: 100%;
  background: var(--bg-color);
  color: var(--font-color);
  padding: 10px;
  cursor: pointer;
  transition: border-color 0.3s ease;
  font-family: "JetBrains Mono";
}

.create-btn:hover {
  border-color: var(--active-item);
  color: var(--active-item);
}

.table{
  margin: 1rem;
  border: 2px solid var(--border-color-dimmed);
  overflow: hidden;
  background: var(--bg-color);
  transition: border-color 0.3s ease;
}

.table:hover {
  border-color: var(--font-color);
}

.thead, .row{
  display: grid;
  grid-template-columns: 1fr 160px 140px;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
}

.thead{
  background: var(--bg-app-color);
  color: var(--font-color);
}

.row{
  border-top: 1px solid var(--border-color-dimmed);
  transition: background-color 0.2s ease;
}

.row:hover {
  background-color: rgba(66, 184, 131, 0.05);
}

.empty{
  padding: 18px 14px;
  opacity: 0.85;
  color: var(--font-color);
}

.badge{
  display:inline-block;
  padding: 6px 10px;
  font-weight: 800;
  border: 1px solid var(--border-color-dimmed);
  background: var(--bg-color);
  color: var(--font-color);
}

.badge.waiting {
  border-color: var(--active-item);
  color: var(--active-item);
}

.badge.playing {
  border-color: var(--font-color);
  color: var(--font-color)
}

.btn{
  width: 100%;
  padding: 9px 12px;
  border: 2px solid var(--border-color-dimmed);
  background: var(--bg-color);
  color: var(--font-color);
  font-weight: 800;
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
  font-family: "JetBrains Mono";
}

.btn:hover {
  border-color: var(--active-item);
  color: var(--active-item);
}

.modal-backdrop{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  display: grid;
  place-items: center;
  z-index: 9999;
}

.modal{
  font-size: 1.2rem;
  width: 420px;
  background: var(--bg-color);
  border: 2px solid var(--border-color-dimmed);
  padding: 16px;
}

.modal-title{
  margin: 0 0 12px;
  font-size: 18px;
  font-size: 1.2rem;
  color: var(--font-color);
}

.modal-label{
  display: grid;
  font-size: 1.2rem;
  gap: 6px;
  color: var(--font-color);
}

.modal-input{
  padding: 10px 12px;
  border: 2px solid var(--border-color-dimmed);
  background: var(--form-input-bg-color);
  color: var(--font-color);
  outline: none;
  transition: border-color 0.3s ease;
  font-family: "JetBrains Mono";
  font-size: 1.2rem;
}

.modal-input:focus {
  border-color: var(--active-item);
}

.modal-input::placeholder {
  color: var(--form-input-placeholder);
}

.modal-actions{
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.modal-btn{
  font-family: "JetBrains Mono";
  font-size: 1.2rem;
  padding: 10px 14px;
  border: 2px solid var(--border-color-dimmed);
  background: var(--bg-color);
  color: var(--font-color);
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease, transform 0.2s ease;
}

.modal-btn:hover {
  border-color: red;
  color: red;
  transform: translateY(-2px);
}

.modal-btn.primary:hover {
  border-color: var(--active-item);
  color: var(--active-item);
}

.modal-btn.primary{
  background: var(--bg-color);
}

.modal-btn:disabled{
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.modal-btn:disabled:hover {
  border-color: var(--border-color-dimmed);
  color: var(--font-color);
}
</style>
