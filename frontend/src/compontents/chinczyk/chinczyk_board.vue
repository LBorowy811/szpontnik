<template>
  <div class="board">
    <div
      v-for="(cell, index) in cells"
      :key="index"
      class="cell"
      :class="[cell.type, cell.extraClass || '']"
    >
      <ChinczykPawn v-if="cell.pawn" :pawn="{ color: cell.pawn }" />
    </div>
  </div>
</template>

<script>
import ChinczykPawn from './chinczyk_pawn.vue';

export default {
  name: "ChinczykBoard",
  components: { ChinczykPawn },
  data() {
    const size = 11;
    const is = (r, c, arr) => arr.some(p => p.r === r && p.c === c);

    // homes (2x2)
    const homes = {
      red: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
      blue: [{ r: 0, c: 9 }, { r: 0, c: 10 }, { r: 1, c: 9 }, { r: 1, c: 10 }],
      yellow: [{ r: 9, c: 9 }, { r: 9, c: 10 }, { r: 10, c: 9 }, { r: 10, c: 10 }],
      green: [{ r: 9, c: 0 }, { r: 9, c: 1 }, { r: 10, c: 0 }, { r: 10, c: 1 }]
    };

    // starting path areas (wypełnione kolorami)
    const startPaths = {
      red: [{ r: 5, c: 1 }, { r: 5, c: 2 }, { r: 5, c: 3 }, { r: 5, c: 4 }],
      blue: [{ r: 1, c: 5 }, { r: 2, c: 5 }, { r: 3, c: 5 }, { r: 4, c: 5 }],
      yellow: [{ r: 6, c: 5 }, { r: 7, c: 5 }, { r: 8, c: 5 }, { r: 9, c: 5 }],
      green: [{ r: 5, c: 6 }, { r: 5, c: 7 }, { r: 5, c: 8 }, { r: 5, c: 9 }]
    };

    // starting pawns placed in homes (rogach planszy)
    const startingPawns = {
      red: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
      blue: [{ r: 0, c: 9 }, { r: 0, c: 10 }, { r: 1, c: 9 }, { r: 1, c: 10 }],
      yellow: [{ r: 9, c: 9 }, { r: 9, c: 10 }, { r: 10, c: 9 }, { r: 10, c: 10 }],
      green: [{ r: 9, c: 0 }, { r: 9, c: 1 }, { r: 10, c: 0 }, { r: 10, c: 1 }]
    };

    // outer loop path
    const outerPath = [
      { r: 0, c: 4 }, { r: 0, c: 5 }, { r: 0, c: 6 },
      { r: 1, c: 4 }, { r: 2, c: 4 }, { r: 3, c: 4 }, { r: 4, c: 4 }, { r: 4, c: 3 }, { r: 4, c: 2 }, { r: 4, c: 1 },
      { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 },
      { r: 7, c: 4 }, { r: 8, c: 4 }, { r: 9, c: 4 },
      { r: 9, c: 6 }, { r: 8, c: 6 }, { r: 7, c: 6 }, { r: 6, c: 6 }, { r: 6, c: 7 },  { r: 6, c: 8 }, { r: 6, c: 9 },
      { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 },
      { r: 4, c: 7 }, { r: 4, c: 8 }, { r: 4, c: 9 },
      { r: 4, c: 10 }, { r: 5, c: 10 }, { r: 6, c: 10 },
      { r: 10, c: 6 }, { r: 10, c: 5 }, { r: 10, c: 4 },
      { r: 6, c: 0 }, { r: 5, c: 0 }, { r: 4, c: 0 },
    ];

    // special colored path positions
    const special = [
      { r: 0, c: 6, color: "blue" },
      { r: 6, c: 10, color: "yellow" },
      { r: 10, c: 4, color: "green" },
      { r: 4, c: 0, color: "red" }
    ];

    // build cells
    const cells = Array.from({ length: size * size }).map((_, i) => {
      const r = Math.floor(i / size);
      const c = i % size;

      let type = "empty";
      let extraClass = "";
      let pawn = null;

      // homes (2x2) - wypełnione kolorami
      if (is(r, c, homes.red)) {
        type = "home home-red";
      } else if (is(r, c, homes.blue)) {
        type = "home home-blue";
      } else if (is(r, c, homes.green)) {
        type = "home home-green";
      } else if (is(r, c, homes.yellow)) {
        type = "home home-yellow";
      }

      // center cell
      if (r === 5 && c === 5) {
        type = "center";
        pawn = null;
      }

      // main cross (middle row/column)
      if ((r === 5 || c === 5) && !(r === 5 && c === 5)) {
        type = "path";
      }

      // outer loop path
      if (is(r, c, outerPath)) {
        type = "path";
        extraClass = "outer";
      }

      // starting path areas - wypełnione odpowiednimi kolorami
      if (is(r, c, startPaths.red)) {
        type = "path";
        extraClass = "start-red";
      } else if (is(r, c, startPaths.blue)) {
        type = "path";
        extraClass = "start-blue";
      } else if (is(r, c, startPaths.yellow)) {
        type = "path";
        extraClass = "start-yellow";
      } else if (is(r, c, startPaths.green)) {
        type = "path";
        extraClass = "start-green";
      }

      // special colored path positions
      const sp = special.find(p => p.r === r && p.c === c);
      if (sp) {
        type = "path";
        extraClass = `special-${sp.color}`;
      }

      // add starting pawns (w homach/rogach)
      if (is(r, c, startingPawns.red)) {
        pawn = "red";
      } else if (is(r, c, startingPawns.blue)) {
        pawn = "blue";
      } else if (is(r, c, startingPawns.yellow)) {
        pawn = "yellow";
      } else if (is(r, c, startingPawns.green)) {
        pawn = "green";
      }

      return { type, extraClass, pawn };
    });

    return { cells };
  }
};
</script>

