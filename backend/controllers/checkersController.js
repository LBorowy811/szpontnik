const games = new Map();

function generateGameId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

function makeCheckersStartPieces() {
  const pieces = [];
  let id = 1;
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 8; x++) {
      if ((x + y) % 2 === 1) {
        pieces.push({
          id: id++,
          color: "black",
          x,
          y,
          type: "man",
          king: false,
        });
      }
    }
  }
  for (let y = 5; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if ((x + y) % 2 === 1) {
        pieces.push({
          id: id++,
          color: "white",
          x,
          y,
          type: "man",
          king: false,
        });
      }
    }
  }

  return pieces;
}

function inBoard(x, y) {
  return x >= 0 && x < 8 && y >= 0 && y < 8;
}

function getCaptureMovesForPiece(piece, pieces) {
  const boardMap = new Map();
  for (const p of pieces) {
    boardMap.set(`${p.x},${p.y}`, p);
  }

  const captureMoves = [];

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
          if (enemy) {
            captureMoves.push({
              x,
              y,
              capturedId: enemy.id,
            });
          }
        } else {
          if (occ.color === piece.color) {
            //nasz pionek blokuje
            break;
          } else {
            if (enemy) {
              //2 pionki pod rzad blokuja bicie
              break;
            }
            enemy = occ;
          }
        }

        x += dx;
        y += dy;
      }
    }

    return captureMoves;
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

  return captureMoves;
}

function createGame(req, res) {
  const { player1, player2 } = req.body || {};

  const gameId = generateGameId();
  const newGame = {
    id: gameId,
    players: {
      left: player1 || null,
      right: player2 || null,
    },
    pieces: makeCheckersStartPieces(),
    currentTurn: "white",
    moves: [],
    createdAt: new Date().toISOString(),

    status: "ongoing",
    drawReason: null,
    noProgressCount: 0,
    score: { left: 0, right: 0 },
  };

  games.set(gameId, newGame);

  return res.status(201).json(newGame);
}

function getGame(req, res) {
  const { id } = req.params;
  const game = games.get(id);

  if (!game) {
    return res.status(404).json({ error: "Gra o podanym ID nie istnieje" });
  }

  return res.json(game);
}

function isClearDiagonalPath(from, to, pieces, movingPieceId) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) !== Math.abs(dy)) return false;

  const stepX = dx > 0 ? 1 : -1;
  const stepY = dy > 0 ? 1 : -1;

  let x = from.x + stepX;
  let y = from.y + stepY;

  while (x !== to.x && y !== to.y) {
    const occupied = pieces.some(p => p.id !== movingPieceId && p.x === x && p.y === y);
    if (occupied) return false;
    x += stepX;
    y += stepY;
  }

  return true;
}

function hasAnyCaptureForColor(game, color) {
  const pieces = game.pieces.filter(p => p.color === color);
  for (const p of pieces) {
    const caps = getCaptureMovesForPiece(p, game.pieces);
    if (caps.length > 0) return true;
  }
  return false;
}

function getNonCaptureMovesForPiece(piece, pieces) {
  const moves = [];
  const occ = (x, y) => pieces.some(p => p.x === x && p.y === y);

  if (piece.king) {
    //krol dowolnie daleko az do przeszkody
    const dirs = [
      { dx: 1, dy: 1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },
      { dx: -1, dy: -1 },
    ];

    for (const { dx, dy } of dirs) {
      let x = piece.x + dx;
      let y = piece.y + dy;
      while (inBoard(x, y) && !occ(x, y)) {
        moves.push({ x, y });
        x += dx;
        y += dy;
      }
    }
    return moves;
  }

  //pionek o 1 do przodu
  const dirs = [];
  if (piece.color === "white") dirs.push({ dx: -1, dy: -1 }, { dx: 1, dy: -1 });
  if (piece.color === "black") dirs.push({ dx: -1, dy: 1 }, { dx: 1, dy: 1 });

  for (const { dx, dy } of dirs) {
    const x = piece.x + dx;
    const y = piece.y + dy;
    if (!inBoard(x, y)) continue;
    if (occ(x, y)) continue;
    moves.push({ x, y });
  }
  return moves;
}

