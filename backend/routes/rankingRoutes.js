const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/rankingController');

// GET /api/ranking/:gameType - pobierz ranking dla danej gry
router.get('/:gameType', rankingController.getRankingByGame);

module.exports = router;
