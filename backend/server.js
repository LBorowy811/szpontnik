const dotenv = require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
  // żądania bez origin
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    // zezwalanie na polaczenia z localhost
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('http://localhost:') ||
      origin.includes('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }

    // zezwalanie na polaczenia z sieci lokalnych (popularne zakresy IP)
    const localNetworkPattern = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+):\d+$/;

    if (localNetworkPattern.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Brak dostępu z tego źródła'));
  },
  credentials: true,
  methods: ['GET', 'POST']
}});

const PORT = 3000;

//import routingu
const authRoutes = require('./routes/authRoutes');

//middleware
app.use(cors({
  // żądania bez origin
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    // zezwalanie na polaczenia z localhost
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('http://localhost:') ||
      origin.includes('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }

    // zezwalanie na polaczenia z sieci lokalnych (popularne zakresy IP)
    const localNetworkPattern = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+):\d+$/;

    if (localNetworkPattern.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Brak dostępu z tego źródła'));
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

//routing
app.use('/api/auth', authRoutes);

//prosty testowy endpoint
app.get('/', (req, res) => {
  res.send('Serwer Express działa 🎉');
});

// weryfikacja tokenu dla polaczen socket.io
io.use((socket, next) => {
  // sprawdzenie ciasteczek w nagłówkach
  const cookies = socket.handshake.headers.cookie;

  if (!cookies) {
    console.log("Socket.IO: Odrzucono połączenie - brak ciasteczek");
    return next(new Error('Brak tokenu autentykacyjnego'));
  }

  // pobranie tokenu z ciasteczek
  const cookieString = cookies;
  const tokenMatch = cookieString.match(/accessToken=([^;]+)/);

  // sprawdzenie istnienia tokenu
  if (!tokenMatch || !tokenMatch[1]) {
    console.log("Socket.IO: Odrzucono połączenie - brak tokenu w ciasteczkach");
    return next(new Error('Brak tokenu w ciasteczkach'));
  }

  const token = tokenMatch[1];

  // weryfikacja tokenu
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log("Socket.IO: Odrzucono połączenie - nieprawidłowy token");
      return next(new Error('Nieprawidłowy token'));
    }

    // dodanie informacji o użytkowniku do obiektu socket
    socket.user = {
      userId: decoded.userId,
      username: decoded.username,
      login: decoded.login
    };

    console.log(`Socket.IO: Użytkownik ${socket.user.username} połączony`);
    next();
  });
});

//obsluga polaczen socket.io
io.on('connection', (socket) => {
  console.log('Użytkownik połączył się:', socket.user.username, 'ID:', socket.id);

  io.emit('online-count', io.engine.clientsCount); //pokazywanie liczby uzytkownikow online

  socket.on('chat-message', (data) => {
    // walidacja i sanitizacja wiadomosci
    if (!data.message || typeof data.message !== 'string') {
      socket.emit('error', 'Nieprawidłowa wiadomość');
      return;
    }

    // minimalna dlugosc wiadomosci
    const messageText = data.message.trim();
    if (messageText.length === 0) {
      socket.emit('error', 'Wiadomość nie może być pusta');
      return;
    }

    // maksymalna dlugosc wiadomosci
    if (messageText.length > 1000) {
      socket.emit('error', 'Wiadomość jest zbyt długa (maksymalnie 1000 znaków)');
      return;
    }

    // korzystanie z danych z tokenu
    const message = {
      id: socket.id,
      username: socket.user.username,
      userId: socket.user.userId,
      message: messageText,
      timestamp: new Date().toLocaleTimeString('pl-PL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
    // wyslanie wiadomosci do wszystkich lacznie z tym ktory wyslal
    io.emit('chat-message', message);
  });
  
  //obluga rozlaczenia
  socket.on('disconnect', () => {
    console.log('Użytkownik opuścił czat:', socket.user.username, 'ID:', socket.id);
    io.emit('online-count', io.engine.clientsCount);
  });

  //osbluga bledow polaczenia
  socket.on('error', (err) => {
    console.error('Błąd Socket.IO:', err);
  });
});

//start serwera
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
  console.log(`Serwer dostępny w sieci lokalnej na porcie ${PORT}`);
});