function hasAnyLegalMoveForColor(game, color) {
  if (hasAnyCaptureForColor(game, color)) return true;

  const pieces = game.pieces.filter(p => p.color === color);
  for (const p of pieces) {
    const moves = getNonCaptureMovesForPiece(p, game.pieces);
    if (moves.length > 0) return true;
  }
  return false;
}

function opponentColor(color) {
  return color === "white" ? "black" : "white";
}

function finishGameIfNeeded(game) {
  if (game.status !== "ongoing") return;

  const whiteCount = game.pieces.filter(p => p.color === "white").length;
  const blackCount = game.pieces.filter(p => p.color === "black").length;

  if (whiteCount === 0) {
    game.status = "finished";
    game.winnerSide = "right";
    game.finishReason = "noPieces";
    return;
  }

  if (blackCount === 0) {
    game.status = "finished";
    game.winnerSide = "left";
    game.finishReason = "noPieces";
    return;
  }


  const turn = game.currentTurn;
  if (!hasAnyLegalMoveForColor(game, turn)) {
    game.status = "finished";
    game.winnerSide = turn === "white" ? "right" : "left";
    game.finishReason = "noMoves";
    return;
  }

  if (game.noProgressCount >= 40) {
    game.status = "draw";
    game.winner = null;
    game.finishReason = "noProgress40";
  }
}


