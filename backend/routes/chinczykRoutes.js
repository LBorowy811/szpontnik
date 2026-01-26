const express = require('express');
const router = express.Router();
const chinczykController = require('../controllers/chinczykController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/rooms', (req, res) => {
  try {
    const rooms = chinczykController.listRooms();
    res.json({ success: true, rooms });
  } catch (error) {
    console.error('Error listing chinczyk rooms:', error);
    res.status(500).json({ success: false, error: 'BĹ‚Ä…d serwera' });
  }
});

router.get('/rooms/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    const room = chinczykController.getRoom(roomId);

    if (!room) {
      return res.status(404).json({ success: false, error: 'PokĂłj nie istnieje' });
    }

    res.json({ 
      success: true, 
      room: {
        id: room.id,
        players: room.players,
        maxPlayers: room.maxPlayers,
        gameStarted: room.gameStarted,
        currentTurn: room.gameState?.currentTurn,
        winner: room.gameState?.winner
      }
    });
  } catch (error) {
    console.error('Error getting chinczyk room:', error);
    res.status(500).json({ success: false, error: 'BĹ‚Ä…d serwera' });
  }
});

module.exports = router;

