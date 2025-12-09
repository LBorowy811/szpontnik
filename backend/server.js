const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

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
  
  // obsługa rozłączenia
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