<style scoped>
.board {
  display: grid;
  grid-template-columns: repeat(11, 44px);
  grid-template-rows: repeat(11, 44px);
  gap: 6px;
  width: max-content;
  padding: 14px;
  background: #efefef;
  border-radius: 10px;
}

.cell {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  background: transparent;
}

.cell.empty { background: transparent; }

/* homes - wypełnione rozjaśnionymi kolorami */
.home {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  border: 2px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home.home-red { background: #ffcccc; }
.home.home-blue { background: #cce5ff; }
.home.home-green { background: #ccffcc; }
.home.home-yellow { background: #ffffcc; }

/* center */
.center {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  border: 2px solid #cfcfcf;
  background:
    linear-gradient(135deg, rgba(255,119,119,0.95) 25%, transparent 25%) ,
    linear-gradient(45deg, rgba(119,170,255,0.95) 25%, transparent 25%) ,
    linear-gradient(225deg, rgba(119,255,119,0.95) 25%, transparent 25%) ,
    linear-gradient(315deg, rgba(255,247,119,0.95) 25%, transparent 25%);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* path cells - białe kółka z ciemną obwódką */
.cell.path {
  background: #ffffff;
  border-radius: 50%;
  border: 3px solid #333;
  width: 44px;
  height: 44px;
  box-shadow: 0 1px 0 rgba(0,0,0,0.06) inset;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* outer path */
.cell.path.outer {
  background: #ffffff;
  border-color: #333;
}

/* starting path areas - wypełnione rozjaśnionymi kolorami (kółka) */
.cell.path.start-red {
  background: #ffcccc;
  border-color: #333;
}

.cell.path.start-blue {
  background: #cce5ff;
  border-color: #333;
}

.cell.path.start-green {
  background: #ccffcc;
  border-color: #333;
}

.cell.path.start-yellow {
  background: #ffffcc;
  border-color: #333;
}

/* special colored path cells */
.cell.path.special-blue { background: #1976d2; border-color: #333; }
.cell.path.special-yellow { background: #fbc02d; border-color: #333; }
.cell.path.special-green { background: #43a047; border-color: #333; }
.cell.path.special-red { background: #e53935; border-color: #333; }

/* pawn sizing */
.cell.path .pawn { width: 28px; height: 28px; }
.home .pawn { width: 20px; height: 20px; }

@media (max-width: 600px) {
  .board { transform: scale(0.9); transform-origin: top left; }
}
</style>