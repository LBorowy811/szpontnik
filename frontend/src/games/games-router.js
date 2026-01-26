export default [
  {
    path: "/games/checkers",
    name: "Checkers",
    component: () => import("./checkers/CheckersView.vue"),
  },
  {
    path: "/games/chess",
    name: "Chess",
    component: () => import("./chess/ChessView.vue"),
  },
  {
    path: "/games/scrable",
    name: "Scrable",
    component: () => import("./scrable/ScrableView.vue"),
  },
  {
    path: "/games/tictactoe",
    name: "TicTacToe",
    component: () => import("./tictactoe/TicTacToeView.vue"),
  },
  {
    path: "/games/dice",
    name: "Dice",
    component: () => import("./dice/DiceView.vue"),
  },
  {
    path: "/games/chinczyk",
    name: "Chinczyk",
    component: () => import("./chinczyk/ChinczykView.vue"),
  },
  {
    path: "/games/pictionary",
    name: "Pictionary",
    component: () => import("./pictionary/PictionaryView.vue"),
  },
];
