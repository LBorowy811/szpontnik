function setupPictionaryHandler(socket, io, controller, emitRoomsUpdated) {
  const gameKey = 'pictionary';

  // Rysowanie
  socket.on('pictionary:draw', ({ gameId, drawData, userId }, callback) => {
    if (!gameId) return callback?.({ ok: false, error: 'Brak gameId' });

    const req = { params: { id: gameId }, body: { userId, drawData } };
    const res = {
      status: (code) => {
        res._status = code;
        return res;
      },
      json: (data) => {
        if (res._status && res._status >= 400) {
          return callback?.({ ok: false, error: data?.error || 'Błąd rysowania' });
        }
        callback?.({ ok: true, data });

        if (data?.game) {
          // Emituj aktualizację canvasu do wszystkich w pokoju
          io.to(`${gameKey}:${gameId}`).emit('pictionary:canvasUpdate', {
            canvas: data.game.canvas,
            drawData,
          });
        }
      },
    };

    controller.draw(req, res);
  });

  // Zgadywanie
  socket.on('pictionary:guess', ({ gameId, guessWord, userId }, callback) => {
    if (!gameId) return callback?.({ ok: false, error: 'Brak gameId' });

    const req = { params: { id: gameId }, body: { userId, guessWord } };
    const res = {
      status: (code) => {
        res._status = code;
        return res;
      },
      json: (data) => {
        if (res._status && res._status >= 400) {
          return callback?.({ ok: false, error: data?.error || 'Błąd zgadywania' });
        }
        callback?.({ ok: true, correct: data.correct });

        if (data?.game) {
          // Emituj stan gry do wszystkich
          io.to(`${gameKey}:${gameId}`).emit('pictionary:state', data.game);
          emitRoomsUpdated(gameKey);
        }
      },
    };

    controller.guess(req, res);
  });

  // Pomijanie rundy
  socket.on('pictionary:skipRound', ({ gameId, userId }, callback) => {
    if (!gameId) return callback?.({ ok: false, error: 'Brak gameId' });

    const req = { params: { id: gameId }, body: { userId } };
    const res = {
      status: (code) => {
        res._status = code;
        return res;
      },
      json: (data) => {
        if (res._status && res._status >= 400) {
          return callback?.({ ok: false, error: data?.error || 'Błąd pomijania rundy' });
        }
        callback?.({ ok: true });

        if (data?.game) {
          io.to(`${gameKey}:${gameId}`).emit('pictionary:state', data.game);
        }
      },
    };

    controller.skipRound(req, res);
  });

  // Czyszczenie canvasu
  socket.on('pictionary:clearCanvas', ({ gameId, userId }, callback) => {
    if (!gameId) return callback?.({ ok: false, error: 'Brak gameId' });

    const req = { params: { id: gameId }, body: { userId } };
    const res = {
      status: (code) => {
        res._status = code;
        return res;
      },
      json: (data) => {
        if (res._status && res._status >= 400) {
          return callback?.({ ok: false, error: data?.error || 'Błąd czyszczenia canvasu' });
        }
        callback?.({ ok: true });

        if (data?.game) {
          io.to(`${gameKey}:${gameId}`).emit('pictionary:state', data.game);
        }
      },
    };

    controller.clearCanvas(req, res);
  });
}

module.exports = setupPictionaryHandler;
