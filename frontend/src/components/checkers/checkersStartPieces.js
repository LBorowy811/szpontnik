export function makeCheckersStartPieces(){
  const pieces = []
  let id = 1

  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 8; x++) {
      if ((x + y) % 2 === 1)
        pieces.push({ id: id++, color: 'black', x, y, type: 'man', king: false })
    }
  }

  for (let y = 5; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if ((x + y) % 2 === 1)
        pieces.push({ id: id++, color: 'white', x, y, type: 'man', king: false })
    }
  }

  return pieces
}
