// frontend/src/services/checkersService.js

const API_URL = "http://localhost:3000/api/checkers";

export async function createGame(player1, player2) {
  const res = await fetch(`${API_URL}/new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ player1, player2 }),
  });

  if (!res.ok) {
    throw new Error(`Create game failed: ${res.status}`);
  }

  return await res.json();
}

export async function getGame(id) {
  const res = await fetch(`${API_URL}/${id}`);

  if (!res.ok) {
    throw new Error(`Get game failed: ${res.status}`);
  }

  return await res.json();
}

export async function makeMove(gameId, payload) {
  const res = await fetch(`http://localhost:3000/api/checkers/${gameId}/move`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Make move failed: ${res.status}`);
  }

  return await res.json();
}

