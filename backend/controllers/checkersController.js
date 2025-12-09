const games = new Map();

function generateGameId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

//funkcja do "generowania" pionków
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
            // nasz pionek blokuje
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

    //remis
    status: "ongoing",
    drawReason: null,
    noProgressCount: 0
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

function makeMove(req, res) {
  const { id } = req.params;

  const body = req.body || {};
  let { pieceId, from, to, capturedId, toX, toY, fromX, fromY } = body;

  const game = games.get(id);
  if (!game) {
    return res.status(404).json({ error: "Gra o podanym ID nie istnieje" });
  }

  if (game.status === "draw") {
    return res.status(400).json({ error: "Gra zakończona remisem" });
  }

  const piece = game.pieces.find((p) => p.id === pieceId);
  if (!piece) {
    return res
      .status(400)
      .json({ error: "Nie znaleziono pionka o podanym ID" });
  }

  //jesli pionek dostal awans wczesniej musi zostac krolem mimo e wychodzi z pola awansu
  const wasKingBefore = piece.king;

  if (!from) {
    from = {
      x: fromX ?? piece.x,
      y: fromY ?? piece.y,
    };
  }

  if (!to && toX != null && toY != null) {
    to = { x: toX, y: toY };
  }

  if (!to) {
    return res.status(400).json({
      error:
        "Brak współrzędnych docelowych (oczekiwano obiektu 'to' lub pól toX/toY)",
    });
  }
  //sprawdzenie czy gracz nie probuje poruszyc sie poza plansze
  if (!inBoard(to.x, to.y)) {
    return res.status(400).json({ error: "Pole docelowe poza planszą" });
  }
  piece.x = to.x;
  piece.y = to.y;

  //rankup na krola
  if (!piece.king) {
    if (piece.color === "white" && piece.y === 0) {
      piece.king = true;
      piece.type = "king";
    } else if (piece.color === "black" && piece.y === 7) {
      piece.king = true;
      piece.type = "king";
    }
  }

  if (capturedId) {
    game.pieces = game.pieces.filter((p) => p.id !== capturedId);
  }

  //czy isteniaj inee mozliwe bicia (kolejne)
  let hasFurtherCapture = false;
  if (capturedId) {
    const further = getCaptureMovesForPiece(piece, game.pieces);
    hasFurtherCapture = further.length > 0;
  }

  const isCapture = !!capturedId;
  const isPromotion = !wasKingBefore && piece.king;

  if (!isCapture && !isPromotion) {
    game.noProgressCount = (game.noProgressCount || 0) + 1;
  } else {
    game.noProgressCount = 0;
  }
  //bez bicia lub awansu po 40 ruchach status zmieni sie na draw co blokuje kolejne ruchy
  if (game.noProgressCount >= 40 && game.status === "ongoing") {
    game.status = "draw";
    game.drawReason = "noProgress40";
  }

  //zapis do tabeli ruchow
  game.moves.push({
    id: game.moves.length + 1,
    pieceId,
    from,
    to,
    capturedId: capturedId || null,
    time: new Date().toISOString(),
  });

  //blokada ruchu przy innym statusie niz "ongoing" a jesli wystepuja inne mozliwe bicia po wykonanym biciu dalej ten sam gracz ma ruch
  if (game.status === "ongoing") {
    if (!capturedId || !hasFurtherCapture) {
      game.currentTurn =
        game.currentTurn === "white" ? "black" : "white";
    }
  }

  return res.json({
    success: true,
    game,
  });
}

module.exports = {
  createGame,
  getGame,
  makeMove,
};
