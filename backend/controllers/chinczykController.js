const rooms = new Map();

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
      const newPosition = pawn.pathPosition + diceValue;
      
      const pathToGoalEntry = this.startPositions[color] - 1;
      if (pathToGoalEntry < 0) pathToGoalEntry += 40;
      
      let stepsToGoalEntry;
      if (pawn.pathPosition <= pathToGoalEntry) {
        stepsToGoalEntry = pathToGoalEntry - pawn.pathPosition;
      } else {
        stepsToGoalEntry = (40 - pawn.pathPosition) + pathToGoalEntry;
      }

      if (diceValue > stepsToGoalEntry && diceValue <= stepsToGoalEntry + 4) {
        const goalPos = diceValue - stepsToGoalEntry - 1;
        return goalPos < 4;
      }

      return newPosition < 40;
    }

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
      
      if (pawns.every(p => p.inGoal)) {
        return i;
      }
    }
    
    return null;
  }

  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  getRoom(roomId) {
    return rooms.get(roomId);
  }

  listRooms() {
    return Array.from(rooms.values()).map(room => ({
      id: room.id,
      players: room.players.length,
      maxPlayers: room.maxPlayers,
      gameStarted: room.gameStarted
    }));
  }

  listRoomsSocket() {
    return this.listRooms();
  }
}

module.exports = new ChinczykController();
