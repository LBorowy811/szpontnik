<template>
  <div class="dice-wrap">
    <button 
      class="roll-btn" 
      :disabled="rolling || !canRoll" 
      @click="rollDice" 
      aria-live="polite"
    >
      <span v-if="!rolling && canRoll">RzuÄ‡ kostkÄ…</span>
      <span v-else-if="rolling">Rzucamâ€¦</span>
      <span v-else>Czekaj...</span>
    </button>

    <div class="cube-stage" :class="{ rolling }" @animationend="onAnimEnd">
      <div
        class="cube"
        :style="{
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`
        }"
        aria-hidden="true"
      >
        <div class="face f1"><span>1</span></div>
        <div class="face f2"><span>2</span></div>
        <div class="face f3"><span>3</span></div>
        <div class="face f4"><span>4</span></div>
        <div class="face f5"><span>5</span></div>
        <div class="face f6"><span>6</span></div>
      </div>
    </div>

    <p class="result" v-if="displayValue !== null">
      Wynik: <strong>{{ displayValue }}</strong>
    </p>
  </div>
</template>

<script>
export default {
  name: "ChinczykDice",
  props: {
    canRoll: {
      type: Boolean,
      default: false
    },
    value: {
      type: Number,
      default: null
    }
  },
  data() {
    return {
      rolling: false,
      displayValue: null,
      rotX: -20,
      rotY: 20,
      targetRot: { x: -20, y: 20 }
    };
  },
  watch: {
    value(newVal) {
      if (newVal !== null && newVal !== this.displayValue) {
        this.animateToDiceValue(newVal);
      }
    }
  },
  methods: {
    rollDice() {
      if (this.rolling || !this.canRoll) return;
      this.$emit('roll');
    },

    animateToDiceValue(val) {
      this.rolling = true;
      this.displayValue = null;

      const map = {
        1: { x: 0, y: 0 },
        2: { x: 0, y: -90 },
        3: { x: 0, y: 180 },
        4: { x: 0, y: 90 },
        5: { x: -90, y: 0 },
        6: { x: 90, y: 0 }
      };

      const turnsX = 360 * (2 + Math.floor(Math.random() * 2));
      const turnsY = 360 * (2 + Math.floor(Math.random() * 2));
      const target = map[val];
      this.targetRot.x = target.x + turnsX;
      this.targetRot.y = target.y + turnsY;

      this.$nextTick(() => {
        requestAnimationFrame(() => {
          this.rotX = this.targetRot.x;
          this.rotY = this.targetRot.y;
        });
      });

      this._pendingValue = val;

      clearTimeout(this._safetyTimeout);
      this._safetyTimeout = setTimeout(() => {
        this.finishRoll();
      }, 1600);
    },

    onAnimEnd() {
      this.finishRoll();
    },

    finishRoll() {
      if (!this.rolling) return;
      this.rolling = false;
      clearTimeout(this._safetyTimeout);
      if (this._pendingValue != null) {
        this.displayValue = this._pendingValue;
        this._pendingValue = null;
      }
    }
  },
  beforeUnmount() {
    clearTimeout(this._safetyTimeout);
  }
};
</script>

<style scoped>
.dice-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  user-select: none;
}

.roll-btn {
  background: linear-gradient(180deg,#fff 0%,#f0f0f0 100%);
  border: 0;
  padding: 10px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.12);
  cursor: pointer;
  font-weight: 600;
  transition: transform .12s ease, box-shadow .12s ease;
}
.roll-btn:active { transform: translateY(1px) scale(.995); }
.roll-btn[disabled] { opacity: 0.7; cursor: default; }

.cube-stage {
  width: 70px;
  height: 70px;
  perspective: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cube {
  width: 48px;
  height: 48px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 1s cubic-bezier(.2,.8,.2,1);
}

.face {
  position: absolute;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
  border-radius: 6px;
  box-shadow: inset 0 -3px 0 rgba(0,0,0,0.08);
  backface-visibility: hidden;
  font-family: "JetBrains Mono", monospace;
  font-size: 16px;
}

.f1 { background:#1976d2; transform: rotateY(0deg) translateZ(24px); }   
.f2 { background:#43a047; transform: rotateY(90deg) translateZ(24px); }  
.f3 { background:#e53935; transform: rotateY(180deg) translateZ(24px); } 
.f4 { background:#fbc02d; transform: rotateY(-90deg) translateZ(24px); }
.f5 { background:#5c6bc0; transform: rotateX(90deg) translateZ(24px); }  
.f6 { background:#8e24aa; transform: rotateX(-90deg) translateZ(24px); } 


.face span {
  display: inline-block;
  transform: translateZ(6px);
  text-shadow: 0 1px 0 rgba(0,0,0,0.12);
}

.cube-stage.rolling .cube {
  transition: transform 1s cubic-bezier(.2,.8,.2,1);
  animation: wobble 1s ease;
}

@keyframes wobble {
  0% { transform: rotateX(0deg) rotateY(0deg) translateZ(0); }
  20% { transform: rotateX(20deg) rotateY(-20deg) translateZ(0); }
  40% { transform: rotateX(-20deg) rotateY(30deg) translateZ(0); }
  60% { transform: rotateX(30deg) rotateY(-10deg) translateZ(0); }
  80% { transform: rotateX(-10deg) rotateY(10deg) translateZ(0); }
  100% { transform: rotateX(0deg) rotateY(0deg) translateZ(0); }
}

.result {
  margin: 0;
  font-size: 14px;
  color: #222;
}
</style>

