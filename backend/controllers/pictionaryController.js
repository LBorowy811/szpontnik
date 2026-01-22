const gameUtils = require('../utils/gameUtils');

const games = new Map();

// Lista słów do zgadywania
const WORDS = [
  'pies', 'kot', 'dom', 'samochód', 'drzewo', 'kwiat', 'słońce', 'księżyc',
  'komputer', 'telefon', 'pizza', 'burger', 'książka', 'ołówek', 'krzesło',
  'stół', 'okno', 'drzwi', 'klucz', 'zegar', 'gitara', 'piłka', 'rower',
  'samolot', 'statek', 'pociąg', 'autobus', 'motocykl', 'parasol', 'buty',
  'czapka', 'okulary', 'torba', 'plecak', 'lustro', 'szczotka', 'mydło',
  'ręcznik', 'łóżko', 'poduszka', 'koc', 'lampa', 'telewizor', 'radio',
  'lodówka', 'kuchenka', 'mikser', 'widelec', 'nóż', 'łyżka', 'talerz',
];

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function createGameSocket({ roomName } = {}) {
  const gameId = gameUtils.generateGameId();

  const newGame = {
    id: gameId,
    roomName: roomName || null,
    players: [],
    maxPlayers: 8,
    minPlayers: 2,
    currentDrawerIndex: 0,
    currentWord: getRandomWord(),
    canvas: [],
    guesses: [],
    scores: {},
    roundStartTime: Date.now(),
    roundDuration: 60000, // 60 sekund na rundę
    status: 'waiting',
    createdAt: new Date().toISOString(),
    rematchReady: {},
  };

  games.set(gameId, newGame);
  return newGame;
}

function getGameSocket(gameId) {
  return gameUtils.getGameSocket(games, gameId);
}

function deleteGameSocket(gameId) {
  return gameUtils.deleteGameSocket(games, gameId);
}

function listRoomsSocket() {
  return gameUtils.listRoomsSocket(games);
}

function joinGameSocket({ gameId, username, userId, socketId }) {
  const result = gameUtils.joinGameSocketBase(games, { gameId, username, userId, socketId }, (game) => {
    // Inicjalizuj punkty dla nowego gracza
    if (!game.scores[userId]) {
      game.scores[userId] = 0;
    }

    // Rozpocznij grę jeśli jest wystarczająco graczy
    if (game.players.length >= game.minPlayers && game.status === 'waiting') {
      game.status = 'ongoing';
      game.roundStartTime = Date.now();
    }
  });

  return result;
}

function draw(req, res) {
  const { id } = req.params;
  const body = req.body || {};
  const { userId, drawData } = body;

  const game = games.get(id);
  if (!game) return res.status(404).json({ error: 'Gra o podanym ID nie istnieje' });

  if (game.status !== 'ongoing') {
    return res.status(400).json({ error: 'Gra nie jest w trakcie' });
  }

  if (!userId) return res.status(400).json({ error: 'Brak userId' });

  const currentDrawer = game.players[game.currentDrawerIndex];
  if (!currentDrawer || String(currentDrawer.userId) !== String(userId)) {
    return res.status(403).json({ error: 'Nie jesteś rysującym' });
  }

  if (!drawData) {
    return res.status(400).json({ error: 'Brak danych rysunku' });
  }

  game.canvas.push(drawData);

  return res.json({ success: true, game });
}

