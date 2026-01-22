function setupDisconnectHandler(socket, io, controllersByGameKey, emitRoomsUpdated) {
    socket.on('disconnect', () => {
      console.log('Użytkownik opuścił czat:', socket.user?.username || 'Nieznany', 'ID:', socket.id);
      
      if (socket.user?.userId) {
        const userId = socket.user.userId;
        
        // Usuń gracza ze wszystkich gier
        for (const [gameKey, controller] of Object.entries(controllersByGameKey)) {
          if (!controller || typeof controller.getGameSocket !== 'function' || typeof controller.listRoomsSocket !== 'function') continue;
          
          const rooms = controller.listRoomsSocket();
          
          for (const room of rooms) {
            const game = controller.getGameSocket(room.id);
            if (!game) continue;
            
            // Sprawdź czy gra używa tablicy players[]
            if (!Array.isArray(game.players)) continue;
  
            const playerIndex = game.players.findIndex(p => String(p.userId) === String(userId));
  
            if (playerIndex !== -1) {
              // Usuń gracza z tablicy
              game.players.splice(playerIndex, 1);
              const roomName = `${gameKey}:${game.id}`;
              
              // Sprawdź czy pokój jest pusty (nie ma żadnych graczy)
              const hasNoPlayers = game.players.length === 0;
              
              if (hasNoPlayers && controller.deleteGameSocket) {
                // Usuń pusty pokój
                controller.deleteGameSocket(game.id);
                io.to(roomName).emit(`${gameKey}:state`, null);
              } else {
                // Wyślij zaktualizowany stan gry
                io.to(roomName).emit(`${gameKey}:state`, game);
              }
              
              emitRoomsUpdated(gameKey);
            }
          }
        }
      }
      
      io.emit('online-count', io.engine.clientsCount);
    });
  }
  
  module.exports = setupDisconnectHandler;