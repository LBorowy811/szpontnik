<template>
  <GameLayout
    :score="score"
    :moves="moves"
    :game-id="state.gameId"
    @join="handleJoin"
  >
    <template #board>
      <BoardCheckers
        :pieces="state.pieces"
        :selected-piece="state.selectedPiece"
        @piece-click="handlePieceClick"
        @square-click="handleSquareClick"
      />
    </template>
  </GameLayout>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import GameLayout from "@/games/GameLayout.vue";
import BoardCheckers from "@/components/checkers/BoardCheckers.vue";

const API_URL = "http://localhost:3000/api/checkers";
const POLL_INTERVAL_MS = 1000;
const INITIAL_PIECES_PER_COLOR = 12;

const route = useRoute();
const router = useRouter();

let pollTimer = null;

const score = reactive({ left: 0, right: 0 }); //lewy bialy prawy czarny
const moves = ref([]);

const state = reactive({
  gameId: null,
  pieces: [],
  currentTurn: "white",
  selectedPiece: null,
  validMoves: [],
  isChainCapture: false,
  chainPieceId: null,

// stan gry
  status: "ongoing",
  drawReason: null,
  noProgressCount: 0
});

function updateScoreFromPieces(pieces) {
  const whiteLeft = pieces.filter(p => p.color === "white").length;
  const blackLeft = pieces.filter(p => p.color === "black").length;

  const capturedByWhite = INITIAL_PIECES_PER_COLOR - blackLeft;
  const capturedByBlack = INITIAL_PIECES_PER_COLOR - whiteLeft;

  score.left = capturedByWhite;
  score.right = capturedByBlack;
}

function applyGame(game) {
  state.gameId = game.id;
  state.pieces = game.pieces;
  state.currentTurn = game.currentTurn || "white";
  moves.value = game.moves ?? [];

  state.status = game.status || "ongoing";
  state.drawReason = game.drawReason || null;
  state.noProgressCount = game.noProgressCount ?? 0;

  updateScoreFromPieces(game.pieces);

  console.log("STATUS GRY:", state.status,"powód:", state.drawReason,"noProgressCount:",state.noProgressCount, "tura:", state.currentTurn);
}

async function loadGameById(id) {
  try {
    const res = await axios.get(`${API_URL}/${id}`);
    applyGame(res.data);
  } catch (e) {
    console.error("Błąd wczytywania gry", e);
  }
}

async function createGame() {
  try {
    const res = await axios.post(`${API_URL}/new`, {
      player1: "Damian",
      player2: "Przeciwnik",
    });
    applyGame(res.data);

    state.isChainCapture = false;
    state.chainPieceId = null;

    console.log("Nowa gra:", res.data.id);
  } catch (e) {
    console.error("Błąd tworzenia gry", e);
  }
}

