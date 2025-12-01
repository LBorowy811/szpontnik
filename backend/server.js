const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite dev server default port
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;

//import routingu
const authRoutes = require('./routes/authRoutes');

//middleware
app.use(cors());
app.use(bodyParser.json());

//routing
app.use('/api/auth', authRoutes);


//prosty testowy endpoint
app.get('/', (req, res) => {
  res.send('Serwer Express działa 🎉');
});

//Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Użytkownik połączony:', socket.id);

  // Informuj innych o nowym użytkowniku
  socket.broadcast.emit('user-connected', {
    id: socket.id,
    message: 'Użytkownik dołączył do czatu'
  });

  socket.on('disconnect', () => {
    console.log('Użytkownik rozłączony:', socket.id);
    // Informuj innych o rozłączeniu
    socket.broadcast.emit('user-disconnected', {
      id: socket.id,
      message: 'Użytkownik opuścił czat'
    });
  });

  // Obsługa wiadomości czatu
  socket.on('chat-message', (data) => {
    console.log('Otrzymano wiadomość czatu:', data);
    
    // Tworzymy obiekt wiadomości z timestamp
    const message = {
      id: socket.id,
      username: data.username || 'Anonimowy',
      message: data.message,
      timestamp: new Date().toLocaleTimeString('pl-PL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    // Wysyłamy do wszystkich klientów (włącznie z nadawcą)
    io.emit('chat-message', message);
  });

  // Event do sprawdzenia liczby użytkowników online
  socket.on('get-online-count', () => {
    socket.emit('online-count', io.engine.clientsCount);
  });
});

//start serwera
server.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
  console.log(`Socket.IO gotowy do połączeń`);
});
