const express = require("express");
const router = express.Router();

const checkersController = require("../controllers/checkersController");

router.post("/new", checkersController.createGame);
router.get("/:id", checkersController.getGame);
router.post("/:id/move", checkersController.makeMove);

module.exports = router;
