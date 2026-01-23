const gameUtils = require('../utils/gameUtils');

const games = new Map();

// Kategorie górnej części
const UPPER_CATEGORIES = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
// Kategorie dolnej części
const LOWER_CATEGORIES = ['threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yahtzee', 'chance'];

function rollDice(count = 5) {
  const dice = [];
  for (let i = 0; i < count; i++) {
    dice.push(Math.floor(Math.random() * 6) + 1);
  }
  return dice;
}

function countDice(dice) {
  const counts = [0, 0, 0, 0, 0, 0]; // indeksy 0-5 odpowiadają wartościom 1-6
  for (const value of dice) {
    if (value >= 1 && value <= 6) {
      counts[value - 1]++;
    }
  }
  return counts;
}

function calculateUpperScore(dice, category) {
  const categoryIndex = UPPER_CATEGORIES.indexOf(category);
  if (categoryIndex === -1) return 0;
  
  const targetValue = categoryIndex + 1;
  const counts = countDice(dice);
  return counts[categoryIndex] * targetValue;
}

function calculateLowerScore(dice, category) {
  const counts = countDice(dice);
  const sorted = [...counts].sort((a, b) => b - a);
  const sum = dice.reduce((a, b) => a + b, 0);
  
  switch (category) {
    case 'threeOfAKind':
      return sorted[0] >= 3 ? sum : 0;
    
    case 'fourOfAKind':
      return sorted[0] >= 4 ? sum : 0;
    
    case 'fullHouse':
      return (sorted[0] === 3 && sorted[1] === 2) ? 25 : 0;
    
    case 'smallStraight':
      // Sprawdź czy są 4 kolejne liczby
      const has1234 = counts[0] > 0 && counts[1] > 0 && counts[2] > 0 && counts[3] > 0;
      const has2345 = counts[1] > 0 && counts[2] > 0 && counts[3] > 0 && counts[4] > 0;
      const has3456 = counts[2] > 0 && counts[3] > 0 && counts[4] > 0 && counts[5] > 0;
      return (has1234 || has2345 || has3456) ? 30 : 0;
    
    case 'largeStraight':
      // Sprawdź czy są 5 kolejnych liczb
      const has12345 = counts[0] > 0 && counts[1] > 0 && counts[2] > 0 && counts[3] > 0 && counts[4] > 0;
      const has23456 = counts[1] > 0 && counts[2] > 0 && counts[3] > 0 && counts[4] > 0 && counts[5] > 0;
      return (has12345 || has23456) ? 40 : 0;
    
    case 'yahtzee':
      return sorted[0] === 5 ? 50 : 0;
    
    case 'chance':
      return sum;
    
    default:
      return 0;
  }
}

function calculateScore(dice, category) {
  if (UPPER_CATEGORIES.includes(category)) {
    return calculateUpperScore(dice, category);
  } else if (LOWER_CATEGORIES.includes(category)) {
    return calculateLowerScore(dice, category);
  }
  return 0;
}

function checkUpperBonus(upperScores) {
  const sum = Object.values(upperScores).reduce((a, b) => a + (b || 0), 0);
  return sum >= 63 ? 35 : 0;
}

function initializePlayerScore() {
  const score = {
    upper: {
      ones: null,
      twos: null,
      threes: null,
      fours: null,
      fives: null,
      sixes: null,
    },
    lower: {
      threeOfAKind: null,
      fourOfAKind: null,
      fullHouse: null,
      smallStraight: null,
      largeStraight: null,
      yahtzee: null,
      chance: null,
    },
    upperBonus: 0,
    yahtzeeBonus: 0, // premia za kolejne yahtzee
  };
  
  return score;
}

function getTotalScore(playerScore) {
  const upperSum = Object.values(playerScore.upper).reduce((a, b) => a + (b || 0), 0);
  const lowerSum = Object.values(playerScore.lower).reduce((a, b) => a + (b || 0), 0);
  return upperSum + playerScore.upperBonus + lowerSum + playerScore.yahtzeeBonus;
}

