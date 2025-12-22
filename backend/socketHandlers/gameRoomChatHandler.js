// uniwersalny handler dla czatu w pokojach gier
function setupGameRoomChatHandler(socket, io) {
  socket.on('room:chat', (data) => {
    if (!data.message || typeof data.message !== 'string') {
      socket.emit('error', 'Nieprawidłowa wiadomość');
      return;
    }

    if (!data.gameKey || typeof data.gameKey !== 'string') {
      socket.emit('error', 'Brak gameKey');
      return;
    }

    if (!data.gameId || typeof data.gameId !== 'string') {
      socket.emit('error', 'Brak gameId');
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

    const room = `${data.gameKey}:${data.gameId}`;
    
    // sprawdzenie czy socket jest w pokoju
    const rooms = Array.from(socket.rooms);
    if (!rooms.includes(room)) {
      socket.emit('error', 'Nie jesteś w tym pokoju gry');
      return;
    }

    const message = {
      gameKey: data.gameKey,
      gameId: data.gameId,
      id: socket.id,
      username: socket.user?.username || 'Anonimowy',
      userId: socket.user?.userId || null,
      message: messageText,
      timestamp: new Date().toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    // emitowanie wiadomości tylko do pokoju gry
    io.to(room).emit('room:chat', message);
  });
}

module.exports = setupGameRoomChatHandler;

