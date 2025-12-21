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
];
