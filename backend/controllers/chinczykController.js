const gameUtils = require('../utils/gameUtils');
const games = new Map(); // Zmieniono z rooms na games dla zgodnoĹ›ci
class ChinczykController {
  constructor() {
    this.colors = ['red', 'blue', 'green', 'yellow'];
    this.mainPath = [
      { r: 4, c: 0 },
      { r: 4, c: 1 }, { r: 4, c: 2 }, { r: 4, c: 3 }, { r: 4, c: 4 },
      { r: 3, c: 4 }, { r: 2, c: 4 }, { r: 1, c: 4 }, { r: 0, c: 4 },
      { r: 0, c: 5 }, { r: 0, c: 6 },
      { r: 1, c: 6 }, { r: 2, c: 6 }, { r: 3, c: 6 }, { r: 4, c: 6 },
      { r: 4, c: 7 }, { r: 4, c: 8 }, { r: 4, c: 9 }, { r: 4, c: 10 },
      { r: 5, c: 10 }, { r: 6, c: 10 },
      { r: 6, c: 9 }, { r: 6, c: 8 }, { r: 6, c: 7 }, { r: 6, c: 6 },
      { r: 7, c: 6 }, { r: 8, c: 6 }, { r: 9, c: 6 }, { r: 10, c: 6 },
      { r: 10, c: 5 }, { r: 10, c: 4 },
      { r: 9, c: 4 }, { r: 8, c: 4 }, { r: 7, c: 4 }, { r: 6, c: 4 },
      { r: 6, c: 3 }, { r: 6, c: 2 }, { r: 6, c: 1 }, { r: 6, c: 0 },
      { r: 5, c: 0 }
    ];
    this.goalPaths = {
      red: [{ r: 5, c: 1 }, { r: 5, c: 2 }, { r: 5, c: 3 }, { r: 5, c: 4 }],
      blue: [{ r: 1, c: 5 }, { r: 2, c: 5 }, { r: 3, c: 5 }, { r: 4, c: 5 }],
      yellow: [{ r: 5, c: 9 }, { r: 5, c: 8 }, { r: 5, c: 7 }, { r: 5, c: 6 }],
      green: [{ r: 9, c: 5 }, { r: 8, c: 5 }, { r: 7, c: 5 }, { r: 6, c: 5 }]
    };
    this.startPositions = {
      red: 0,
      blue: 10,
      yellow: 20,
      green: 30
    };
    this.homePositions = {
      red: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
      blue: [{ r: 0, c: 9 }, { r: 0, c: 10 }, { r: 1, c: 9 }, { r: 1, c: 10 }],
      green: [{ r: 9, c: 0 }, { r: 9, c: 1 }, { r: 10, c: 0 }, { r: 10, c: 1 }],
      yellow: [{ r: 9, c: 9 }, { r: 9, c: 10 }, { r: 10, c: 9 }, { r: 10, c: 10 }]
    };
  }
  createRoom(playerName, playerId, maxPlayers = 4) {
    const roomId = this.generateRoomId();
    const room = {
      id: roomId,
      maxPlayers: Math.min(Math.max(maxPlayers, 2), 4),
      players: [{ id: playerId, name: playerName }],
      creatorId: playerId,
      gameState: null,
      gameStarted: false,
      createdAt: Date.now()
    };
    rooms.set(roomId, room);
    return { success: true, roomId, playerId, players: room.players };
  }
  joinRoom(roomId, playerName, playerId) {
    const room = rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'PokĂłj nie istnieje' };
    }
    if (room.gameStarted) {
      return { success: false, error: 'Gra juĹĽ siÄ™ rozpoczÄ™Ĺ‚a' };
    }
    if (room.players.length >= room.maxPlayers) {
      return { success: false, error: 'PokĂłj jest peĹ‚ny' };
    }
    if (room.players.some(p => p.id === playerId)) {
      return { success: false, error: 'JuĹĽ jesteĹ› w tym pokoju' };
    }
    room.players.push({ id: playerId, name: playerName });
    return { success: true, roomId, playerId, players: room.players };
  }
  leaveRoom(roomId, playerId) {
    const room = rooms.get(roomId);
    if (!room) return;
    room.players = room.players.filter(p => p.id !== playerId);
    if (room.players.length === 0) {
      rooms.delete(roomId);
      return { roomDeleted: true };
    }
    if (room.creatorId === playerId && room.players.length > 0) {
      room.creatorId = room.players[0].id;
    }
    return { players: room.players, newCreatorId: room.creatorId };
  }
  startGame(roomId, playerId) {
    const room = rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'PokĂłj nie istnieje' };
    }
    if (room.creatorId !== playerId) {
      return { success: false, error: 'Tylko twĂłrca moĹĽe rozpoczÄ…Ä‡ grÄ™' };
    }
    if (room.players.length < 2) {
      return { success: false, error: 'Potrzeba minimum 2 graczy' };
    }
    if (room.gameStarted) {
      return { success: false, error: 'Gra juĹĽ siÄ™ rozpoczÄ™Ĺ‚a' };
    }
    room.gameState = this.initializeGameState(room.players);
    room.gameStarted = true;
    return { success: true, gameState: room.gameState };
  }
  initializeGameState(players) {
    const pawns = {};
    players.forEach((player, idx) => {
      const color = this.colors[idx];
      const homes = this.homePositions[color];
      pawns[color] = homes.map((pos, i) => ({
        id: `${color}-${i}`,
        color,
        position: pos,
        inHome: true,
        inGoal: false,
        pathPosition: -1,
        goalPosition: -1
      }));
    });
    return {
      pawns,
      currentTurn: 0,
      currentDice: null,
      lastRoll: null,
      consecutiveSixes: 0,
      players: players.map((p, idx) => ({ ...p, color: this.colors[idx] })),
      winner: null
    };
  }
  rollDice(roomId, playerId) {
    const room = rooms.get(roomId);
    if (!room || !room.gameStarted) {
      return { success: false, error: 'Gra nie jest w trakcie' };
    }
    const currentPlayer = room.gameState.players[room.gameState.currentTurn];
    if (currentPlayer.id !== playerId) {
      return { success: false, error: 'Nie twoja kolej' };
    }
    if (room.gameState.currentDice !== null) {
      return { success: false, error: 'Najpierw wykonaj ruch' };
    }
    const value = Math.floor(Math.random() * 6) + 1;
    room.gameState.currentDice = value;
    room.gameState.lastRoll = value;
    if (value === 6) {
      room.gameState.consecutiveSixes = (room.gameState.consecutiveSixes || 0) + 1;
    } else {
      room.gameState.consecutiveSixes = 0;
    }
    const movablePawns = this.getMovablePawns(room.gameState, room.gameState.currentTurn, value);
    if (movablePawns.length === 0 && value !== 6) {
      room.gameState.currentDice = null;
      room.gameState.currentTurn = (room.gameState.currentTurn + 1) % room.gameState.players.length;
    }
    return { 
      success: true, 
      value, 
      movablePawns,
      shouldChangeTurn: movablePawns.length === 0 && value !== 6
    };
  }
  getMovablePawns(gameState, turnIndex, diceValue) {
    const color = this.colors[turnIndex];
    const pawns = gameState.pawns[color];
    const movable = [];
    for (const pawn of pawns) {
      if (pawn.inGoal) continue;
      if (pawn.inHome && diceValue === 6) {
        const startPos = this.startPositions[color];
        const isStartPositionBlocked = Object.values(gameState.pawns[color]).some(p => 
          !p.inHome && !p.inGoal && p.pathPosition === 0
        );
        if (!isStartPositionBlocked) {
          movable.push(pawn);
        }
        continue;
      }
      if (!pawn.inHome && !pawn.inGoal) {
        const canMove = this.canMovePawn(gameState, pawn, diceValue, color);
        if (canMove) {
          movable.push(pawn);
        }
      }
    }
    return movable;
  }
  canMovePawn(gameState, pawn, diceValue, color) {
    if (pawn.pathPosition >= 0 && pawn.pathPosition < 40) {
      const absolutePosition = (this.startPositions[color] + pawn.pathPosition) % 40;
      let pathToGoalEntry = this.startPositions[color] - 1;
      if (pathToGoalEntry < 0) pathToGoalEntry += 40;
      let stepsToGoalEntry;
      if (absolutePosition <= pathToGoalEntry) {
        stepsToGoalEntry = pathToGoalEntry - absolutePosition;
      } else {
        stepsToGoalEntry = (40 - absolutePosition) + pathToGoalEntry;
      }
      if (diceValue > stepsToGoalEntry && diceValue <= stepsToGoalEntry + 4) {
        const goalPos = diceValue - stepsToGoalEntry - 1;
        return goalPos < 4;
      }
      return pawn.pathPosition + diceValue < 40;
    }
    if (pawn.goalPosition >= 0) {
      const newGoalPos = pawn.goalPosition + diceValue;
      return newGoalPos < 4;
    }
    return true;
  }
  movePawn(roomId, playerId, pawnId) {
    const room = rooms.get(roomId);
    if (!room || !room.gameStarted) {
      return { success: false, error: 'Gra nie jest w trakcie' };
    }
    const currentPlayer = room.gameState.players[room.gameState.currentTurn];
    if (currentPlayer.id !== playerId) {
      return { success: false, error: 'Nie twoja kolej' };
    }
    if (room.gameState.currentDice === null) {
      return { success: false, error: 'Najpierw rzuÄ‡ kostkÄ…' };
    }
    const color = this.colors[room.gameState.currentTurn];
    const pawn = room.gameState.pawns[color].find(p => p.id === pawnId);
    if (!pawn) {
      return { success: false, error: 'NieprawidĹ‚owy pionek' };
    }
    const movablePawns = this.getMovablePawns(room.gameState, room.gameState.currentTurn, room.gameState.currentDice);
    if (!movablePawns.find(p => p.id === pawnId)) {
      return { success: false, error: 'Nie moĹĽesz ruszyÄ‡ tego pionka' };
    }
    const diceValue = room.gameState.currentDice;
    let captured = false;
    if (pawn.inHome && diceValue === 6) {
      const startPos = this.startPositions[color];
      pawn.position = this.mainPath[startPos];
      pawn.pathPosition = 0;
      pawn.inHome = false;
      captured = this.checkCapture(room.gameState, pawn, color);
    } else if (pawn.pathPosition >= 0) {
      const absolutePosition = (this.startPositions[color] + pawn.pathPosition) % 40;
      const newAbsolutePosition = (absolutePosition + diceValue) % 40;
      const pathToGoalEntry = this.startPositions[color] - 1;
      const normalizedEntry = pathToGoalEntry < 0 ? pathToGoalEntry + 40 : pathToGoalEntry;
      let stepsToGoalEntry;
      if (absolutePosition <= normalizedEntry) {
        stepsToGoalEntry = normalizedEntry - absolutePosition;
      } else {
        stepsToGoalEntry = (40 - absolutePosition) + normalizedEntry;
      }
      if (diceValue > stepsToGoalEntry && diceValue <= stepsToGoalEntry + 4) {
        const goalPos = diceValue - stepsToGoalEntry - 1;
        if (goalPos < 4) {
          pawn.goalPosition = goalPos;
          pawn.position = this.goalPaths[color][goalPos];
          pawn.pathPosition = -1;
          if (goalPos === 3) {
            pawn.inGoal = true;
          }
        }
      } else {
        pawn.pathPosition = (pawn.pathPosition + diceValue) % 40;
        const newAbsPos = (this.startPositions[color] + pawn.pathPosition) % 40;
        pawn.position = this.mainPath[newAbsPos];
        captured = this.checkCapture(room.gameState, pawn, color);
      }
    } else if (pawn.goalPosition >= 0) {
      const newGoalPos = pawn.goalPosition + diceValue;
      if (newGoalPos < 4) {
        pawn.goalPosition = newGoalPos;
        pawn.position = this.goalPaths[color][newGoalPos];
        if (newGoalPos === 3) {
          pawn.inGoal = true;
        }
      }
    }
    const rolledSix = room.gameState.currentDice === 6;
    room.gameState.currentDice = null;
    const winner = this.checkWinner(room.gameState);
    if (winner !== null) {
      room.gameState.winner = winner;
      return {
        success: true,
        gameState: room.gameState,
        captured,
        winner,
        nextTurn: room.gameState.currentTurn
      };
    }
    let nextTurn = room.gameState.currentTurn;
    if (!rolledSix) {
      nextTurn = (room.gameState.currentTurn + 1) % room.gameState.players.length;
      room.gameState.currentTurn = nextTurn;
    }
    return {
      success: true,
      gameState: room.gameState,
      captured,
      nextTurn,
      turnChanged: !rolledSix
    };
  }
  checkCapture(gameState, movedPawn, currentColor) {
    const pos = movedPawn.position;
    for (const color in gameState.pawns) {
      if (color === currentColor) continue;
      for (const pawn of gameState.pawns[color]) {
        if (pawn.inHome || pawn.inGoal) continue;
        if (pawn.position.r === pos.r && pawn.position.c === pos.c) {
          const homes = this.homePositions[color];
          const homeIdx = parseInt(pawn.id.split('-')[1]);
          pawn.position = homes[homeIdx];
          pawn.inHome = true;
          pawn.pathPosition = -1;
          pawn.goalPosition = -1;
          return true;
        }
      }
    }
    return false;
  }
  checkWinner(gameState) {
    for (let i = 0; i < gameState.players.length; i++) {
      const color = this.colors[i];
      const pawns = gameState.pawns[color];
      if (pawns.every(p => p.goalPosition >= 0 && p.goalPosition <= 3)) {
        return i;
      }
    }
    return null;
  }
  generateRoomId() {
    return gameUtils.generateGameId();
  }
  createGameSocket({ roomName, tournamentId, matchId } = {}) {
    const gameId = gameUtils.generateGameId();
    const game = {
      id: gameId,
      roomName: roomName || null,
      tournamentId: tournamentId || null,
      matchId: matchId || null,
      players: [],
      maxPlayers: 4,
      minPlayers: 2,
      gameState: null,
      gameStarted: false,
      moves: [],
      createdAt: new Date().toISOString(),
      status: "ongoing",
      rematchReady: {},
    };
    games.set(gameId, game);
    return game;
  }
  getGameSocket(gameId) {
    return gameUtils.getGameSocket(games, gameId);
  }
  deleteGameSocket(gameId) {
    return gameUtils.deleteGameSocket(games, gameId);
  }
  joinGameSocket({ gameId, username, userId, socketId }) {
    const game = games.get(gameId);
    if (!game) return { ok: false, error: "Gra o podanym ID nie istnieje" };
    if (!userId) return { ok: false, error: "Brak userId" };
    if (!username) username = "Anonim";
    if (game.gameStarted) {
      console.log('[CHINCZYK] Gra rozpoczÄ™ta - uĹĽytkownik doĹ‚Ä…cza jako obserwator:', username);
      return { ok: true, game };
    }
    if (game.tournamentId && game.matchId) {
      const tournamentController = require('./tournamentController');
      const canJoin = tournamentController.canPlayerJoinMatch(game.tournamentId, game.matchId, userId);
      if (!canJoin.ok) {
        return canJoin; // ZwrĂłÄ‡ bĹ‚Ä…d walidacji
      }
    }
    if (!Array.isArray(game.players)) {
      game.players = [];
    }
    const existingPlayerIndex = game.players.findIndex(
      p => String(p.userId) === String(userId)
    );
    if (existingPlayerIndex !== -1) {
      game.players[existingPlayerIndex] = {
        ...game.players[existingPlayerIndex],
        username,
        userId,
        socketId,
      };
      return { ok: true, game };
    }
    const maxPlayers = game.maxPlayers || 4;
    if (game.players.length >= maxPlayers) {
      return { ok: false, error: "Gra jest peĹ‚na" };
    }
    const newPlayer = { username, userId, socketId };
    game.players.push(newPlayer);
    console.log('[CHINCZYK] Nowy gracz doĹ‚Ä…czyĹ‚:', username, 'Liczba graczy:', game.players.length);
    return { ok: true, game };
  }
  listRoomsSocket() {
    return gameUtils.listRoomsSocket(games);
  }
  setRematchReady(gameId, userId) {
    return gameUtils.setRematchReady(games, gameId, userId);
  }
  createRematchGameFromOld(oldGame) {
    const gameId = gameUtils.generateGameId();
    const newGame = {
      id: gameId,
      roomName: oldGame.roomName || null,
      players: oldGame.players ? oldGame.players.map(p => ({ ...p })) : [],
      maxPlayers: oldGame.maxPlayers || 4,
      minPlayers: oldGame.minPlayers || 2,
      gameState: null,
      gameStarted: false,
      moves: [],
      createdAt: new Date().toISOString(),
      status: "ongoing",
      rematchReady: {},
    };
    games.set(gameId, newGame);
    return newGame;
  }
  makeMove(req, res) {
    const { id } = req.params;
    const { action, pawnId, userId } = req.body;
    const game = games.get(id);
    if (!game) {
      return res.status(404).json({ error: "Gra nie istnieje" });
    }
    try {
      let result;
      if (action === 'startGame') {
        result = this.startGameInternal(game, userId);
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        return res.json({ success: true, game, result });
      }
      if (!game.gameStarted || !game.gameState) {
        return res.status(400).json({ error: "Gra nie zostaĹ‚a rozpoczÄ™ta" });
      }
      if (action === 'rollDice') {
        result = this.rollDiceInternal(game, userId);
      } else if (action === 'movePawn') {
        result = this.movePawnInternal(game, userId, pawnId);
      } else {
        return res.status(400).json({ error: "NieprawidĹ‚owa akcja" });
      }
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      if (game.gameState.winner !== null && game.gameState.winner !== undefined) {
        game.status = "finished";
        game.winnerIndex = game.gameState.winner;
      }
      return res.json({ success: true, game, result });
    } catch (error) {
      console.error('Error in makeMove:', error);
      return res.status(500).json({ error: 'BĹ‚Ä…d serwera' });
    }
  }
  startGameInternal(game, userId) {
    if (game.gameStarted) {
      return { success: false, error: 'Gra juĹĽ siÄ™ rozpoczÄ™Ĺ‚a' };
    }
    if (game.players.length < 2) {
      return { success: false, error: 'Potrzeba minimum 2 graczy' };
    }
    if (game.players[0].userId !== userId) {
      return { success: false, error: 'Tylko twĂłrca moĹĽe rozpoczÄ…Ä‡ grÄ™' };
    }
    game.gameState = this.initializeGameState(game.players);
    game.gameStarted = true;
    return { success: true, gameState: game.gameState };
  }
  rollDiceInternal(game, userId) {
    console.log("[CHINCZYK BACKEND] rollDiceInternal - START", {
      userId,
      gameStarted: game.gameStarted,
      hasGameState: !!game.gameState,
      currentTurn: game.gameState?.currentTurn,
      currentDice: game.gameState?.currentDice,
      currentPlayer: game.gameState?.players[game.gameState?.currentTurn]
    });
    if (!game.gameStarted || !game.gameState) {
      console.log("[CHINCZYK BACKEND] BĹ‚Ä…d: Gra nie jest w trakcie");
      return { success: false, error: 'Gra nie jest w trakcie' };
    }
    const currentPlayer = game.gameState.players[game.gameState.currentTurn];
    console.log("[CHINCZYK BACKEND] PorĂłwnanie userId", {
      currentPlayerUserId: currentPlayer.userId,
      requestUserId: userId,
      areEqual: String(currentPlayer.userId) === String(userId)
    });
    if (String(currentPlayer.userId) !== String(userId)) {
      console.log("[CHINCZYK BACKEND] BĹ‚Ä…d: Nie twoja kolej");
      return { success: false, error: 'Nie twoja kolej' };
    }
    if (game.gameState.currentDice !== null) {
      console.log("[CHINCZYK BACKEND] BĹ‚Ä…d: Najpierw wykonaj ruch. currentDice =", game.gameState.currentDice);
      return { success: false, error: 'Najpierw wykonaj ruch' };
    }
    const value = Math.floor(Math.random() * 6) + 1;
    game.gameState.currentDice = value;
    game.gameState.lastRoll = value;
    if (value === 6) {
      game.gameState.consecutiveSixes = (game.gameState.consecutiveSixes || 0) + 1;
    } else {
      game.gameState.consecutiveSixes = 0;
    }
    const movablePawns = this.getMovablePawns(game.gameState, game.gameState.currentTurn, value);
    if (movablePawns.length === 0) {
      game.gameState.currentDice = null;
      game.gameState.currentTurn = (game.gameState.currentTurn + 1) % game.gameState.players.length;
    }
    return { 
      success: true, 
      value, 
      movablePawns,
      shouldChangeTurn: movablePawns.length === 0
    };
  }
  movePawnInternal(game, userId, pawnId) {
    if (!game.gameStarted || !game.gameState) {
      return { success: false, error: 'Gra nie jest w trakcie' };
    }
    const currentPlayer = game.gameState.players[game.gameState.currentTurn];
    if (String(currentPlayer.userId) !== String(userId)) {
      return { success: false, error: 'Nie twoja kolej' };
    }
    if (game.gameState.currentDice === null) {
      return { success: false, error: 'Najpierw rzuÄ‡ kostkÄ…' };
    }
    const color = this.colors[game.gameState.currentTurn];
    const pawn = game.gameState.pawns[color].find(p => p.id === pawnId);
    if (!pawn) {
      return { success: false, error: 'NieprawidĹ‚owy pionek' };
    }
    const movablePawns = this.getMovablePawns(game.gameState, game.gameState.currentTurn, game.gameState.currentDice);
    if (!movablePawns.find(p => p.id === pawnId)) {
      return { success: false, error: 'Nie moĹĽesz ruszyÄ‡ tego pionka' };
    }
    const diceValue = game.gameState.currentDice;
    let captured = false;
    const oldPosition = { ...pawn.position };
    const oldPathPosition = pawn.pathPosition;
    const oldInHome = pawn.inHome;
    const oldGoalPosition = pawn.goalPosition;
    if (pawn.inHome && diceValue === 6) {
      const startPos = this.startPositions[color];
      pawn.position = this.mainPath[startPos];
      pawn.pathPosition = 0;
      pawn.inHome = false;
      captured = this.checkCapture(game.gameState, pawn, color);
    } else if (pawn.pathPosition >= 0) {
      const absolutePosition = (this.startPositions[color] + pawn.pathPosition) % 40;
      const pathToGoalEntry = this.startPositions[color] - 1;
      const normalizedEntry = pathToGoalEntry < 0 ? pathToGoalEntry + 40 : pathToGoalEntry;
      let stepsToGoalEntry;
      if (absolutePosition <= normalizedEntry) {
        stepsToGoalEntry = normalizedEntry - absolutePosition;
      } else {
        stepsToGoalEntry = (40 - absolutePosition) + normalizedEntry;
      }
      if (diceValue > stepsToGoalEntry && diceValue <= stepsToGoalEntry + 4) {
        const goalPos = diceValue - stepsToGoalEntry - 1;
        if (goalPos < 4) {
          pawn.goalPosition = goalPos;
          pawn.position = this.goalPaths[color][goalPos];
          pawn.pathPosition = -1;
          pawn.inGoal = true; // Pionek wszedĹ‚ do goal path
        }
      } else {
        pawn.pathPosition = (pawn.pathPosition + diceValue) % 40;
        const newAbsPos = (this.startPositions[color] + pawn.pathPosition) % 40;
        pawn.position = this.mainPath[newAbsPos];
        captured = this.checkCapture(game.gameState, pawn, color);
      }
    } else if (pawn.goalPosition >= 0) {
      const newGoalPos = pawn.goalPosition + diceValue;
      if (newGoalPos < 4) {
        pawn.goalPosition = newGoalPos;
        pawn.position = this.goalPaths[color][newGoalPos];
      }
    }
    const moveEntry = {
      id: (game.moves?.length || 0) + 1,
      playerName: currentPlayer.username,
      color: color,
      pawnId: pawnId,
      diceValue: diceValue,
      from: oldInHome ? 'DOM' : (oldGoalPosition >= 0 ? `META ${oldGoalPosition + 1}` : `pole ${oldPathPosition + 1}`),
      to: pawn.inGoal ? `META ${pawn.goalPosition + 1}` : `pole ${pawn.pathPosition + 1}`,
      captured: captured,
      time: new Date().toISOString(),
    };
    if (!game.moves) game.moves = [];
    game.moves.push(moveEntry);
    const rolledSix = game.gameState.currentDice === 6;
    console.log("[CHINCZYK BACKEND] movePawnInternal - przed resetem", {
      currentDice: game.gameState.currentDice,
      rolledSix
    });
    game.gameState.currentDice = null;
    console.log("[CHINCZYK BACKEND] movePawnInternal - po resecie", {
      currentDice: game.gameState.currentDice,
      rolledSix
    });
    const winner = this.checkWinner(game.gameState);
    if (winner !== null) {
      game.gameState.winner = winner;
      return {
        success: true,
        gameState: game.gameState,
        captured,
        winner,
        nextTurn: game.gameState.currentTurn
      };
    }
    let nextTurn = game.gameState.currentTurn;
    if (!rolledSix) {
      nextTurn = (game.gameState.currentTurn + 1) % game.gameState.players.length;
      game.gameState.currentTurn = nextTurn;
    }
    return {
      success: true,
      gameState: game.gameState,
      captured,
      nextTurn,
      turnChanged: !rolledSix
    };
  }
  getRoom(roomId) {
    return games.get(roomId);
  }
  createRoom(playerName, playerId, maxPlayers = 4) {
    const game = this.createGameSocket({ roomName: null });
    game.maxPlayers = Math.min(Math.max(maxPlayers, 2), 4);
    game.players.push({ 
      userId: playerId, 
      username: playerName,
      socketId: null 
    });
    return { 
      success: true, 
      roomId: game.id, 
      playerId, 
      players: game.players 
    };
  }
  joinRoom(roomId, playerName, playerId) {
    const result = this.joinGameSocket({ 
      gameId: roomId, 
      username: playerName, 
      userId: playerId,
      socketId: null 
    });
    if (!result.ok) {
      return { success: false, error: result.error };
    }
    return { 
      success: true, 
      roomId, 
      playerId, 
      players: result.game.players 
    };
  }
  leaveRoom(roomId, playerId) {
    const game = games.get(roomId);
    if (!game) return;
    game.players = game.players.filter(p => p.userId !== playerId);
    if (game.players.length === 0) {
      games.delete(roomId);
      return { roomDeleted: true };
    }
    return { players: game.players };
  }
  startGame(roomId, playerId) {
    const game = games.get(roomId);
    if (!game) {
      return { success: false, error: 'PokĂłj nie istnieje' };
    }
    return this.startGameInternal(game, playerId);
  }
  rollDice(roomId, playerId) {
    const game = games.get(roomId);
    if (!game) {
      return { success: false, error: 'PokĂłj nie istnieje' };
    }
    return this.rollDiceInternal(game, playerId);
  }
  movePawn(roomId, playerId, pawnId) {
    const game = games.get(roomId);
    if (!game) {
      return { success: false, error: 'PokĂłj nie istnieje' };
    }
    return this.movePawnInternal(game, playerId, pawnId);
  }
  listRooms() {
    return Array.from(games.values()).map(game => ({
      id: game.id,
      players: game.players.length,
      maxPlayers: game.maxPlayers,
      gameStarted: game.gameStarted
    }));
  }
}
module.exports = new ChinczykController();

