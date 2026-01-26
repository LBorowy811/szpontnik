const gameUtils = require('../utils/gameUtils');

const games = new Map();

function createEmptyBoard() {
    return [
        [null, null, null],
        [null, null, null],
        [null, null, null]
    ]
}

function checkWinner(board) {
    // wiersze
    for (let i = 0; i < 3; i++) {
        if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
            return board[i][0];
        }
    }

    // kolumny
    for (let i = 0; i < 3; i++) {
        if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
            return board[0][i];
        }
    }
    
    // przekątne
    if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
        return board[0][0];
    }
    if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
        return board[0][2];
    }
  
    return null;
}

function isBoardFull(board) {
    for ( let row  of board) {
        for (let cell of row) {
            if (!cell) return false;
        }
    }
    return true
}

function createGameSocket({ roomName, ranked = false, tournamentId, matchId } = {}) {
    const gameId = gameUtils.generateGameId();

    const newGame = {
      id: gameId,
      roomName: roomName || null,
      tournamentId: tournamentId || null,
      matchId: matchId || null,
      ranked: ranked,
      players: [], // gracze jako tablica nie left/right
      maxPlayers: 2,
      minPlayers: 2,
      board: createEmptyBoard(),
      currentTurn: "X",
      moves: [],
      score: [0, 0],
      createdAt: new Date().toISOString(),
      status: "ongoing",
      winner: null,
      rematchReady: {},
    };

    games.set(gameId, newGame);
    return newGame;
  }

function getGameSocket(gameId) {
    return gameUtils.getGameSocket(games, gameId);
}

function deleteGameSocket(gameId) {
    return gameUtils.deleteGameSocket(games, gameId);
}

function listRoomsSocket() {
    return gameUtils.listRoomsSocket(games);
}

function assignSymbolsIfReady(game) {
    if (!game) return;
  
    if (!Array.isArray(game.players) || game.players.length < 2) return;
  
    const player0 = game.players[0];
    const player1 = game.players[1];
    if (!player0 || !player1) return;
  
    if (player0.symbol && player1.symbol) return;
    
    const randomPlayerGetsX = Math.random() < 0.5 ? player0 : player1;
    const otherPlayer = randomPlayerGetsX === player0 ? player1 : player0;
  
    randomPlayerGetsX.symbol = "X";
    otherPlayer.symbol = "O";
  
    game.currentTurn = "X";
  }

function joinGameSocket({ gameId, username, userId, socketId }) {
    const game = games.get(gameId);
    if (!game) return { ok: false, error: "Gra o podanym ID nie istnieje" };

    // Jeśli to gra turniejowa i jeszcze się nie rozpoczęła, sprawdź czy gracz może dołączyć JAKO GRACZ
    if (game.tournamentId && game.matchId && game.players.length < (game.maxPlayers || 2)) {
      const tournamentController = require('./tournamentController');
      const canJoin = tournamentController.canPlayerJoinMatch(game.tournamentId, game.matchId, userId);
      
      if (!canJoin.ok) {
        return canJoin; // Zwróć błąd walidacji
      }
    }

    return gameUtils.joinGameSocketBase(games, { gameId, username, userId, socketId }, assignSymbolsIfReady);
}

function makeMove(req, res) {
    const { id } = req.params;
    const body = req.body || {};
    const { x, y, userId } = body;

    const game = games.get(id);
    if (!game) return res.status(404).json({ error: "Gra o podanym ID nie istnieje" });

    if (game.status !== "ongoing") {
        if (game.status !== "draw") {
            return res.status(400).json({ error: "Gra zakończona remisem" });
        }
        return res.status(400).json({ error: "Gra jest zakończona" });
    }

    if (x === undefined || y === undefined) {
        return res.status(400).json({ error: "Brak współrzędnych: x, y"});
    }

    if (x < 0 || x > 2 || y < 0 || y > 2) {
        return res.status(400).json({ error: "Współrzędne poza planszą" });
    }

    if (game.board[y][x] !== null) {
        return res.status(400).json({ error: "Pole jest już zajęte" });
    }

    if (!userId) return res.status(400).json({ error: "Brak userId" });

    const mover = game.players?.find(p => String(p.userId) === String(userId));

    if (!mover) return res.status(403).json({ error: "Nie jesteś graczem w tej grze" });
    if (!mover.symbol) return res.status(400).json({ error: "Symbole nie są jeszcze przypisane" });

    if (game.currentTurn !== mover.symbol) {
        return res.status(403).json({ error: "To nie twoja tura" });
    }

    game.board[y][x] = mover.symbol;

    const winner = checkWinner(game.board);
    const isDraw = !winner && isBoardFull(game.board);

    if (winner) {
        game.status = "finished";
        game.winner = winner;
        const moverIndex = game.players.findIndex(p => String(p.userId) === String(userId));
        game.winnerIndex = moverIndex;
        if (!game.score) game.score = [0, 0];
        if (moverIndex !== null && moverIndex >= 0 && moverIndex < 2) {
            game.score[moverIndex] += 1;
        }
    } else if (isDraw) {
        game.status = "draw";
        game.winner = null;
    } else {
        game.currentTurn = game.currentTurn === "X" ? "O" : "X";
    }

    if (!game.moves) {
        game.moves = [];
    }

    game.moves.push({
        id: game.moves.length + 1,
        x,
        y,
        symbol: mover.symbol,
        time: new Date().toISOString(),
        playerName: mover?.username || "Anonim",
        userId: userId,
    });
    return res.json({ success: true, game });
}

function setRematchReady(gameId, userId) {
    return gameUtils.setRematchReady(games, gameId, userId);
}

function createRematchGameFromOld(oldGame) {
    const gameId = gameUtils.generateGameId();
    const lastScore = [...(oldGame.score || [0, 0])];
    const newGame = {
      id: gameId,
      roomName: oldGame.roomName || null,
      ranked: oldGame.ranked || false,
      players: oldGame.players ? oldGame.players.map(p => {
        const newP = { ...p };
        delete newP.symbol; // Usuń symbol dla rematchu
        return newP;
      }) : [],
      maxPlayers: oldGame.maxPlayers || 2,
      minPlayers: oldGame.minPlayers || 2,
      board: createEmptyBoard(),
      currentTurn: "X",
      moves: [],
      score: lastScore,
      status: "ongoing",
      winner: null,
      rematchReady: {},
    };
  
    assignSymbolsIfReady(newGame);
    games.set(gameId, newGame);
    return newGame;
  }

module.exports = {
    createGameSocket,
    getGameSocket,
    joinGameSocket,
    listRoomsSocket,
    makeMove,
    setRematchReady,
    createRematchGameFromOld,
    deleteGameSocket,
};