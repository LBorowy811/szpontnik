export function makeChessStartPieces() {
  const pieces = [];
  let id = 1;

  const add = (color, type, x, y) => {
    pieces.push({ id: id++, color, type, x, y });
  };

  const backRankBlack = ["r", "n", "b", "q", "k", "b", "n", "r"];
  backRankBlack.forEach((t, x) => add("black", t, x, 0));
  for (let x = 0; x < 8; x++) add("black", "p", x, 1);

  const backRankWhite = ["r", "n", "b", "q", "k", "b", "n", "r"];
  backRankWhite.forEach((t, x) => add("white", t, x, 7));
  for (let x = 0; x < 8; x++) add("white", "p", x, 6);

  return pieces;
}
