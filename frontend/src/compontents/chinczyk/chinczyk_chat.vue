<template>
  <div class="chat">
    <div class="chat-header">Czat gry</div>

    <div class="messages" ref="messages">
      <div 
        v-for="(m, i) in messages" 
        :key="i" 
        class="message"
        :class="{ 'system-message': m.isSystem }"
      >
        <span class="dot" :style="{ background: m.color || '#888' }"></span>
        <div class="bubble">
          <div class="meta">
            <strong>{{ m.author }}</strong> 
            <small>{{ m.time }}</small>
          </div>
          <div class="text">{{ m.text }}</div>
        </div>
      </div>
    </div>

    <div class="composer">
      <input
        v-model="text"
        @keydown.enter.prevent="sendMessage"
        placeholder="Napisz wiadomość..."
        aria-label="Wiadomość czatu"
      />
      <button @click="sendMessage" :disabled="!text.trim()">Wyślij</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChinczykChat',
  props: {
    messages: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      text: ''
    };
  },
  methods: {
    sendMessage() {
      const t = this.text.trim();
      if (!t) return;
      this.$emit('send-message', t);
      this.text = '';
      this.scrollBottom();
    },
    scrollBottom() {
      this.$nextTick(() => {
        const el = this.$refs.messages;
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
  },
  watch: {
    messages: {
      handler() {
        this.scrollBottom();
      },
      deep: true
    }
  }
};
</script>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 10px rgba(0,0,0,0.06);
  padding: 8px;
  height: 320px;
  box-sizing: border-box;
  width: 100%;
}

.chat-header {
  font-weight: 700;
  padding: 6px 8px;
  border-bottom: 1px solid #efefef;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #ffffff; /* white frame */
  border: 1px solid #eee;
  border-radius: 8px;
  margin-top: 8px;
}

.message {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.message.system-message .bubble {
  background: #e3f2fd;
  font-style: italic;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 6px;
  border: 1px solid rgba(0,0,0,0.06);
}

.bubble {
  max-width: 100%;
  background: #f5f5f7;
  padding: 6px 8px;
  border-radius: 8px;
  box-shadow: 0 1px 0 rgba(0,0,0,0.03) inset;
}

.meta {
  font-size: 11px;
  color: #555;
  margin-bottom: 4px;
}

.text {
  font-size: 13px;
  color: #222;
  word-break: break-word;
}

.composer {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.composer input {
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #e6e6e6;
  outline: none;
}

.composer button {
  padding: 8px 12px;
  border-radius: 8px;
  border: 0;
  background: linear-gradient(180deg,#4a90e2,#357ab8);
  color: white;
  cursor: pointer;
}
.composer button:disabled { opacity: 0.6; cursor: default; }
</style>