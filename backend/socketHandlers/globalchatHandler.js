// handler dla globalnego czatu
function setupGlobalChatHandler(socket, io) {
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
}

module.exports = setupGlobalChatHandler;

