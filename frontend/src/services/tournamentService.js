import socket from './socket';

export function createTournament({ name, gameType, userId, username, maxPlayers }) {
  return new Promise((resolve, reject) => {
    socket.emit('tournament:create', { name, gameType, userId, username, maxPlayers }, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || 'Nie udało się utworzyć turnieju'));
      resolve(resp.tournament);
    });
  });
}

export function joinTournament({ tournamentId, userId, username }) {
  return new Promise((resolve, reject) => {
    socket.emit('tournament:join', { tournamentId, userId, username }, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || 'Nie udało się dołączyć do turnieju'));
      resolve(resp.tournament);
    });
  });
}

export function startTournament({ tournamentId, userId }) {
  return new Promise((resolve, reject) => {
    socket.emit('tournament:start', { tournamentId, userId }, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || 'Nie udało się rozpocząć turnieju'));
      resolve(resp.tournament);
    });
  });
}

export function getTournament(tournamentId) {
  return new Promise((resolve, reject) => {
    socket.emit('tournament:get', { tournamentId }, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || 'Nie udało się pobrać turnieju'));
      resolve(resp.tournament);
    });
  });
}

export function listTournaments({ gameType, status } = {}) {
  return new Promise((resolve, reject) => {
    socket.emit('tournament:list', { gameType, status }, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || 'Nie udało się pobrać listy turniejów'));
      resolve(resp.tournaments);
    });
  });
}

export function reportMatchResult({ tournamentId, matchId, winnerId }) {
  return new Promise((resolve, reject) => {
    socket.emit('tournament:reportResult', { tournamentId, matchId, winnerId }, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || 'Nie udało się zgłosić wyniku'));
      resolve(resp.tournament);
    });
  });
}

export function createMatchGame({ tournamentId, matchId }) {
  return new Promise((resolve, reject) => {
    socket.emit('tournament:createMatch', { tournamentId, matchId }, (resp) => {
      if (!resp?.ok) return reject(new Error(resp?.error || 'Nie udało się utworzyć meczu'));
      resolve({ gameId: resp.gameId, tournament: resp.tournament });
    });
  });
}
