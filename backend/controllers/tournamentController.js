const gameUtils = require('../utils/gameUtils');

const tournaments = new Map();

class TournamentController {
  constructor() {
    this.supportedGames = ['checkers', 'tictactoe', 'chinczyk'];
  }

  createTournament({ name, gameType, creatorId, creatorName, maxPlayers = 4 }) {
    if (!this.supportedGames.includes(gameType)) {
      return { ok: false, error: 'Nieobsługiwana gra' };
    }

    if (![4, 8].includes(maxPlayers)) {
      return { ok: false, error: 'Turniej może mieć 4 lub 8 graczy' };
    }

    const tournamentId = gameUtils.generateGameId();
    
    const tournament = {
      id: tournamentId,
      name: name || `Turniej ${tournamentId.substring(0, 6)}`,
      gameType,
      creatorId,
      maxPlayers,
      status: 'waiting',
      players: [{
        userId: creatorId,
        username: creatorName,
        socketId: null
      }],
      bracket: this.createBracket(maxPlayers),
      currentRound: null,
      winner: null,
      createdAt: new Date().toISOString()
    };

    tournaments.set(tournamentId, tournament);
    return { ok: true, tournament };
  }

  createBracket(maxPlayers) {
    if (maxPlayers === 4) {
      return {
        semifinals: [
          { id: 'sf1', players: [], gameId: null, winner: null, status: 'waiting' },
          { id: 'sf2', players: [], gameId: null, winner: null, status: 'waiting' }
        ],
        final: { id: 'final', players: [], gameId: null, winner: null, status: 'waiting' }
      };
    } else if (maxPlayers === 8) {
      return {
        quarterfinals: [
          { id: 'qf1', players: [], gameId: null, winner: null, status: 'waiting' },
          { id: 'qf2', players: [], gameId: null, winner: null, status: 'waiting' },
          { id: 'qf3', players: [], gameId: null, winner: null, status: 'waiting' },
          { id: 'qf4', players: [], gameId: null, winner: null, status: 'waiting' }
        ],
        semifinals: [
          { id: 'sf1', players: [], gameId: null, winner: null, status: 'waiting' },
          { id: 'sf2', players: [], gameId: null, winner: null, status: 'waiting' }
        ],
        final: { id: 'final', players: [], gameId: null, winner: null, status: 'waiting' }
      };
    }
  }

  joinTournament({ tournamentId, userId, username, socketId }) {
    const tournament = tournaments.get(tournamentId);
    
    if (!tournament) {
      return { ok: false, error: 'Turniej nie istnieje' };
    }

    if (tournament.status !== 'waiting') {
      return { ok: false, error: 'Turniej już się rozpoczął' };
    }

    if (tournament.players.length >= tournament.maxPlayers) {
      return { ok: false, error: 'Turniej jest pełny' };
    }

    const existingPlayer = tournament.players.find(p => String(p.userId) === String(userId));
    if (existingPlayer) {
      existingPlayer.socketId = socketId;
      existingPlayer.username = username;
      return { ok: true, tournament };
    }

    tournament.players.push({ userId, username, socketId });

    if (tournament.players.length === tournament.maxPlayers) {
      this.startTournament(tournamentId);
    }

    return { ok: true, tournament };
  }

  startTournament(tournamentId) {
    const tournament = tournaments.get(tournamentId);
    
    if (!tournament) {
      return { ok: false, error: 'Turniej nie istnieje' };
    }

    if (tournament.status !== 'waiting') {
      return { ok: false, error: 'Turniej już się rozpoczął' };
    }

    if (tournament.players.length !== tournament.maxPlayers) {
      return { ok: false, error: `Wymagana liczba graczy: ${tournament.maxPlayers}` };
    }

    const shuffledPlayers = [...tournament.players].sort(() => Math.random() - 0.5);

    if (tournament.maxPlayers === 4) {
      tournament.bracket.semifinals[0].players = [shuffledPlayers[0], shuffledPlayers[1]];
      tournament.bracket.semifinals[1].players = [shuffledPlayers[2], shuffledPlayers[3]];
      tournament.currentRound = 'semifinals';
    } else if (tournament.maxPlayers === 8) {
      for (let i = 0; i < 4; i++) {
        tournament.bracket.quarterfinals[i].players = [
          shuffledPlayers[i * 2],
          shuffledPlayers[i * 2 + 1]
        ];
      }
      tournament.currentRound = 'quarterfinals';
    }

    tournament.status = 'in_progress';
    return { ok: true, tournament };
  }