function makeMove(req, res) {
  const { id } = req.params;

  const body = req.body || {};
  let { pieceId, from, to, capturedId, toX, toY, fromX, fromY, userId } = body;

  const game = games.get(id);
  if (!game) return res.status(404).json({ error: "Gra o podanym ID nie istnieje" });

  if ( game.status !== "ongoing") {
    if (game.status === "draw") { return res.status(400).json({ error: "Gra zakończona remisem" });}
    else return res.status(400).json({ error: "Gra jest zakończona" });
  }


  const piece = game.pieces.find((p) => p.id === pieceId);
  if (!piece) return res.status(400).json({ error: "Nie znaleziono pionka o podanym ID" });
  if (!userId) return res.status(400).json({ error: "Brak userId (ruch nieautoryzowany)" });

  const left = game.players?.left;
  const right = game.players?.right;

  let mover = null;
  if (String(left?.userId) === String(userId)) mover = left;
  if (String(right?.userId) === String(userId)) mover = right;

  if (!mover) return res.status(403).json({ error: "Nie jesteś graczem w tej grze" });
  if (!mover.color) return res.status(400).json({ error: "Kolory nie są jeszcze przypisane (brak 2 graczy?)" });

  if (piece.color !== mover.color) {
    return res.status(403).json({ error: "Nie możesz ruszać pionkami przeciwnika" });
  }

  if (game.currentTurn !== mover.color) {
    return res.status(403).json({ error: "To nie Twoja tura" });
  }

  //wymuszenie kontynuacji bicia dla tego samego pionka
if (game.mustContinueCapture) {
  //gracz
  if (String(game.mustContinueCapture.userId) !== String(userId)) {
    return res.status(403).json({ error: "To nie Twoja tura (kontynuacja bicia)" });
  }
  //pionek
  if (Number(game.mustContinueCapture.pieceId) !== Number(pieceId)) {
    return res.status(400).json({ error: "Musisz kontynuować bicie tym samym pionkiem" });
  }
  //bicie
  if (!capturedId) {
    return res.status(400).json({ error: "Musisz kontynuować bicie (zwykły ruch niedozwolony)" });
  }
}

  const wasKingBefore = piece.king;

  if (!from) {
    from = { x: fromX ?? piece.x, y: fromY ?? piece.y };
  }

  if (!to && toX != null && toY != null) {
    to = { x: toX, y: toY };
  }

  if (!to) {
    return res.status(400).json({
      error: "Brak współrzędnych docelowych (oczekiwano obiektu 'to' lub pól toX/toY)",
    });
  }

  if (!inBoard(to.x, to.y)) {
    return res.status(400).json({ error: "Pole docelowe poza planszą" });
  }

  const occupied = game.pieces.some((p) => p.id !== pieceId && p.x === to.x && p.y === to.y);
  if (occupied) return res.status(400).json({ error: "Pole docelowe jest zajęte" });

  const captureMoves = getCaptureMovesForPiece(piece, game.pieces);
  const wantsCapture = capturedId !== null && capturedId !== undefined && capturedId !== "null";

  if (wantsCapture) {
    const legal = captureMoves.find(
      (m) => m.x === to.x && m.y === to.y && String(m.capturedId) === String(capturedId)
    );
    if (!legal) {
      return res.status(400).json({ error: "Nieprawidłowe bicie" });
    }
  } else {
    if (captureMoves.length > 0) {
      return res.status(400).json({ error: "Masz bicie – zwykły ruch tym pionkiem jest niedozwolony" });
    }

    const dx = to.x - piece.x;
    const dy = to.y - piece.y;

    if (piece.king) {
      //krol moze chodzic jak chce poki nie jest blokowany
      if (Math.abs(dx) < 1 || Math.abs(dx) !== Math.abs(dy)) {
        return res.status(400).json({ error: "Król może poruszać się tylko po przekątnej" });
      }

      const clear = isClearDiagonalPath({ x: piece.x, y: piece.y }, to, game.pieces, piece.id);
      if (!clear) {
        return res.status(400).json({ error: "Na drodze króla stoi pionek" });
      }
    } else {
      if (Math.abs(dx) !== 1 || Math.abs(dy) !== 1) {
        return res.status(400).json({ error: "Dozwolony jest tylko ruch o 1 pole po skosie (albo bicie)" });
      }

      if (piece.color === "white" && dy !== -1) {
        return res.status(400).json({ error: "Białe poruszają się do góry (bez cofania)" });
      }
      if (piece.color === "black" && dy !== 1) {
        return res.status(400).json({ error: "Czarne poruszają się w dół (bez cofania)" });
      }
    }

  }

  piece.x = to.x;
  piece.y = to.y;

  if (wantsCapture && capturedId != null && capturedId !== "null") {
    const before = game.pieces.length;

    game.pieces = game.pieces.filter((p) => String(p.id) !== String(capturedId));

    const after = game.pieces.length;

    if (after < before) {
      if (!game.score) game.score = { left: 0, right: 0 };

      const moverSide =
        String(game.players?.left?.userId) === String(userId) ? "left"
        : String(game.players?.right?.userId) === String(userId) ? "right"
        : null;

      if (moverSide) game.score[moverSide] += 1;
    }
  }

  //awans
  if (!piece.king) {
    if (piece.color === "white" && piece.y === 0) {
      piece.king = true;
      piece.type = "king";
    } else if (piece.color === "black" && piece.y === 7) {
      piece.king = true;
      piece.type = "king";
    }
  }

  let hasFurtherCapture = false;
  if (wantsCapture) {
    const further = getCaptureMovesForPiece(piece, game.pieces);
    hasFurtherCapture = further.length > 0;
  }

if (wantsCapture && hasFurtherCapture) {
  game.mustContinueCapture = { userId, pieceId: piece.id };
} else {
  game.mustContinueCapture = null;
}

  const isCapture = wantsCapture;
  const isPromotion = !wasKingBefore && piece.king;
  if (!isCapture && !isPromotion) {
    game.noProgressCount = (game.noProgressCount || 0) + 1;
  } else {
    game.noProgressCount = 0;
  }
  if (game.noProgressCount >= 40 && game.status === "ongoing") {
    game.status = "draw";
    game.drawReason = "noProgress40";
  }

  game.moves.push({
    id: game.moves.length + 1,
    pieceId,
    from,
    to,
    capturedId: wantsCapture ? capturedId : null,
    time: new Date().toISOString(),
    playerName: mover?.username || "Anonim",
    playerColor: mover?.color || null,
    userId: userId,
  });

  //zmiana tury
  if (game.status === "ongoing") {
    if (!isCapture || !hasFurtherCapture) {
      game.currentTurn = game.currentTurn === "white" ? "black" : "white";
    }
  }
  finishGameIfNeeded(game);


  return res.json({ success: true, game });
}


function createGameSocket({ player1, player2, roomName } = {}) {
  const gameId = generateGameId();

  const newGame = {
    id: gameId,
    roomName: roomName || null,

    players: {
      left: player1 ? { username: player1 } : null,
      right: player2 ? { username: player2 } : null,
    },
    pieces: makeCheckersStartPieces(),
    currentTurn: "white",
    moves: [],
    createdAt: new Date().toISOString(),

    status: "ongoing",
    drawReason: null,
    noProgressCount: 0,
    score: { left: 0, right: 0 },
    mustContinueCapture: null,
    rematchReady: { left: false, right: false },
  };

  games.set(gameId, newGame);
  return newGame;
}


