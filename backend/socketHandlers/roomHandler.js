function setupRoomsHandler(socket, io, controllersByGameKey, emitRoomsUpdated) {
    socket.on('rooms:list', ({ gameKey, ranked }, cb) => {
      try {
        if (!gameKey) return cb?.({ ok: false, error: 'Brak gameKey' });

        const controller = controllersByGameKey[gameKey];
        if (!controller || typeof controller.listRoomsSocket !== 'function') {
          return cb?.({ ok: true, rooms: [] });
        }

        let rooms = controller.listRoomsSocket();

        // Filtruj pokoje według typu (ranked/casual)
        if (ranked === true) {
          rooms = rooms.filter(r => r.ranked === true);
        } else {
          rooms = rooms.filter(r => r.ranked !== true);
        }

        cb?.({ ok: true, rooms });
      } catch (e) {
        cb?.({ ok: false, error: e?.message || 'rooms:list error' });
      }
    });

    socket.on('rooms:create', ({ gameKey, roomName, ranked }, cb) => {
      try {
        if (!gameKey) return cb?.({ ok: false, error: 'Brak gameKey' });

        const controller = controllersByGameKey[gameKey];
        if (!controller || typeof controller.createGameSocket !== 'function') {
          return cb?.({ ok: false, error: `Gra ${gameKey} nie obsługuje tworzenia pokoju` });
        }

        const game = controller.createGameSocket({
          roomName: roomName || null,
          ranked: ranked === true
        });

        const room = `${gameKey}:${game.id}`;
        socket.join(room);

        io.to(room).emit(`${gameKey}:state`, game);
        emitRoomsUpdated(gameKey);

        cb?.({ ok: true, roomId: game.id, ranked: game.ranked });
      } catch (e) {
        cb?.({ ok: false, error: e?.message || 'rooms:create error' });
      }
    });
  }

  module.exports = setupRoomsHandler;