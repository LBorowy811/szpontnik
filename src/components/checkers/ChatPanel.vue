<template>
  <aside class="chat">
    <div class="chat-header">Czat gry</div>

    <div class="chat-messages" ref="listEl">
      <div
        v-for="m in messages"
        :key="m.id"
        class="msg"
        :class="m.author === 'Ja' ? 'me' : 'opponent'"
      >
        <div class="meta">
          <strong>{{ m.author }}</strong>
          <span class="time">{{ m.time }}</span>
        </div>
        <div class="text">{{ m.text }}</div>
      </div>
    </div>

    <form class="chat-input" @submit.prevent="send">
      <input
        v-model="draft"
        type="text"
        placeholder="Napisz wiadomość…"
        @keydown.enter.exact.prevent="send"
      />
      <button type="submit">Wyślij</button>
    </form>
  </aside>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  messages: { type: Array, required: true }
})

const emit = defineEmits(['send'])

const draft = ref('')
const listEl = ref(null)

function send () {
  if (!draft.value.trim()) return
  const now = new Date()
  emit('send', {
    text: draft.value,
    time: now.toLocaleTimeString().slice(0, 5)
  })
  draft.value = ''

  nextTick(() => {
    const el = listEl.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

</script>

<style scoped>
.chat{
  width: 300px;
  height: 820px;
  border: 3px solid #333;
  border-radius: 8px;
  background: #fff;
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
}

.chat-header{
  padding: 10px 12px;
  font-weight: 700;
  border-bottom: 2px solid #333;
  background: #f5f5f5;
}

.chat-messages{
  justify-items: start;
  padding: 12px;
  overflow-y: auto;
  display: grid;
  gap: 10px;
  background: #fafafa;
}

.msg{
  display: inline-block; 
  justify-self: start;
  word-break: break-word;
  max-width: 90%;
  padding: 8px 10px;
  border: 2px solid #333;
  border-radius: 10px;
  background: #fff;
}

.msg.me{
  justify-self: end;
  background: #eaf6ff;
}

.msg .meta{
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 4px;
  font-size: 0.85rem;
}
.msg .meta .time{
  color: #666;
}
.msg .text{ white-space: pre-wrap; }

.chat-input{
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  padding: 10px;
  border-top: 2px solid #333;
  background: #f5f5f5;
}
.chat-input input{
  border: 2px solid #333;
  border-radius: 6px;
  padding: 8px 10px;
  outline: none;
}
.chat-input button{
  border: 2px solid #333;
  border-radius: 6px;
  background: #fff;
  padding: 8px 12px;
  font-weight: 600;
  cursor: pointer;
}
.chat-input button:hover{
  background: #f0f0f0;
}
</style>
