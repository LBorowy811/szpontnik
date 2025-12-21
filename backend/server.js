const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const checkersController = require('./controllers/checkersController');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const controllersByGameKey = {
  checkers: checkersController,

};


const PORT = 3000;

// import routingu
const authRoutes = require('./routes/authRoutes');
const checkersRoutes = require('./routes/checkersRoutes');

// middleware
app.use(cors());
app.use(bodyParser.json());

// routing
app.use('/api/auth', authRoutes);
app.use('/api/checkers', checkersRoutes);

// prosty testowy endpoint
app.get('/', (req, res) => {
  res.send('Serwer Express działa 🎉');
});

function emitRoomsUpdated(gameKey) {
  try {
    const controller = controllersByGameKey[gameKey];
    if (!controller?.listRoomsSocket) return;

    const rooms = controller.listRoomsSocket();
    io.emit("rooms:updated", { gameKey, rooms });
  } catch (e) {
    console.error("emitRoomsUpdated error:", e);
  }
}



// obsługa połączeń socket.io
io.on('connection', (socket) => {
  console.log('Użytkownik połączył się:', socket.id);

  // pokazywanie liczby użytkowników online
  io.emit('online-count', io.engine.clientsCount);

  socket.on('chat-message', (data) => {
    const message = {
      id: socket.id,
      username: data.username || 'Anonimowy',
      userId: data.userId || null,
      message: data.message,
      timestamp: new Date().toLocaleTimeString('pl-PL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
    // wysłanie wiadomości do wszystkich łącznie z tym, który wysłał
    io.emit('chat-message', message);
  });

  socket.on("checkers:createGame", (payload, cb) => {
    try {
      const game = checkersController.createGameSocket(payload);
      const room = `checkers:${game.id}`;

      socket.join(room);
      io.to(room).emit("checkers:state", game);
      emitRoomsUpdated("checkers");

      cb?.({ ok: true, game });
    } catch (e) {
      cb?.({ ok: false, error: e?.message || "createGame socket error" });
    }
  });

  socket.on("checkers:watchGame", ({ gameId }, cb) => {
    const game = checkersController.getGameSocket(gameId);
    if (!game) return cb?.({ ok: false, error: "Gra nie istnieje" });

    const room = `checkers:${gameId}`;
    socket.join(room);

    io.to(room).emit("checkers:state", game);
    cb?.({ ok: true, game });
  });

  socket.on("checkers:joinGame", ({ gameId, side, username, userId }, cb) => {
  const result = checkersController.joinGameSocket({
    gameId,
    side,
    username,
    userId,
    socketId: socket.id,
  });

  if (!result.ok) return cb?.(result);

  const room = `checkers:${gameId}`;
  socket.join(room);

  io.to(room).emit("checkers:state", result.game);
  emitRoomsUpdated("checkers");
  cb?.({ ok: true, game: result.game });
});


socket.on("checkers:rematchReady", ({ gameId, userId }, cb) => {
    try {
      if (!gameId) return cb?.({ ok: false, error: "Brak gameId" });
      if (!userId) return cb?.({ ok: false, error: "Brak userId" });

      const result = checkersController.setRematchReady(gameId, userId);
      if (!result.ok) return cb?.(result);

      const roomOld = `checkers:${gameId}`;

      //2/2
      io.to(roomOld).emit("checkers:rematchStatus", {
        gameId,
        count: result.count,
        ready: result.game.rematchReady,
      });

      if (result.bothReady) {
        const oldGame = checkersController.getGameSocket(gameId);
        const newGame = checkersController.createRematchGameFromOld(oldGame);
        const roomNew = `checkers:${newGame.id}`;

        //sockety gracza do nowego pokoju
        const leftSockId = newGame.players?.left?.socketId;
        const rightSockId = newGame.players?.right?.socketId;

        if (leftSockId && io.sockets.sockets.get(leftSockId)) {
          const s = io.sockets.sockets.get(leftSockId);
          s.leave(roomOld);
          s.join(roomNew);
        }
        if (rightSockId && io.sockets.sockets.get(rightSockId)) {
          const s = io.sockets.sockets.get(rightSockId);
          s.leave(roomOld);
          s.join(roomNew);
        }
        io.to(roomNew).emit("checkers:state", newGame);
        io.to(roomNew).emit("checkers:rematchStarted", { newGameId: newGame.id });
        oldGame.rematchReady = { left: false, right: false };
      }

      cb?.({ ok: true, count: result.count });
    } catch (e) {
      cb?.({ ok: false, error: e?.message || "rematchReady error" });
    }
  });


  //ruch
  socket.on('checkers:move', ({ gameId, ...moveData }, callback) => {
    if (!gameId) return callback?.({ ok: false, error: 'Brak gameId' });

    const req = { params: { id: gameId }, body: { ...moveData} };
    const res = {
      status: (code) => { res._status = code; return res; },
      json: (data) => {
        if (res._status && res._status >= 400) {
          return callback?.({ ok: false, error: data?.error || 'Błąd ruchu' });
        }
        callback?.({ ok: true, data });
        if (data?.game) io.to(`checkers:${gameId}`).emit('checkers:state', data.game);
        emitRoomsUpdated("checkers");
      },
    };

    checkersController.makeMove(req, res);
  });

  socket.on("rooms:list", ({ gameKey }, cb) => {
    try {
      if (!gameKey) return cb?.({ ok: false, error: "Brak gameKey" });

      const controller = controllersByGameKey[gameKey];
      if (!controller || typeof controller.listRoomsSocket !== "function") {
        return cb?.({ ok: true, rooms: [] });
      }

      const rooms = controller.listRoomsSocket();
      cb?.({ ok: true, rooms });
    } catch (e) {
      cb?.({ ok: false, error: e?.message || "rooms:list error" });
    }
  });



  socket.on("rooms:create", ({ gameKey, roomName }, cb) => {
      try {
        if (!gameKey) return cb?.({ ok: false, error: "Brak gameKey" });

        const controller = controllersByGameKey[gameKey];
        if (!controller || typeof controller.createGameSocket !== "function") {
          return cb?.({ ok: false, error: `Gra ${gameKey} nie obsługuje tworzenia pokoju` });
        }

        const game = controller.createGameSocket({ roomName: roomName || null });

        const room = `${gameKey}:${game.id}`;
        socket.join(room);

        emitRoomsUpdated(gameKey);

        cb?.({ ok: true, roomId: game.id });
      } catch (e) {
        cb?.({ ok: false, error: e?.message || "rooms:create error" });
      }
    });




  socket.on('disconnect', () => {
    console.log(`Użytkownik ${socket.id} opuścił czat`);
    io.emit('online-count', io.engine.clientsCount);
  });
});

// start serwera
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
  console.log(`Serwer dostępny w sieci lokalnej na porcie ${PORT}`);
});
