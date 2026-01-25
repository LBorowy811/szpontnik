const connectToDatabase = require('../database/database');

// Pobierz ranking dla danej gry
exports.getRankingByGame = async (req, res) => {
  const { gameType } = req.params;

  const validGameTypes = ['dice', 'checkers', 'tictactoe'];
  if (!validGameTypes.includes(gameType)) {
    return res.status(400).json({
      message: 'Nieprawidłowy typ gry'
    });
  }

  try {
    const db = await connectToDatabase();

    const ranking = await db.all(`
      SELECT
        u.username,
        gs.wins,
        gs.losses,
        gs.draws,
        (gs.wins + gs.losses + gs.draws) as total_games,
        CASE
          WHEN (gs.wins + gs.losses + gs.draws) > 0
          THEN ROUND(gs.wins * 100.0 / (gs.wins + gs.losses + gs.draws), 1)
          ELSE 0
        END as win_percentage
      FROM game_stats gs
      JOIN users u ON gs.user_id = u.id
      WHERE gs.game_type = ?
      ORDER BY gs.wins DESC, win_percentage DESC
      LIMIT 100
    `, [gameType]);

    res.json({
      gameType,
      ranking
    });

  } catch (err) {
    console.error('Błąd pobierania rankingu:', err);
    res.status(500).json({
      message: 'Błąd serwera podczas pobierania rankingu'
    });
  }
};

// Aktualizuj statystyki gracza (wywoływane przez kontrolery gier)
async function updateStats(userId, gameType, result) {
  if (!userId || !gameType || !result) {
    console.error('updateStats: brak wymaganych parametrów', { userId, gameType, result });
    return;
  }

  const validResults = ['win', 'loss', 'draw'];
  if (!validResults.includes(result)) {
    console.error('updateStats: nieprawidłowy wynik', result);
    return;
  }

  try {
    const db = await connectToDatabase();

    // Sprawdź czy rekord istnieje
    const existing = await db.get(
      'SELECT id FROM game_stats WHERE user_id = ? AND game_type = ?',
      [userId, gameType]
    );

    if (existing) {
      // Aktualizuj istniejący rekord
      const column = result === 'win' ? 'wins' : result === 'loss' ? 'losses' : 'draws';
      await db.run(
        `UPDATE game_stats SET ${column} = ${column} + 1 WHERE user_id = ? AND game_type = ?`,
        [userId, gameType]
      );
    } else {
      // Utwórz nowy rekord
      const wins = result === 'win' ? 1 : 0;
      const losses = result === 'loss' ? 1 : 0;
      const draws = result === 'draw' ? 1 : 0;

      await db.run(
        'INSERT INTO game_stats (user_id, game_type, wins, losses, draws) VALUES (?, ?, ?, ?, ?)',
        [userId, gameType, wins, losses, draws]
      );
    }

    console.log(`Statystyki zaktualizowane: userId=${userId}, gameType=${gameType}, result=${result}`);

  } catch (err) {
    console.error('Błąd aktualizacji statystyk:', err);
  }
}

module.exports = {
  getRankingByGame: exports.getRankingByGame,
  updateStats
};
