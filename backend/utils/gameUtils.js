function generateGameId() {
    return (
      Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    );
  }
  
  function getGameSocket(games, gameId) {
    return games.get(gameId) || null;
  }
  
  function deleteGameSocket(games, gameId) {
    return games.delete(gameId);
  }
  
  // Zmienione: zwraca indeks zamiast "left"/"right"
  function getPlayerIndexByUserId(game, userId) {
    if (!game?.players || !Array.isArray(game.players)) return null;
    
    for (let i = 0; i < game.players.length; i++) {
      if (String(game.players[i]?.userId) === String(userId)) {
        return i;
      }
    }
    return null;
  }
  
  
  function listRoomsSocket(games) {
    const rooms = [];
  
    for (const [id, game] of games.entries()) {
      if (!game || game.status === "finished") continue;
  
      if (!Array.isArray(game.players)) {
        // Fallback dla starych gier (jeśli jeszcze istnieją)
        continue;
      }
  
      const playersCount = game.players.length;
      const minPlayers = game.minPlayers || 2;
      const maxPlayers = game.maxPlayers || 2;
  
      rooms.push({
        id,
        roomName: game.roomName || null,
        status: playersCount < minPlayers ? "waiting" : (game.status || "playing"),
        playersCount,
        maxPlayers,
        players: game.players.map(p => ({
          username: p.username,
          userId: p.userId,
        })),
        createdAt: game.createdAt,
      });
    }
  
    rooms.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return rooms;
  }
  
  function setRematchReady(games, gameId, userId) {
    const game = games.get(gameId);
    if (!game) return { ok: false, error: "Gra nie istnieje" };
  
    if (game.status === "ongoing") {
      return { ok: false, error: "Gra jeszcze trwa" };
    }
  
    const playerIndex = getPlayerIndexByUserId(game, userId);
    if (playerIndex === null) return { ok: false, error: "Nie jesteś graczem w tej grze" };
  
    if (!game.rematchReady) game.rematchReady = {};
    game.rematchReady[userId] = true;
  
    const readyCount = Object.keys(game.rematchReady).length;
    const allReady = readyCount === game.players.length;
  
    return { ok: true, game, count: readyCount, allReady };
  }
  
  // Uproszczona funkcja - tylko tablica players[]
  function joinGameSocketBase(games, { gameId, username, userId, socketId }, assignCallback) {
    const game = games.get(gameId);
    if (!game) return { ok: false, error: "Gra o podanym ID nie istnieje" };
  
    if (!userId) return { ok: false, error: "Brak userId" };
    if (!username) username = "Anonim";
  
    // Inicjalizuj tablicę graczy jeśli nie istnieje
    if (!Array.isArray(game.players)) {
      game.players = [];
    }
  
    // Sprawdź czy gracz już jest w grze
    const existingPlayerIndex = game.players.findIndex(
      p => String(p.userId) === String(userId)
    );
  
    if (existingPlayerIndex !== -1) {
      // Aktualizuj socketId dla istniejącego gracza
      game.players[existingPlayerIndex] = {
        ...game.players[existingPlayerIndex],
        username,
        userId,
        socketId,
      };
      if (assignCallback) assignCallback(game);
      return { ok: true, game };
    }
  
    // Sprawdź czy jest miejsce
    const maxPlayers = game.maxPlayers || 2;
    if (game.players.length >= maxPlayers) {
      return { ok: false, error: "Gra jest pełna" };
    }
  
    // Dodaj nowego gracza
    const newPlayer = { username, userId, socketId };
    game.players.push(newPlayer);
  
    // Wywołaj callback do przypisania kolorów/symboli
    if (assignCallback) {
      assignCallback(game);
    }
  
    return { ok: true, game };
  }
  
  module.exports = {
    generateGameId,
    getGameSocket,
    deleteGameSocket,
    getPlayerIndexByUserId,
    listRoomsSocket,
    setRematchReady,
    joinGameSocketBase,
  };