function guess(req, res) {
  const { id } = req.params;
  const body = req.body || {};
  const { userId, guessWord } = body;

  const game = games.get(id);
  if (!game) return res.status(404).json({ error: 'Gra o podanym ID nie istnieje' });

  if (game.status !== 'ongoing') {
    return res.status(400).json({ error: 'Gra nie jest w trakcie' });
  }

  if (!userId) return res.status(400).json({ error: 'Brak userId' });

  const player = game.players.find(p => String(p.userId) === String(userId));
  if (!player) return res.status(403).json({ error: 'Nie jesteś graczem w tej grze' });

  const currentDrawer = game.players[game.currentDrawerIndex];
  if (currentDrawer && String(currentDrawer.userId) === String(userId)) {
    return res.status(403).json({ error: 'Rysujący nie może zgadywać' });
  }

  if (!guessWord) {
    return res.status(400).json({ error: 'Brak słowa' });
  }

  const normalizedGuess = guessWord.toLowerCase().trim();
  const normalizedWord = game.currentWord.toLowerCase().trim();

  let correct = false;
  if (normalizedGuess === normalizedWord) {
    // Poprawna odpowiedź
    correct = true;
    const elapsedTime = Date.now() - game.roundStartTime;
    const timeBonus = Math.max(0, game.roundDuration - elapsedTime);
    const points = Math.floor(100 + (timeBonus / 1000) * 10);

    game.scores[userId] = (game.scores[userId] || 0) + points;

    // Również nagroda dla rysującego
    if (currentDrawer) {
      game.scores[currentDrawer.userId] = (game.scores[currentDrawer.userId] || 0) + 50;
    }

    game.guesses.push({
      userId,
      username: player.username,
      guess: guessWord,
      correct: true,
      timestamp: new Date().toISOString(),
    });

    // Przejdź do następnej rundy
    nextRound(game);
  } else {
    game.guesses.push({
      userId,
      username: player.username,
      guess: guessWord,
      correct: false,
      timestamp: new Date().toISOString(),
    });
  }

  return res.json({ success: true, correct, game });
}

function nextRound(game) {
  game.currentDrawerIndex = (game.currentDrawerIndex + 1) % game.players.length;
  game.currentWord = getRandomWord();
  game.canvas = [];
  game.guesses = [];
  game.roundStartTime = Date.now();
}

function skipRound(req, res) {
  const { id } = req.params;
  const body = req.body || {};
  const { userId } = body;

  const game = games.get(id);
  if (!game) return res.status(404).json({ error: 'Gra o podanym ID nie istnieje' });

  if (game.status !== 'ongoing') {
    return res.status(400).json({ error: 'Gra nie jest w trakcie' });
  }

  if (!userId) return res.status(400).json({ error: 'Brak userId' });

  const currentDrawer = game.players[game.currentDrawerIndex];
  if (!currentDrawer || String(currentDrawer.userId) !== String(userId)) {
    return res.status(403).json({ error: 'Nie jesteś rysującym' });
  }

  nextRound(game);

  return res.json({ success: true, game });
}

function clearCanvas(req, res) {
  const { id } = req.params;
  const body = req.body || {};
  const { userId } = body;

  const game = games.get(id);
  if (!game) return res.status(404).json({ error: 'Gra o podanym ID nie istnieje' });

  if (game.status !== 'ongoing') {
    return res.status(400).json({ error: 'Gra nie jest w trakcie' });
  }

  if (!userId) return res.status(400).json({ error: 'Brak userId' });

  const currentDrawer = game.players[game.currentDrawerIndex];
  if (!currentDrawer || String(currentDrawer.userId) !== String(userId)) {
    return res.status(403).json({ error: 'Nie jesteś rysującym' });
  }

  game.canvas = [];

  return res.json({ success: true, game });
}

function setRematchReady(gameId, userId) {
  return gameUtils.setRematchReady(games, gameId, userId);
}

function createRematchGameFromOld(oldGame) {
  const gameId = gameUtils.generateGameId();

  const newGame = {
    id: gameId,
    roomName: oldGame.roomName || null,
    players: oldGame.players ? oldGame.players.map(p => ({ ...p })) : [],
    maxPlayers: oldGame.maxPlayers || 8,
    minPlayers: oldGame.minPlayers || 2,
    currentDrawerIndex: 0,
    currentWord: getRandomWord(),
    canvas: [],
    guesses: [],
    scores: {},
    roundStartTime: Date.now(),
    roundDuration: 60000,
    status: oldGame.players.length >= 2 ? 'ongoing' : 'waiting',
    rematchReady: {},
  };

  // Zresetuj punkty
  newGame.players.forEach(p => {
    newGame.scores[p.userId] = 0;
  });

  games.set(gameId, newGame);
  return newGame;
}

module.exports = {
  createGameSocket,
  getGameSocket,
  joinGameSocket,
  listRoomsSocket,
  draw,
  guess,
  skipRound,
  clearCanvas,
  setRematchReady,
  createRematchGameFromOld,
  deleteGameSocket,
};
