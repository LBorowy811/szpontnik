const dotenv = require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const checkersController = require('./controllers/checkersController');

const app = express();
const server = http.createServer(app);

const PORT = 3000;

// import routingu
const authRoutes = require('./routes/authRoutes');
const checkersRoutes = require('./routes/checkersRoutes');

// kontrolery pod gry (uniwersalne pokoje)
const controllersByGameKey = {
  checkers: checkersController,
  // chess: chessController,
  // literaki: literakiController,
};

// funkcja pomocnicza do konfiguracji cors (Z MAIN)
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // zezwól na połączenie bez origin

    const allowedLocalhost = ['localhost', '127.0.0.1', 'http://localhost:', 'http://127.0.0.1:'];
    if (allowedLocalhost.some(host => origin.includes(host))) return callback(null, true);

    const localNetworkPattern =
      /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+):\d+$/;
    if (localNetworkPattern.test(origin)) return callback(null, true);

    callback(new Error('Brak dostępu z tego źródła'));
  },
  credentials: true,
<<<<<<< HEAD
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}
=======
  methods: ['GET', 'POST'],
};
>>>>>>> origin/main

// middleware (Z MAIN)
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

// routing
app.use('/api/auth', authRoutes);
app.use('/api/checkers', checkersRoutes);

// testowy endpoint
app.get('/', (req, res) => {
  res.send('Serwer Express działa 🎉');
});

// socket.io (Z MAIN)
const io = new Server(server, { cors: corsOptions });

// ===== TWOJE: UNIVERSAL ROOMS EMIT (dla listy pokoi) =====
function emitRoomsUpdated(gameKey) {
  try {
    const controller = controllersByGameKey[gameKey];
    if (!controller || typeof controller.listRoomsSocket !== 'function') return;

    const rooms = controller.listRoomsSocket();
    io.emit('rooms:updated', { gameKey, rooms });
  } catch (e) {
    console.error('emitRoomsUpdated error:', e);
  }
}

// weryfikacja tokenu dla polaczen socket.io (Z MAIN + tokenExpired)
io.use(async (socket, next) => {
  const cookies = socket.handshake.headers.cookie;

  if (!cookies) {
    console.log('Socket.IO: Odrzucono połączenie - brak ciasteczek');
    return next(new Error('Brak tokenu autentykacyjnego'));
  }

  const tokenMatch = cookies.match(/accessToken=([^;]+)/);

  if (!tokenMatch || !tokenMatch[1]) {
    console.log('Socket.IO: Odrzucono połączenie - brak tokenu w ciasteczkach');
    return next(new Error('Brak tokenu w ciasteczkach'));
  }

  const token = tokenMatch[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        console.log('Socket.IO: Token wygasł - wymaga ponownego połączenia');
        return next(new Error('Token wygasł'));
      }
      console.log('Socket.IO: Odrzucono połączenie - nieprawidłowy token');
      return next(new Error('Nieprawidłowy token'));
    }

    // dodanie danych użytkownika do obiektu socket
    socket.user = {
      userId: decoded.userId,
      username: decoded.username,
      login: decoded.login,
    };

    console.log(`Socket.IO: Użytkownik ${socket.user.username} połączony`);
    next();
  });
});