function createGameSocket({ roomName } = {}) {
  const gameId = gameUtils.generateGameId();
  
  const newGame = {
    id: gameId,
    roomName: roomName || null,
    players: [],
    maxPlayers: 4,
    minPlayers: 2,
    scores: {}, // userId -> score object
    currentPlayerIndex: 0,
    currentRound: 1,
    currentRoll: 0,
    currentDice: [],
    keptDice: [],
    playersReady: {}, // userId -> boolean (gotowość do rozpoczęcia)
    status: 'waiting', // waiting, ongoing, finished
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

function assignPlayerOrderIfReady(game) {
  if (!game) return;
  
  if (!Array.isArray(game.players) || game.players.length < game.minPlayers) return;
  
  // Sprawdź czy wszyscy gracze są gotowi
  const allReady = game.players.every(p => game.playersReady?.[p.userId] === true);
  
  if (allReady && game.status === 'waiting') {
    // Rozpocznij grę
    game.status = 'ongoing';
    game.currentPlayerIndex = 0;
    game.currentRound = 1;
    game.currentRoll = 0;
    game.currentDice = [];
    game.keptDice = [];
    
    // Inicjalizuj wyniki dla wszystkich graczy
    for (const player of game.players) {
      if (!game.scores[player.userId]) {
        game.scores[player.userId] = initializePlayerScore();
      }
    }
  }
}

function joinGameSocket({ gameId, username, userId, socketId }) {
  return gameUtils.joinGameSocketBase(games, { gameId, username, userId, socketId }, assignPlayerOrderIfReady);
}

function setPlayerReady(gameId, userId, ready) {
  const game = games.get(gameId);
  if (!game) return { ok: false, error: 'Gra nie istnieje' };
  
  if (game.status !== 'waiting') {
    return { ok: false, error: 'Gra już się rozpoczęła' };
  }
  
  const playerIndex = gameUtils.getPlayerIndexByUserId(game, userId);
  if (playerIndex === null) {
    return { ok: false, error: 'Nie jesteś graczem w tej grze' };
  }
  
  if (!game.playersReady) game.playersReady = {};
  game.playersReady[userId] = ready === true;

  const wasWaiting = game.status === 'waiting';
  assignPlayerOrderIfReady(game);
  
  const gameStarted = wasWaiting && game.status === 'ongoing';
  
  return { ok: true, game };
}

function rollDiceMove(gameId, userId, keepIndices = []) {
  const game = games.get(gameId);
  if (!game) return { ok: false, error: 'Gra nie istnieje' };
  
  if (game.status !== 'ongoing') {
    return { ok: false, error: 'Gra nie jest w trakcie' };
  }
  
  const playerIndex = gameUtils.getPlayerIndexByUserId(game, userId);
  if (playerIndex === null) {
    return { ok: false, error: 'Nie jesteś graczem w tej grze' };
  }
  
  if (game.currentPlayerIndex !== playerIndex) {
    return { ok: false, error: 'To nie twoja tura' };
  }
  
  // Walidacja keepIndices
  if (!Array.isArray(keepIndices)) keepIndices = [];
  if (game.currentRoll === 0) {
    // Pierwszy rzut - wszystkie kostki
    game.currentDice = rollDice(5);
    game.keptDice = [];
    game.currentRoll = 1;
  } else if (game.currentRoll === 1) {
    // Drugi rzut
    if (keepIndices.length > 0 && keepIndices.length < 5) {
      const kept = keepIndices.map(i => game.currentDice[i]).filter(v => v !== undefined);
      game.keptDice = kept;
      const toRoll = 5 - kept.length;
      const newRolls = rollDice(toRoll);
      game.currentDice = [...kept, ...newRolls];
      game.currentRoll = 2;
    } else {
      // Rzucamy wszystkimi ponownie
      game.currentDice = rollDice(5);
      game.keptDice = [];
      game.currentRoll = 2;
    }
  } else if (game.currentRoll === 2) {
    // Trzeci rzut
    if (keepIndices.length > 0 && keepIndices.length < 5) {
      const kept = keepIndices.map(i => game.currentDice[i]).filter(v => v !== undefined);
      game.keptDice = kept;
      const toRoll = 5 - kept.length;
      const newRolls = rollDice(toRoll);
      game.currentDice = [...kept, ...newRolls];
      game.currentRoll = 3;
    } else {
      // Rzucamy wszystkimi ponownie
      game.currentDice = rollDice(5);
      game.keptDice = [];
      game.currentRoll = 3;
    }
  } else {
    return { ok: false, error: 'Wykorzystałeś już wszystkie rzuty w tej turze' };
  }
  
  return { ok: true, game };
}

function selectCategoryMove(gameId, userId, category) {
  const game = games.get(gameId);
  if (!game) return { ok: false, error: 'Gra nie istnieje' };
  
  if (game.status !== 'ongoing') {
    return { ok: false, error: 'Gra nie jest w trakcie' };
  }
  
  const playerIndex = gameUtils.getPlayerIndexByUserId(game, userId);
  if (playerIndex === null) {
    return { ok: false, error: 'Nie jesteś graczem w tej grze' };
  }
  
  if (game.currentPlayerIndex !== playerIndex) {
    return { ok: false, error: 'To nie twoja tura' };
  }
  
  if (game.currentRoll === 0) {
    return { ok: false, error: 'Musisz najpierw rzucić kostkami' };
  }
  
  if (!game.scores[userId]) {
    game.scores[userId] = initializePlayerScore();
  }
  
  const playerScore = game.scores[userId];
  
  // Sprawdź czy kategoria jest już wykorzystana
  const [categoryType, categoryName] = category.includes(':') 
    ? category.split(':') 
    : [category in playerScore.upper ? 'upper' : 'lower', category];
  
  if (categoryType === 'upper') {
    if (playerScore.upper[categoryName] !== null) {
      return { ok: false, error: 'Ta kategoria jest już wykorzystana' };
    }
  } else {
    if (playerScore.lower[categoryName] !== null) {
      return { ok: false, error: 'Ta kategoria jest już wykorzystana' };
    }
  }
  
  // Oblicz punkty
  const dice = game.currentDice;
  let points = 0;
  let isYahtzee = false;
  
  // Sprawdź czy to yahtzee (wszystkie kostki jednakowe)
  const counts = countDice(dice);
  const sorted = [...counts].sort((a, b) => b - a);
  isYahtzee = sorted[0] === 5;
  
  if (categoryType === 'upper') {
    points = calculateUpperScore(dice, categoryName);
    playerScore.upper[categoryName] = points;
  } else {
    points = calculateLowerScore(dice, categoryName);
    
    // Obsługa dżokera i yahtzee
    if (isYahtzee) {
      const yahtzeeValue = dice[0];
      const yahtzeeUpperCategory = UPPER_CATEGORIES[yahtzeeValue - 1];
      
      // Sprawdź czy yahtzee jest już wykorzystany i czy odpowiednia kategoria górna też
      const yahtzeeUsed = playerScore.lower.yahtzee !== null;
      const upperCategoryUsed = playerScore.upper[yahtzeeUpperCategory] !== null;
      
      if (yahtzeeUsed && upperCategoryUsed) {
        // Można użyć jako dżoker
        if (categoryName === 'yahtzee') {
          // Kolejny yahtzee - premia 100 pkt jeśli pierwszy był zapisany w yahtzee
          if (playerScore.lower.yahtzee === 50) {
            playerScore.yahtzeeBonus += 100;
            points = 100; // premia
          } else {
            points = calculateLowerScore(dice, categoryName);
          }
        } else {
          // Dżoker w dolnej kategorii
          const allLowerUsed = Object.values(playerScore.lower).every(v => v !== null);
          if (allLowerUsed) {
            // Wszystkie dolne wykorzystane - trzeba zapisać w górnej za 0
            return { ok: false, error: 'Wszystkie dolne kategorie wykorzystane - dżoker musi być zapisany w górnej za 0 pkt' };
          } else {
            points = calculateLowerScore(dice, categoryName);
          }
        }
      } else if (categoryName === 'yahtzee') {
        points = 50;
      }
      
      playerScore.lower[categoryName] = points;
    } else {
      playerScore.lower[categoryName] = points;
    }
  }
  
  // Sprawdź bonus za górną część
  playerScore.upperBonus = checkUpperBonus(playerScore.upper);
  
  // Zakończ turę - przejdź do następnego gracza
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
  game.currentRoll = 0;
  game.currentDice = [];
  game.keptDice = [];
  
  // Sprawdź czy wszyscy gracze skończyli rundę
  if (game.currentPlayerIndex === 0) {
    game.currentRound++;
    
    // Sprawdź czy gra się skończyła (13 rund)
    if (game.currentRound > 13) {
      game.status = 'finished';
      
      // Oblicz końcowe wyniki
      const finalScores = {};
      for (const player of game.players) {
        finalScores[player.userId] = getTotalScore(game.scores[player.userId]);
      }
      
      // Znajdź zwycięzcę
      let maxScore = -1;
      let winnerIndex = null;
      for (let i = 0; i < game.players.length; i++) {
        const score = finalScores[game.players[i].userId];
        if (score > maxScore) {
          maxScore = score;
          winnerIndex = i;
        }
      }
      
      game.winnerIndex = winnerIndex;
      game.winner = game.players[winnerIndex]?.userId || null;
    }
  }
  
  return { ok: true, game };
}

function makeMove(req, res) {
  const { id } = req.params;
  const body = req.body || {};
  const { action, userId, keepIndices, category } = body;
  
  const game = games.get(id);
  if (!game) return res.status(404).json({ error: 'Gra o podanym ID nie istnieje' });
  
  if (!userId) return res.status(400).json({ error: 'Brak userId' });
  
  let result;
  
  if (action === 'roll') {
    result = rollDiceMove(id, userId, keepIndices);
  } else if (action === 'selectCategory') {
    result = selectCategoryMove(id, userId, category);
  } else if (action === 'setReady') {
    result = setPlayerReady(id, userId, body.ready);
  } else {
    return res.status(400).json({ error: 'Nieprawidłowa akcja' });
  }
  
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  
  return res.json({ success: true, game: result.game });
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
    maxPlayers: oldGame.maxPlayers || 4,
    minPlayers: oldGame.minPlayers || 2,
    scores: {},
    currentPlayerIndex: 0,
    currentRound: 1,
    currentRoll: 0,
    currentDice: [],
    keptDice: [],
    playersReady: {},
    status: 'waiting',
    createdAt: new Date().toISOString(),
    rematchReady: {},
  };
  
  games.set(gameId, newGame);
  return newGame;
}

module.exports = {
  createGameSocket,
  getGameSocket,
  joinGameSocket,
  listRoomsSocket,
  makeMove,
  setRematchReady,
  createRematchGameFromOld,
  deleteGameSocket,
};