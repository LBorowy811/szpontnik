function setupGameSocketHandlers(socket, io, gameKey, controller, emitRoomsUpdated) {
    // createGame
    socket.on(`${gameKey}:createGame`, (payload, cb) => {
      try {
        const game = controller.createGameSocket(payload);
        const room = `${gameKey}:${game.id}`;
  
        socket.join(room);
        io.to(room).emit(`${gameKey}:state`, game);
  
        emitRoomsUpdated(gameKey);
  
        cb?.({ ok: true, game });
      } catch (e) {
        cb?.({ ok: false, error: e?.message || 'createGame socket error' });
      }
    });
  
    // watchGame
    socket.on(`${gameKey}:watchGame`, ({ gameId }, cb) => {
      const game = controller.getGameSocket(gameId);
      if (!game) return cb?.({ ok: false, error: 'Gra nie istnieje' });
  
      const room = `${gameKey}:${gameId}`;
      socket.join(room);
  
      io.to(room).emit(`${gameKey}:state`, game);
      cb?.({ ok: true, game });
    });
  
    // joinGame
    socket.on(`${gameKey}:joinGame`, ({ gameId, username, userId }, cb) => {
      const result = controller.joinGameSocket({
        gameId,
        username,
        userId,
        socketId: socket.id,
      });
  
      if (!result.ok) return cb?.(result);
  
      const room = `${gameKey}:${gameId}`;
      socket.join(room);
  
      io.to(room).emit(`${gameKey}:state`, result.game);
      emitRoomsUpdated(gameKey);
  
      cb?.({ ok: true, game: result.game });
    });
  
    // rematchReady
    socket.on(`${gameKey}:rematchReady`, ({ gameId, userId }, cb) => {
      try {
        if (!gameId) return cb?.({ ok: false, error: 'Brak gameId' });
        if (!userId) return cb?.({ ok: false, error: 'Brak userId' });
  
        const result = controller.setRematchReady(gameId, userId);
        if (!result.ok) return cb?.(result);
  
        const roomOld = `${gameKey}:${gameId}`;
  
        io.to(roomOld).emit(`${gameKey}:rematchStatus`, {
          gameId,
          count: result.count,
          ready: result.game.rematchReady,
        });
  
        if (result.allReady) {
          const oldGame = controller.getGameSocket(gameId);
          const newGame = controller.createRematchGameFromOld(oldGame);
          const roomNew = `${gameKey}:${newGame.id}`;
  
          const player0SockId = newGame.players?.[0]?.socketId;
          const player1SockId = newGame.players?.[1]?.socketId;
  
          if (player0SockId && io.sockets.sockets.get(player0SockId)) {
            const s = io.sockets.sockets.get(player0SockId);
            s.leave(roomOld);
            s.join(roomNew);
          }
          if (player1SockId && io.sockets.sockets.get(player1SockId)) {
            const s = io.sockets.sockets.get(player1SockId);
            s.leave(roomOld);
            s.join(roomNew);
          }
  
          io.to(roomNew).emit(`${gameKey}:state`, newGame);
          io.to(roomNew).emit(`${gameKey}:rematchStarted`, { newGameId: newGame.id });
  
          oldGame.rematchReady = {};
  
          emitRoomsUpdated(gameKey);
        }
  
        cb?.({ ok: true, count: result.count });
      } catch (e) {
        cb?.({ ok: false, error: e?.message || 'rematchReady error' });
      }
    });
  
    // move
    socket.on(`${gameKey}:move`, ({ gameId, ...moveData }, callback) => {
      if (!gameId) return callback?.({ ok: false, error: 'Brak gameId' });
  
      const req = { params: { id: gameId }, body: { ...moveData } };
      const res = {
        status: (code) => {
          res._status = code;
          return res;
        },
        json: (data) => {
          if (res._status && res._status >= 400) {
            return callback?.({ ok: false, error: data?.error || 'Błąd ruchu' });
          }
          callback?.({ ok: true, data });
  
          if (data?.game) io.to(`${gameKey}:${gameId}`).emit(`${gameKey}:state`, data.game);
  
          emitRoomsUpdated(gameKey);
        },
      };
  
      controller.makeMove(req, res);
    });
  }
  
  module.exports = setupGameSocketHandlers;