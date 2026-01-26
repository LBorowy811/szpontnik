const chinczykController = require('../controllers/chinczykController');

function setupChinczykHandler(socket, io) {
  const userId = socket.user?.userId;

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
        callback({ success: false, error: 'BĹ‚Ä…d serwera' });
      }
    });

    socket.on('chinczyk:joinRoom', ({ roomId, playerName }, callback) => {
      try {
        const result = chinczykController.joinRoom(roomId, playerName, userId);

        if (result.success) {
          socket.join(roomId);

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
        callback({ success: false, error: 'BĹ‚Ä…d serwera' });
      }
    });

    socket.on('chinczyk:leaveRoom', ({ roomId }) => {
      try {
        const result = chinczykController.leaveRoom(roomId, userId);

        if (result) {
          socket.leave(roomId);

          if (!result.roomDeleted) {

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

    socket.on('chinczyk:startGame', ({ roomId }, callback) => {
      try {
        const result = chinczykController.startGame(roomId, userId);

        if (result.success) {

          io.to(roomId).emit('chinczyk:gameStarted', {
            gameState: result.gameState
          });

          callback({ success: true });
        } else {
          callback(result);
        }
      } catch (error) {
        console.error('Error starting chinczyk game:', error);
        callback({ success: false, error: 'BĹ‚Ä…d serwera' });
      }
    });

    socket.on('chinczyk:rollDice', ({ roomId }, callback) => {
      try {
        const result = chinczykController.rollDice(roomId, userId);

        if (result.success) {

          io.to(roomId).emit('chinczyk:diceRolled', {
            playerId: userId,
            value: result.value,
            movablePawns: result.movablePawns
          });

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
        callback({ success: false, error: 'BĹ‚Ä…d serwera' });
      }
    });

    socket.on('chinczyk:movePawn', ({ roomId, pawnId }, callback) => {
      try {
        const result = chinczykController.movePawn(roomId, userId, pawnId);

        if (result.success) {

          io.to(roomId).emit('chinczyk:pawnMoved', {
            gameState: result.gameState,
            pawnId,
            captured: result.captured
          });

          if (result.turnChanged) {
            io.to(roomId).emit('chinczyk:turnChanged', {
              currentTurn: result.nextTurn
            });
          }

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
        callback({ success: false, error: 'BĹ‚Ä…d serwera' });
      }
    });

    socket.on('chinczyk:chatMessage', ({ roomId, message }) => {
      try {
        const room = chinczykController.getRoom(roomId);
        if (!room) return;

        const player = room.gameState?.players.find(p => p.id === userId);
        if (!player) return;

        const playerIndex = room.gameState.players.indexOf(player);

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

    socket.on('disconnect', () => {

    });
}

module.exports = setupChinczykHandler;