  createMatchGame({ tournamentId, matchId, gameController }) {
    const tournament = tournaments.get(tournamentId);
    
    if (!tournament) {
      return { ok: false, error: 'Turniej nie istnieje' };
    }

    const match = this.findMatch(tournament, matchId);
    if (!match) {
      return { ok: false, error: 'Mecz nie istnieje' };
    }

    console.log('[TOURNAMENT] createMatchGame:', { matchId, status: match.status, playersCount: match.players?.length });

    if (match.status !== 'waiting') {
      return { ok: false, error: `Mecz już się rozpoczął lub nie jest gotowy (status: ${match.status})` };
    }
    
    if (!match.players || match.players.length < 2) {
      return { ok: false, error: 'Mecz nie ma wystarczającej liczby graczy' };
    }

    const game = gameController.createGameSocket({ roomName: `${tournament.name} - ${matchId}` });
    match.gameId = game.id;
    match.status = 'in_progress';

    return { ok: true, gameId: game.id, tournament };
  }

  reportMatchResult({ tournamentId, matchId, winnerId }) {
    const tournament = tournaments.get(tournamentId);
    
    if (!tournament) {
      return { ok: false, error: 'Turniej nie istnieje' };
    }

    const match = this.findMatch(tournament, matchId);
    if (!match) {
      return { ok: false, error: 'Mecz nie istnieje' };
    }

    const winner = match.players.find(p => String(p.userId) === String(winnerId));
    if (!winner) {
      return { ok: false, error: 'Nieprawidłowy zwycięzca' };
    }

    match.winner = winner;
    match.status = 'finished';

    this.advanceWinner(tournament, matchId, winner);

    return { ok: true, tournament };
  }

  advanceWinner(tournament, matchId, winner) {
    const bracket = tournament.bracket;

    if (tournament.currentRound === 'quarterfinals') {
      const qfIndex = bracket.quarterfinals.findIndex(m => m.id === matchId);
      const sfIndex = Math.floor(qfIndex / 2);
      
      if (!bracket.semifinals[sfIndex].players) {
        bracket.semifinals[sfIndex].players = [];
      }
      
      const alreadyInSemifinal = bracket.semifinals[sfIndex].players.some(p => String(p.userId) === String(winner.userId));
      if (!alreadyInSemifinal) {
        bracket.semifinals[sfIndex].players.push(winner);
      }

      const allQFFinished = bracket.quarterfinals.every(m => m.status === 'finished');
      if (allQFFinished) {
        tournament.currentRound = 'semifinals';
        bracket.semifinals.forEach(sf => {
          if (sf.players && sf.players.length === 2 && sf.status !== 'finished') {
            sf.status = 'waiting';
          }
        });
      }
    } else if (tournament.currentRound === 'semifinals') {
      if (!bracket.final.players) {
        bracket.final.players = [];
      }
      
      const alreadyInFinal = bracket.final.players.some(p => String(p.userId) === String(winner.userId));
      if (!alreadyInFinal) {
        bracket.final.players.push(winner);
      }

      const allSFFinished = bracket.semifinals.every(m => m.status === 'finished');
      if (allSFFinished) {
        tournament.currentRound = 'final';
        if (bracket.final.players.length === 2) {
          bracket.final.status = 'waiting';
        }
      }
    } else if (tournament.currentRound === 'final') {
      tournament.winner = winner;
      tournament.status = 'finished';
    }
  }

  findMatch(tournament, matchId) {
    const bracket = tournament.bracket;
    
    if (bracket.quarterfinals) {
      const qf = bracket.quarterfinals.find(m => m.id === matchId);
      if (qf) return qf;
    }
    
    if (bracket.semifinals) {
      const sf = bracket.semifinals.find(m => m.id === matchId);
      if (sf) return sf;
    }
    
    if (bracket.final && bracket.final.id === matchId) {
      return bracket.final;
    }
    
    return null;
  }

  listTournaments({ gameType, status }) {
    let list = Array.from(tournaments.values());
    
    if (gameType) {
      list = list.filter(t => t.gameType === gameType);
    }
    
    if (status) {
      list = list.filter(t => t.status === status);
    }
    
    return { ok: true, tournaments: list };
  }

  getTournament(tournamentId) {
    const tournament = tournaments.get(tournamentId);
    
    if (!tournament) {
      return { ok: false, error: 'Turniej nie istnieje' };
    }
    
    return { ok: true, tournament };
  }

  deleteTournament(tournamentId) {
    tournaments.delete(tournamentId);
    return { ok: true };
  }
}

module.exports = new TournamentController();