function getGameSocket(gameId) {
  return games.get(gameId) || null;
}

function listRoomsSocket() {
  const rooms = [];

  for (const [id, game] of games.entries()) {
    if (!game || game.status !== "ongoing") continue;

    const left = game.players?.left;
    const right = game.players?.right;

    const playersCount = (left ? 1 : 0) + (right ? 1 : 0);

    rooms.push({
      id,
      roomName: game.roomName || null,
      status: playersCount < 2 ? "waiting" : "playing",
      playersCount,
      players: {
        left: left ? { username: left.username, userId: left.userId } : null,
        right: right ? { username: right.username, userId: right.userId } : null,
      },
      createdAt: game.createdAt,
    });
  }

  rooms.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  return rooms;
}


function assignColorsIfReady(game) {
  if (!game) return;

  const left = game.players?.left;
  const right = game.players?.right;
  if (!left || !right) return;

  //blokuj ponowne losowanie
  if (left.color && right.color) return;
  const leftIsWhite = Math.random() < 0.5;

  game.players.left.color = leftIsWhite ? "white" : "black";
  game.players.right.color = leftIsWhite ? "black" : "white";

  //biale zaczynaja
  game.currentTurn = "white";
}


function joinGameSocket({ gameId, side, username, userId, socketId }) {
  const game = games.get(gameId);
  if (!game) return { ok: false, error: "Gra o podanym ID nie istnieje" };

  if (!side) return { ok: true, game };

  if (side !== "left" && side !== "right") {
    return { ok: false, error: "Nieprawidłowa strona (left/right)" };
  }

  if (!userId) return { ok: false, error: "Brak userId" };
  if (!username) username = "Anonim";

  const current = game.players?.[side];

  if (current && current.socketId && current.socketId !== socketId) {
    if (current.userId === userId) {
      game.players[side] = { ...current, username, userId, socketId };
      assignColorsIfReady(game);
      return { ok: true, game };
    }
    return { ok: false, error: "To miejsce jest już zajęte" };
  }

  game.players[side] = { username, userId, socketId };
  assignColorsIfReady(game);

  return { ok: true, game };
}

function getSideByUserId(game, userId) {
  if (!game?.players) return null;
  if (String(game.players?.left?.userId) === String(userId)) return "left";
  if (String(game.players?.right?.userId) === String(userId)) return "right";
  return null;
}

function setRematchReady(gameId, userId) {
  const game = games.get(gameId);
  if (!game) return { ok: false, error: "Gra nie istnieje" };

  //rematch tylko jesli gra sie zakonczyla
  if (game.status === "ongoing") {
    return { ok: false, error: "Gra jeszcze trwa" };
  }

  const side = getSideByUserId(game, userId);
  if (!side) return { ok: false, error: "Nie jesteś graczem w tej grze" };

  if (!game.rematchReady) game.rematchReady = { left: false, right: false };
  game.rematchReady[side] = true;

  const count = (game.rematchReady.left ? 1 : 0) + (game.rematchReady.right ? 1 : 0);
  const bothReady = count === 2;

  return { ok: true, game, count, bothReady };
}

function createRematchGameFromOld(oldGame) {
  const gameId = generateGameId();

  const left = oldGame.players?.left ? { ...oldGame.players.left } : null;
  const right = oldGame.players?.right ? { ...oldGame.players.right } : null;

  const newGame = {
    id: gameId,
    roomName: oldGame.roomName || null,

    players: { left, right },
    pieces: makeCheckersStartPieces(),
    currentTurn: "white",
    moves: [],
    createdAt: new Date().toISOString(),
    status: "ongoing",
    drawReason: null,
    noProgressCount: 0,
    score: { left: 0, right: 0 },
    mustContinueCapture: null,
    rematchReady: { left: false, right: false },
  };

  assignColorsIfReady(newGame);

  games.set(gameId, newGame);
  return newGame;
}



module.exports = {
  createGame,
  getGame,
  makeMove,
  createGameSocket,
  getGameSocket,
  joinGameSocket,
  setRematchReady,
  createRematchGameFromOld,
  listRoomsSocket,
};

