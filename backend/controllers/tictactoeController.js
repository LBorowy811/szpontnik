const games = new Map();

function generateGameId() {
    return (
        Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    )
}

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

function createGameSocket({ roomName } = {}) {
    const gameId = generateGameId();

    const newGame = {
        id: gameId,
        roomName: roomName || null,
        players: {
            left: null,
            right: null,
        },
        board: createEmptyBoard(),
        currentTurn: "X",
        moves: [],
        createdAt: new Date().toISOString(),
        status: "ongoing",
        winner: null,
        rematchReady: { left: false, right: false },
    };

    games.set(gameId, newGame);
    return newGame;
}

function getGameSocket(gameId) {
    return games.get(gameId) || null;
}

function deleteGameSocket(gameId) {
    return games.delete(gameId);
}

function listRoomsSocket() {
    const rooms = [];

    for (const [id, game] of games.entries()) {
        if (!game || game.status !== "ongoing") continue;

        const left = game.players?.left;
        const right = game.players?.right;
        const playersCount = (left ? 1 : 0) + (right ? 1 : 0)

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

function assignSymbolsIfReady(game) {
    if (!game) return;

    const left = game.players?.left;
    const right = game.players?.right;
    if (!left || !right) return;

    if (left.symbol && right.symbol) return;

    const leftIsX = Math.random() < 0.5;
    game.players.left.symbol = leftIsX ? "X" : "O";
    game.players.right.symbol = leftIsX ? "O" : "X";

    game.currentTurn = "X";
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

    const leftUserId = game.players?.left?.userId ? String(game.players.left.userId) : null;
    const rightUserId = game.players?.right?.userId ? String(game.players.right.userId) : null;
    const currentUserId = String(userId);

    if (leftUserId === currentUserId) {
        if (side === "left") {
            game.players.left = { ...game.players.left, username, userId, socketId };
            assignSymbolsIfReady(game);
            return { ok: true, game };
        } else {
            return { ok: false, error: "Już jesteś w grze jako lewy gracz" };
        }
    }

    if (rightUserId === currentUserId) {
        if (side === "right") {
            game.players.right = { ...game.players.right, username, userId, socketId };
            assignSymbolsIfReady(game);
            return { ok: true, game };
        } else {
            return { ok: false, error: "Już jesteś w grze jako prawy gracz" };
        }
    }

    const current = game.players?.[side];
    if (current && current.userId) {
        return { ok: false, error: "To miejsce jest już zajęte" };
    }

    game.players[side] = { username, userId, socketId };
    assignSymbolsIfReady(game);

    return { ok: true, game };
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

    const left = game.players?.left;
    const right = game.players?.right;

    let mover = null;
    if (String(left?.userId) === String(userId)) mover = left;
    if (String(right?.userId) === String(userId)) mover = right;

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
        game.winnerSide = mover.symbol === left?.symbol ? "left" : "right";
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

function getSideByUserId(game, userId) {
    if (!game.players) return null;
    if (String(game.players?.left?.userId) === String(userId)) return "left";
    if (String(game.players?.right?.userId) === String(userId)) return "right";
    return null;
}

function setRematchReady(gameId, userId) {
    const game = games.get(gameId);
    if (!game) return { ok: false, error: "Gra nie istnieje" };
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

    if (left) delete left.symbol;
    if (right) delete right.symbol;

    const newGame = {
        id: gameId,
        roomName: oldGame.roomName || null,
        players: { left, right },
        board: createEmptyBoard(),
        currentTurn: "X",
        moves: [],
        status: "ongoing",
        winner: null,
        rematchReady: { left: false, right: false },
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