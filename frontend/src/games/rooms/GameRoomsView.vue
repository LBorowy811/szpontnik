<template>
  <div class="rooms-page">
    <div class="topbar">
      <h2 class="title">Pokoje — {{ gameLabel }}</h2>

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
      <div class="modal">
        <h3 class="modal-title">Utworzyć pokój?</h3>

        <label class="modal-label">
          Nazwa pokoju
          <input v-model="newRoomName" class="modal-input" type="text" placeholder="nazwa pokoju" maxlength="40" @keydown.enter.prevent="confirmCreateRoom"/>
        </label>

        <div class="modal-actions">
          <button class="modal-btn" type="button" @click="closeCreateModal">
            Anuluj
          </button>
          <button class="modal-btn primary" type="button" :disabled="isCreating || !newRoomName.trim()" @click="confirmCreateRoom">
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
const gameLabel = computed(() => {
  if (gameKey.value === "checkers") return "Warcaby";
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
}

function fetchRooms() {
  socket.emit("rooms:list", { gameKey: gameKey.value }, (resp) => {
    if (!resp?.ok) return;
    rooms.value = resp.rooms || [];
  });
}

function confirmCreateRoom() {
  if (!newRoomName.value.trim()) return;

  isCreating.value = true;

  socket.emit(
    "rooms:create",
    { gameKey: gameKey.value, roomName: newRoomName.value.trim() },
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

watch(gameKey, () => {
  fetchRooms();
});
</script>

<style scoped>
.rooms-page{
  max-width: 760px;
  margin: 24px auto;
  padding: 0 14px;
  color: #f3f3f3;
}

.topbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.title{
  margin:0;
  font-size: 20px;
  font-weight: 800;
}

.create-btn{
  border: 2px solid #f5f5f5;
  background: #262626;
  color: #f5f5f5;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 800;
  cursor: pointer;
}

.table{
  border: 2px solid #444;
  border-radius: 12px;
  overflow: hidden;
  background: #1f1f1f;
}

.thead, .row{
  display: grid;
  grid-template-columns: 1fr 160px 140px;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
}

.thead{
  background: #111;
  font-weight: 900;
}

.row{
  border-top: 1px solid #333;
}

.empty{
  padding: 18px 14px;
  opacity: 0.85;
}

.badge{
  display:inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 800;
  border: 1px solid #555;
}

.btn{
  width: 100%;
  padding: 9px 12px;
  border-radius: 10px;
  border: 2px solid #f5f5f5;
  background: #2f2f2f;
  color: #f5f5f5;
  font-weight: 800;
  cursor: pointer;
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
  width: 420px;
  background: #1f1f1f;
  border: 2px solid #444;
  border-radius: 12px;
  padding: 16px;
}

.modal-title{
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 900;
}

.modal-label{
  display: grid;
  gap: 6px;
  font-weight: 800;
}

.modal-input{
  padding: 10px 12px;
  border-radius: 10px;
  border: 2px solid #555;
  background: #111;
  color: #f5f5f5;
  outline: none;
}

.modal-actions{
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.modal-btn{
  padding: 10px 14px;
  border-radius: 10px;
  border: 2px solid #f5f5f5;
  background: #262626;
  color: #f5f5f5;
  font-weight: 900;
  cursor: pointer;
}

.modal-btn.primary{
  background: #2f2f2f;
}

.modal-btn:disabled{
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