function startPolling() {
  if (pollTimer) return;

  pollTimer = setInterval(async () => {
    if (!state.gameId) return;
    try {
      const res = await axios.get(`${API_URL}/${state.gameId}`);
      applyGame(res.data);
    } catch (e) {
      console.error("Błąd pollingu gry", e);
    }
  }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function handleJoin() {
}

function getMovesForPiece(piece) {
  const boardMap = new Map();
  for (const p of state.pieces) {
    boardMap.set(`${p.x},${p.y}`, p);
  }

  const simpleMoves = [];
  const captureMoves = [];

  const inBoard = (x, y) => x >= 0 && x < 8 && y >= 0 && y < 8;

  if (piece.king) {
    const dirs = [
      { dx: 1, dy: 1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },
      { dx: -1, dy: -1 },
    ];

    for (const { dx, dy } of dirs) {
      let x = piece.x + dx;
      let y = piece.y + dy;
      let enemy = null;

      while (inBoard(x, y)) {
        const key = `${x},${y}`;
        const occ = boardMap.get(key);

        if (!occ) {
          if (!enemy) {
            simpleMoves.push({ x, y, capturedId: null });
          } else {
            captureMoves.push({ x, y, capturedId: enemy.id });
          }
        } else {
          if (occ.color === piece.color) {
            break;
          } else {
            if (enemy) break;
            enemy = occ;
          }
        }

        x += dx;
        y += dy;
      }
    }
    return { simpleMoves, captureMoves };
  }

  const moveDirs = [];
  if (piece.color === "white") {
    moveDirs.push({ dx: -1, dy: -1 }, { dx: 1, dy: -1 });
  } else {
    moveDirs.push({ dx: -1, dy: 1 }, { dx: 1, dy: 1 });
  }

  for (const { dx, dy } of moveDirs) {
    const x = piece.x + dx;
    const y = piece.y + dy;
    if (!inBoard(x, y)) continue;
    if (boardMap.has(`${x},${y}`)) continue;
    simpleMoves.push({ x, y, capturedId: null });
  }

  const captureDirs = [
    { dx: -1, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: 1, dy: 1 },
  ];

  for (const { dx, dy } of captureDirs) {
    const midX = piece.x + dx;
    const midY = piece.y + dy;
    const landX = piece.x + 2 * dx;
    const landY = piece.y + 2 * dy;

    if (!inBoard(midX, midY) || !inBoard(landX, landY)) continue;

    const middle = boardMap.get(`${midX},${midY}`);
    const landing = boardMap.get(`${landX},${landY}`);

    if (
      middle &&
      middle.color !== piece.color &&
      !landing
    ) {
      captureMoves.push({
        x: landX,
        y: landY,
        capturedId: middle.id,
      });
    }
  }

  return { simpleMoves, captureMoves };
}

function isValidTarget(x, y) {
  return state.validMoves.some((m) => m.x === x && m.y === y);
}

function getMoveForTarget(x, y) {
  return state.validMoves.find((m) => m.x === x && m.y === y) || null;
}

function checkFurtherCaptures(pieceId) {
  const piece = state.pieces.find((p) => p.id === pieceId);
  if (!piece) return false;

  const { captureMoves } = getMovesForPiece(piece);
  if (captureMoves.length === 0) return false;

  state.selectedPiece = piece;
  state.validMoves = captureMoves;
  state.isChainCapture = true;
  state.chainPieceId = pieceId;

  console.log("Kontynuacja bicia – możliwe ruchy:", captureMoves);
  return true;
}

function handlePieceClick(piece) {
  if (state.status !== "ongoing") return;
  //kiedy mozliwe jest bicie pionkiem ktory zbilismy nie mozemy ruszyc sie innym pionkiem
  if (state.isChainCapture) return;
  //"ruch"/ture przypisuje backend
  if (piece.color !== state.currentTurn) return;

  if (state.selectedPiece && state.selectedPiece.id === piece.id) {
    state.selectedPiece = null;
    state.validMoves = [];
    return;
  }

  const { simpleMoves, captureMoves } = getMovesForPiece(piece);

  state.selectedPiece = piece;
  state.isChainCapture = false;
  state.chainPieceId = null;

  //przymus bicia
  state.validMoves =
    captureMoves.length > 0 ? captureMoves : simpleMoves;
  console.log("Wybrany pionek:", piece, "ruchy:", state.validMoves);
}

async function handleSquareClick(pos) {
  if (state.status !== "ongoing") return;

  console.log("Klik na polu:", pos, "selected:", state.selectedPiece);

  if (!state.selectedPiece) {
    console.log("Brak wybranego pionka -> nic nie robię");
    return;
  }
  if (!isValidTarget(pos.x, pos.y)) {
    console.log("Kliknięte pole NIE jest dozwolonym ruchem");
    return;
  }

  const move = getMoveForTarget(pos.x, pos.y);
  const capturedId = move?.capturedId ?? null;
  const movingPieceId = state.selectedPiece.id;

  const from = { x: state.selectedPiece.x, y: state.selectedPiece.y };
  const to = { x: pos.x, y: pos.y };

  console.log("Wysyłam ruch do backendu:", {
    gameId: state.gameId,
    pieceId: movingPieceId,
    from,
    to,
    capturedId,
  });

  try {
    const res = await axios.post(`${API_URL}/${state.gameId}/move`, {
      pieceId: movingPieceId,
      from,
      to,
      capturedId,
    });
    console.log("Ruch zapisany (od backendu):", res.data);

    applyGame(res.data.game);

    //zbilem?spr czy wystepuje innne bicie
    if (capturedId && checkFurtherCaptures(movingPieceId)) {
      //backend nie zmienia tury bo sa inne bicia
      return;
    }

    //vrak dalszych bic
    state.selectedPiece = null;
    state.validMoves = [];
    state.isChainCapture = false;
    state.chainPieceId = null;
  } catch (e) {
    console.error("Błąd ruchu", e);
  }
}

onMounted(async () => {
  const gameIdFromUrl = route.query.gameId;

  if (gameIdFromUrl) {
    //lacznie z istaniejaca gra
    await loadGameById(gameIdFromUrl);
  } else {
    //jesli nie ma takiego id tworzymy gre
    await createGame();

    //id w linku
    if (state.gameId) {
      router.replace({
        query: {
          ...route.query,
          gameId: state.gameId,
        },
      });
    }
  }

  startPolling();
});

onUnmounted(() => {
  stopPolling();
});
</script>