// ===== obsługa połączeń socket.io =====
io.on('connection', (socket) => {
  console.log('Użytkownik połączył się:', socket.user?.username || 'Nieznany', 'ID:', socket.id);

  // liczba użytkowników online
  io.emit('online-count', io.engine.clientsCount);

  // walidacja i sanitizacja wiadomosci (Z MAIN)
  socket.on('chat-message', (data) => {
    if (!data.message || typeof data.message !== 'string') {
      socket.emit('error', 'Nieprawidłowa wiadomość');
      return;
    }

    const messageText = data.message.trim();
    if (messageText.length === 0) {
      socket.emit('error', 'Wiadomość nie może być pusta');
      return;
    }

    if (messageText.length > 1000) {
      socket.emit('error', 'Wiadomość jest zbyt długa (maksymalnie 1000 znaków)');
      return;
    }

    const message = {
      id: socket.id,
      username: socket.user?.username || 'Anonimowy',
      userId: socket.user?.userId || null,
      message: messageText,
      timestamp: new Date().toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    io.emit('chat-message', message);
  });

  // ===== CHECKERS SOCKETS (TWOJE) =====
  socket.on('checkers:createGame', (payload, cb) => {
    try {
      const game = checkersController.createGameSocket(payload);
      const room = `checkers:${game.id}`;

      socket.join(room);
      io.to(room).emit('checkers:state', game);

      emitRoomsUpdated('checkers');

      cb?.({ ok: true, game });
    } catch (e) {
      cb?.({ ok: false, error: e?.message || 'createGame socket error' });
    }
  });

  socket.on('checkers:watchGame', ({ gameId }, cb) => {
    const game = checkersController.getGameSocket(gameId);
    if (!game) return cb?.({ ok: false, error: 'Gra nie istnieje' });

    const room = `checkers:${gameId}`;
    socket.join(room);

    io.to(room).emit('checkers:state', game);
    cb?.({ ok: true, game });
  });

  socket.on('checkers:joinGame', ({ gameId, side, username, userId }, cb) => {
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

    io.to(room).emit('checkers:state', result.game);
    emitRoomsUpdated('checkers');

    cb?.({ ok: true, game: result.game });
  });

  socket.on('checkers:rematchReady', ({ gameId, userId }, cb) => {
    try {
      if (!gameId) return cb?.({ ok: false, error: 'Brak gameId' });
      if (!userId) return cb?.({ ok: false, error: 'Brak userId' });

      const result = checkersController.setRematchReady(gameId, userId);
      if (!result.ok) return cb?.(result);

      const roomOld = `checkers:${gameId}`;

      io.to(roomOld).emit('checkers:rematchStatus', {
        gameId,
        count: result.count,
        ready: result.game.rematchReady,
      });

      if (result.bothReady) {
        const oldGame = checkersController.getGameSocket(gameId);
        const newGame = checkersController.createRematchGameFromOld(oldGame);
        const roomNew = `checkers:${newGame.id}`;

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

        io.to(roomNew).emit('checkers:state', newGame);
        io.to(roomNew).emit('checkers:rematchStarted', { newGameId: newGame.id });

        oldGame.rematchReady = { left: false, right: false };

        // po rematchu: stara gra nie jest ongoing -> update listy pokoi
        emitRoomsUpdated('checkers');
      }

      cb?.({ ok: true, count: result.count });
    } catch (e) {
      cb?.({ ok: false, error: e?.message || 'rematchReady error' });
    }
  });

  socket.on('checkers:move', ({ gameId, ...moveData }, callback) => {
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

        if (data?.game) io.to(`checkers:${gameId}`).emit('checkers:state', data.game);

        emitRoomsUpdated('checkers');
      },
    };

    checkersController.makeMove(req, res);
  });

  // ===== UNIVERSAL ROOMS SOCKETS (TWOJE) =====
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

      emitRoomsUpdated(gameKey);

      cb?.({ ok: true, roomId: game.id });
    } catch (e) {
      cb?.({ ok: false, error: e?.message || 'rooms:create error' });
    }
  });

  //obluga rozlaczenia (Z MAIN)
  socket.on('disconnect', () => {
    console.log('Użytkownik opuścił czat:', socket.user?.username || 'Nieznany', 'ID:', socket.id);
    io.emit('online-count', io.engine.clientsCount);
  });

  //osbluga bledow polaczenia (Z MAIN)
  socket.on('error', (err) => {
    console.error('Błąd Socket.IO:', err);
  });
});

// start serwera
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
  console.log(`Serwer dostępny w sieci lokalnej na porcie ${PORT}`);
});
