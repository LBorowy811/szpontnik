const tournamentController = require('../controllers/tournamentController');

function setupTournamentSocketHandlers(io, socket, gameControllers) {
  socket.on('tournament:create', ({ name, gameType, userId, username, maxPlayers }, callback) => {
    const result = tournamentController.createTournament({
      name,
      gameType,
      creatorId: userId,
      creatorName: username,
      maxPlayers: maxPlayers || 4
    });

    if (!result.ok) {
      return callback?.(result);
    }

    const room = `tournament:${result.tournament.id}`;
    socket.join(room);
    
    io.emit('tournament:list', tournamentController.listTournaments({}));
    
    callback?.(result);
  });

  socket.on('tournament:join', ({ tournamentId, userId, username }, callback) => {
    const result = tournamentController.joinTournament({
      tournamentId,
      userId,
      username,
      socketId: socket.id
    });

    if (!result.ok) {
      return callback?.(result);
    }

    const room = `tournament:${tournamentId}`;
    socket.join(room);
    
    io.to(room).emit('tournament:update', result.tournament);
    
    io.emit('tournament:list', tournamentController.listTournaments({}));
    
    callback?.(result);
  });

  socket.on('tournament:start', ({ tournamentId, userId }, callback) => {
    const tournamentResult = tournamentController.getTournament(tournamentId);
    
    if (!tournamentResult.ok) {
      return callback?.(tournamentResult);
    }

    const tournament = tournamentResult.tournament;
    
    if (String(tournament.creatorId) !== String(userId)) {
      return callback?.({ ok: false, error: 'Tylko twórca może rozpocząć turniej' });
    }

    const result = tournamentController.startTournament(tournamentId);
    
    if (!result.ok) {
      return callback?.(result);
    }

    const room = `tournament:${tournamentId}`;
    io.to(room).emit('tournament:update', result.tournament);
    io.emit('tournament:list', tournamentController.listTournaments({}));
    
    callback?.(result);
  });

  socket.on('tournament:reportResult', ({ tournamentId, matchId, winnerId }, callback) => {
    const result = tournamentController.reportMatchResult({
      tournamentId,
      matchId,
      winnerId
    });

    if (!result.ok) {
      return callback?.(result);
    }

    const room = `tournament:${tournamentId}`;
    io.to(room).emit('tournament:update', result.tournament);
    
    callback?.(result);
  });

  socket.on('tournament:createMatch', ({ tournamentId, matchId }, callback) => {
    const tournamentResult = tournamentController.getTournament(tournamentId);
    
    if (!tournamentResult.ok) {
      return callback?.(tournamentResult);
    }

    const tournament = tournamentResult.tournament;
    const gameController = gameControllers[tournament.gameType];
    
    if (!gameController) {
      return callback?.({ ok: false, error: 'Nieobsługiwana gra' });
    }

    const result = tournamentController.createMatchGame({
      tournamentId,
      matchId,
      gameController
    });

    if (!result.ok) {
      return callback?.(result);
    }

    const room = `tournament:${tournamentId}`;
    io.to(room).emit('tournament:update', result.tournament);
    
    callback?.({ ok: true, gameId: result.gameId, tournament: result.tournament });
  });

  socket.on('tournament:get', ({ tournamentId }, callback) => {
    const result = tournamentController.getTournament(tournamentId);
    callback?.(result);
  });

  socket.on('tournament:list', ({ gameType, status }, callback) => {
    const result = tournamentController.listTournaments({ gameType, status });
    callback?.(result);
  });

  socket.on('disconnect', () => {
  });
}

module.exports = setupTournamentSocketHandlers;
