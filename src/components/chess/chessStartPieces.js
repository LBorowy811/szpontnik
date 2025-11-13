export function makeChessStartPieces() {
  const pieces = []
  let id = 1

  for (let x = 0; x < 8; x++) {
    pieces.push({ id: id++, color: 'white', type: 'pawn', x: x, y: 6 })
  }

  const backRow = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
  for (let x = 0; x < 8; x++) {
    pieces.push({ id: id++, color: 'white', type: backRow[x], x: x, y: 7 })
  }

  for (let x = 0; x < 8; x++) {
    pieces.push({ id: id++, color: 'black', type: 'pawn', x: x, y: 1 })
  }

  for (let x = 0; x < 8; x++) {
    pieces.push({ id: id++, color: 'black', type: backRow[x], x: x, y: 0 })
  }

  return pieces
}
