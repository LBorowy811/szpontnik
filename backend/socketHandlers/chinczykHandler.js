const chinczykController = require('../controllers/chinczykController');

function setupChinczykHandler(socket, io) {
  const userId = socket.user?.userId;

  // Tworzenie pokoju
  socket.on('chinczyk:createRoom', ({ playerName, maxPlayers }, callback) => {
      try {
        const result = chinczykController.createRoom(playerName, userId, maxPlayers);
        
        if (result.success) {
          socket.join(result.roomId);
          callback(result);
        } else {
          callback(result);
        }
      } catch (error) {
        console.error('Error creating chinczyk room:', error);
        callback({ success: false, error: 'Błąd serwera' });
      }
    });

    // Dołączanie do pokoju
    socket.on('chinczyk:joinRoom', ({ roomId, playerName }, callback) => {
      try {
        const result = chinczykController.joinRoom(roomId, playerName, userId);
        
        if (result.success) {
          socket.join(roomId);
          
          // Powiadom innych graczy
          socket.to(roomId).emit('chinczyk:playerJoined', {
            players: result.players,
            playerName
          });
          
          callback(result);
        } else {
          callback(result);
        }
      } catch (error) {
        console.error('Error joining chinczyk room:', error);
        callback({ success: false, error: 'Błąd serwera' });
      }
    });

    // Opuszczanie pokoju
    socket.on('chinczyk:leaveRoom', ({ roomId }) => {
      try {
        const result = chinczykController.leaveRoom(roomId, userId);
        
        if (result) {
          socket.leave(roomId);
          
          if (!result.roomDeleted) {
            // Powiadom pozostałych graczy
            const room = chinczykController.getRoom(roomId);
            if (room) {
              const leavingPlayer = room.players.find(p => p.id === userId);
              socket.to(roomId).emit('chinczyk:playerLeft', {
                players: result.players,
                playerName: leavingPlayer?.name || 'Gracz'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error leaving chinczyk room:', error);
      }
    });

    // Rozpoczęcie gry
    socket.on('chinczyk:startGame', ({ roomId }, callback) => {
      try {
        const result = chinczykController.startGame(roomId, userId);
        
        if (result.success) {
          // Powiadom wszystkich graczy o rozpoczęciu gry
          io.to(roomId).emit('chinczyk:gameStarted', {
            gameState: result.gameState
          });
          
          callback({ success: true });
        } else {
          callback(result);
        }
      } catch (error) {
        console.error('Error starting chinczyk game:', error);
        callback({ success: false, error: 'Błąd serwera' });
      }
    });

    // Rzut kostką
    socket.on('chinczyk:rollDice', ({ roomId }, callback) => {
      try {
        const result = chinczykController.rollDice(roomId, userId);
        
        if (result.success) {
          // Powiadom wszystkich o wyniku rzutu
          io.to(roomId).emit('chinczyk:diceRolled', {
            playerId: userId,
            value: result.value,
            movablePawns: result.movablePawns
          });

          // Jeśli automatycznie zmieniono turę (brak ruchów)
          if (result.shouldChangeTurn) {
            const room = chinczykController.getRoom(roomId);
            io.to(roomId).emit('chinczyk:turnChanged', {
              currentTurn: room.gameState.currentTurn
            });
          }
          
          callback({ success: true, value: result.value });
        } else {
          callback(result);
        }
      } catch (error) {
        console.error('Error rolling dice:', error);
        callback({ success: false, error: 'Błąd serwera' });
      }
    });

    // Ruch pionka
    socket.on('chinczyk:movePawn', ({ roomId, pawnId }, callback) => {
      try {
        const result = chinczykController.movePawn(roomId, userId, pawnId);
        
        if (result.success) {
          // Powiadom wszystkich o ruchu
          io.to(roomId).emit('chinczyk:pawnMoved', {
            gameState: result.gameState,
            pawnId,
            captured: result.captured
          });

          // Jeśli zmieniono turę
          if (result.turnChanged) {
            io.to(roomId).emit('chinczyk:turnChanged', {
              currentTurn: result.nextTurn
            });
          }

          // Jeśli jest zwycięzca
          if (result.winner !== null && result.winner !== undefined) {
            io.to(roomId).emit('chinczyk:gameFinished', {
              winnerIndex: result.winner
            });
          }
          
          callback({ success: true });
        } else {
          callback(result);
        }
      } catch (error) {
        console.error('Error moving pawn:', error);
        callback({ success: false, error: 'Błąd serwera' });
      }
    });

    // Wiadomość czatu
    socket.on('chinczyk:chatMessage', ({ roomId, message }) => {
      try {
        const room = chinczykController.getRoom(roomId);
        if (!room) return;

        const player = room.gameState?.players.find(p => p.id === userId);
        if (!player) return;

        const playerIndex = room.gameState.players.indexOf(player);

        // Wyślij wiadomość do wszystkich w pokoju
        io.to(roomId).emit('chinczyk:chatMessage', {
          playerName: player.name,
          playerId: userId,
          playerIndex,
          message,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error sending chat message:', error);
      }
    });

    // Rozłączenie
    socket.on('disconnect', () => {
      // Automatycznie opuść wszystkie pokoje chinczyka
      // (socket.io automatycznie obsługuje opuszczanie pokoi)
    });
}

module.exports = setupChinczykHandler;
