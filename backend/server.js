const dotenv = require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
//import kontrolerow do gier
const checkersController = require('./controllers/checkersController');
const tictactoeController = require('./controllers/tictactoeController');
const diceController = require('./controllers/diceController');
const pictionaryController = require('./controllers/pictionaryController');
//import handlerow socketa
const setupGlobalChatHandler = require('./socketHandlers/globalchatHandler');
const setupGameRoomChatHandler = require('./socketHandlers/gameRoomChatHandler');
const setupGameSocketHandlers = require('./socketHandlers/gamehandler');
const setupRoomsHandler = require('./socketHandlers/roomHandler');
const setupDisconnectHandler = require('./socketHandlers/disconnectHandler');
const setupPictionaryHandler = require('./socketHandlers/pictionaryHandler');

//import routingu
const authRoutes = require('./routes/authRoutes');
const checkersRoutes = require('./routes/checkersRoutes');
const rankingRoutes = require('./routes/rankingRoutes');

const app = express();
const server = http.createServer(app);

const PORT = 3000;

// kontrolery pod gry (uniwersalne pokoje)
const controllersByGameKey = {
  checkers: checkersController,
  tictactoe: tictactoeController,
  dice: diceController,
  pictionary: pictionaryController,
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
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}

// middleware (Z MAIN)
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

// routing
app.use('/api/auth', authRoutes);
app.use('/api/checkers', checkersRoutes);
app.use('/api/ranking', rankingRoutes);

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

  // globalny czat
  setupGlobalChatHandler(socket, io);

  // czat w pokojach gier (uniwersalny)
  setupGameRoomChatHandler(socket, io);

  // ===== UNIWERSALNE HANDLERY DLA WSZYSTKICH GIER =====
  for (const [gameKey, controller] of Object.entries(controllersByGameKey)) {
    setupGameSocketHandlers(socket, io, gameKey, controller, emitRoomsUpdated);
  }

  // ===== SPECJALNE HANDLERY DLA PICTIONARY =====
  setupPictionaryHandler(socket, io, pictionaryController, emitRoomsUpdated);

  // ===== UNIVERSAL ROOMS SOCKETS =====
  setupRoomsHandler(socket, io, controllersByGameKey, emitRoomsUpdated);

  // obsługa rozłączenia
  setupDisconnectHandler(socket, io, controllersByGameKey, emitRoomsUpdated);

  // obsługa błędów połączenia (Z MAIN)
  socket.on('error', (err) => {
    console.error('Błąd Socket.IO:', err);
  });
});

// start serwera
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
  console.log(`Serwer dostępny w sieci lokalnej na porcie ${PORT}`);
});