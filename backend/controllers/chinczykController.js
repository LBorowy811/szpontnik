const gameUtils = require('../utils/gameUtils');

const games = new Map(); // Zmieniono z rooms na games dla zgodności

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

  // Tworzenie pokoju
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

  // Dołączanie do pokoju
  joinRoom(roomId, playerName, playerId) {
    const room = rooms.get(roomId);
    
    if (!room) {
      return { success: false, error: 'Pokój nie istnieje' };
    }

    if (room.gameStarted) {
      return { success: false, error: 'Gra już się rozpoczęła' };
    }

    if (room.players.length >= room.maxPlayers) {
      return { success: false, error: 'Pokój jest pełny' };
    }

    if (room.players.some(p => p.id === playerId)) {
      return { success: false, error: 'Już jesteś w tym pokoju' };
    }

    room.players.push({ id: playerId, name: playerName });
    return { success: true, roomId, playerId, players: room.players };
  }

  // Opuszczanie pokoju
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
      return { success: false, error: 'Pokój nie istnieje' };
    }

    if (room.creatorId !== playerId) {
      return { success: false, error: 'Tylko twórca może rozpocząć grę' };
    }

    if (room.players.length < 2) {
      return { success: false, error: 'Potrzeba minimum 2 graczy' };
    }

    if (room.gameStarted) {
      return { success: false, error: 'Gra już się rozpoczęła' };
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

  // Rzut kostką
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
        movable.push(pawn);
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
      // Oblicz absolutną pozycję pionka na planszy (0-39)
      const absolutePosition = (this.startPositions[color] + pawn.pathPosition) % 40;
      
      // Pole wejścia do bazy (tuż przed polem startowym)
      let pathToGoalEntry = this.startPositions[color] - 1;
      if (pathToGoalEntry < 0) pathToGoalEntry += 40;
      
      // Oblicz ile kroków do wejścia do bazy
      let stepsToGoalEntry;
      if (absolutePosition <= pathToGoalEntry) {
        stepsToGoalEntry = pathToGoalEntry - absolutePosition;
      } else {
        stepsToGoalEntry = (40 - absolutePosition) + pathToGoalEntry;
      }

      // Sprawdź czy ruch prowadzi do bazy (goal path)
      if (diceValue > stepsToGoalEntry && diceValue <= stepsToGoalEntry + 4) {
        const goalPos = diceValue - stepsToGoalEntry - 1;
        return goalPos < 4;
      }

      // Zwykły ruch po głównej ścieżce
      return pawn.pathPosition + diceValue < 40;
    }

    // Ruch w bazie (goal path)
    if (pawn.goalPosition >= 0) {
      const newGoalPos = pawn.goalPosition + diceValue;
      return newGoalPos < 4;
    }

    return true;
  }

  // Ruch pionka
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
      return { success: false, error: 'Najpierw rzuć kostką' };
    }

    const color = this.colors[room.gameState.currentTurn];
    const pawn = room.gameState.pawns[color].find(p => p.id === pawnId);

    if (!pawn) {
      return { success: false, error: 'Nieprawidłowy pionek' };
    }

    const movablePawns = this.getMovablePawns(room.gameState, room.gameState.currentTurn, room.gameState.currentDice);
    if (!movablePawns.find(p => p.id === pawnId)) {
      return { success: false, error: 'Nie możesz ruszyć tego pionka' };
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
      
      // Gracz wygrywa gdy wszystkie 4 pionki są w goal path (pozycja 0-3)
      if (pawns.every(p => p.goalPosition >= 0 && p.goalPosition <= 3)) {
        return i;
      }
    }
    
    return null;
  }

  generateRoomId() {
    return gameUtils.generateGameId();
  }

  // ===== METODY DLA UNIWERSALNEGO SYSTEMU POKOI =====
  
  createGameSocket({ roomName } = {}) {
    const gameId = gameUtils.generateGameId();
    
    const game = {
      id: gameId,
      roomName: roomName || null,
      players: [],
      maxPlayers: 4,
      minPlayers: 2,
      gameState: null,
      gameStarted: false,
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
    return gameUtils.joinGameSocketBase(games, { gameId, username, userId, socketId }, (game) => {
      // Callback wywoływany gdy jest wystarczająco graczy
      if (game.players.length >= 2 && !game.gameStarted) {
        // Możesz opcjonalnie auto-startować grę lub zaczekać na ręczne rozpoczęcie
      }
    });
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
      createdAt: new Date().toISOString(),
      status: "ongoing",
      rematchReady: {},
    };

    games.set(gameId, newGame);
    return newGame;
  }

  // ===== METODY GRY (dostosowane do uniwersalnego systemu) =====

  makeMove(req, res) {
    const { id } = req.params;
    const { action, pawnId, userId } = req.body;

    const game = games.get(id);
    if (!game) {
      return res.status(404).json({ error: "Gra nie istnieje" });
    }

    try {
      let result;
      
      // Akcja startGame może być wywołana przed rozpoczęciem gry
      if (action === 'startGame') {
        result = this.startGameInternal(game, userId);
        
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        
        return res.json({ success: true, game, result });
      }
      
      // Pozostałe akcje wymagają rozpoczętej gry
      if (!game.gameStarted || !game.gameState) {
        return res.status(400).json({ error: "Gra nie została rozpoczęta" });
      }
      
      if (action === 'rollDice') {
        result = this.rollDiceInternal(game, userId);
      } else if (action === 'movePawn') {
        result = this.movePawnInternal(game, userId, pawnId);
      } else {
        return res.status(400).json({ error: "Nieprawidłowa akcja" });
      }

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Sprawdź czy gra się skończyła
      if (game.gameState.winner !== null && game.gameState.winner !== undefined) {
        game.status = "finished";
        game.winnerIndex = game.gameState.winner;
      }

      return res.json({ success: true, game, result });
    } catch (error) {
      console.error('Error in makeMove:', error);
      return res.status(500).json({ error: 'Błąd serwera' });
    }
  }

  startGameInternal(game, userId) {
    if (game.gameStarted) {
      return { success: false, error: 'Gra już się rozpoczęła' };
    }

    if (game.players.length < 2) {
      return { success: false, error: 'Potrzeba minimum 2 graczy' };
    }

    // Sprawdź czy to twórca pokoju (pierwszy gracz)
    if (game.players[0].userId !== userId) {
      return { success: false, error: 'Tylko twórca może rozpocząć grę' };
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
      console.log("[CHINCZYK BACKEND] Błąd: Gra nie jest w trakcie");
      return { success: false, error: 'Gra nie jest w trakcie' };
    }

    const currentPlayer = game.gameState.players[game.gameState.currentTurn];
    console.log("[CHINCZYK BACKEND] Porównanie userId", {
      currentPlayerUserId: currentPlayer.userId,
      requestUserId: userId,
      areEqual: String(currentPlayer.userId) === String(userId)
    });
    
    if (String(currentPlayer.userId) !== String(userId)) {
      console.log("[CHINCZYK BACKEND] Błąd: Nie twoja kolej");
      return { success: false, error: 'Nie twoja kolej' };
    }

    if (game.gameState.currentDice !== null) {
      console.log("[CHINCZYK BACKEND] Błąd: Najpierw wykonaj ruch. currentDice =", game.gameState.currentDice);
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

    if (movablePawns.length === 0 && value !== 6) {
      game.gameState.currentDice = null;
      game.gameState.currentTurn = (game.gameState.currentTurn + 1) % game.gameState.players.length;
    }

    return { 
      success: true, 
      value, 
      movablePawns,
      shouldChangeTurn: movablePawns.length === 0 && value !== 6
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
      return { success: false, error: 'Najpierw rzuć kostką' };
    }

    const color = this.colors[game.gameState.currentTurn];
    const pawn = game.gameState.pawns[color].find(p => p.id === pawnId);

    if (!pawn) {
      return { success: false, error: 'Nieprawidłowy pionek' };
    }

    const movablePawns = this.getMovablePawns(game.gameState, game.gameState.currentTurn, game.gameState.currentDice);
    if (!movablePawns.find(p => p.id === pawnId)) {
      return { success: false, error: 'Nie możesz ruszyć tego pionka' };
    }

    const diceValue = game.gameState.currentDice;
    let captured = false;

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
          pawn.inGoal = true; // Pionek wszedł do goal path
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
        // Pionek już ma inGoal = true
      }
    }

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

  // ===== LEGACY METHODS (dla kompatybilności wstecznej) =====
  
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
      return { success: false, error: 'Pokój nie istnieje' };
    }

    return this.startGameInternal(game, playerId);
  }

  rollDice(roomId, playerId) {
    const game = games.get(roomId);
    
    if (!game) {
      return { success: false, error: 'Pokój nie istnieje' };
    }

    return this.rollDiceInternal(game, playerId);
  }

  movePawn(roomId, playerId, pawnId) {
    const game = games.get(roomId);
    
    if (!game) {
      return { success: false, error: 'Pokój nie istnieje' };
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
