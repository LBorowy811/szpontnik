function setupRoomsHandler(socket, io, controllersByGameKey, emitRoomsUpdated) {
    socket.on('rooms:list', ({ gameKey }, cb) => {
      try {
        if (!gameKey) return cb?.({ ok: false, error: 'Brak gameKey' });
  
        const controller = controllersByGameKey[gameKey];
        if (!controller || typeof controller.listRoomsSocket !== 'function') {
          return cb?.({ ok: true, rooms: [] });
        }
  
        const rooms = controller.listRoomsSocket();
        cb?.({ ok: true, rooms });
      } catch (e) {
        cb?.({ ok: false, error: e?.message || 'rooms:list error' });
      }
    });
  
    socket.on('rooms:create', ({ gameKey, roomName }, cb) => {
      try {
        if (!gameKey) return cb?.({ ok: false, error: 'Brak gameKey' });
  
        const controller = controllersByGameKey[gameKey];
        if (!controller || typeof controller.createGameSocket !== 'function') {
          return cb?.({ ok: false, error: `Gra ${gameKey} nie obsługuje tworzenia pokoju` });
        }
  
        const game = controller.createGameSocket({ roomName: roomName || null });
  
        const room = `${gameKey}:${game.id}`;
        socket.join(room);
  
        io.to(room).emit(`${gameKey}:state`, game);
        emitRoomsUpdated(gameKey);
  
        cb?.({ ok: true, roomId: game.id });
      } catch (e) {
        cb?.({ ok: false, error: e?.message || 'rooms:create error' });
      }
    });
  }
  
  module.exports = setupRoomsHandler;