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

//obsluga polaczen socket.io
io.on('connection', (socket) => {
  console.log('Użytkownik połączył się:', socket.id);

  io.emit('online-count', io.engine.clientsCount); //pokazywanie liczby uzytkownikow online

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
    // wyslanie wiadomosci do wszystkich lacznie z tym ktory wyslal
    io.emit('chat-message', message);
  });
  
  //obluga rozlaczenia
  socket.on('disconnect', () => {
    console.log(`Użytkownik ${socket.id} opuścił czat`);
    io.emit('online-count', io.engine.clientsCount);
  });
});

//start serwera
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
  console.log(`Serwer dostępny w sieci lokalnej na porcie ${PORT}`);
});
