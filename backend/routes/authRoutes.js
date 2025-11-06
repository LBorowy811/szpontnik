const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

//rejestracja
router.post('/register', authController.register);

//logowanie
router.post('/login', authController.login);

module.exports = router;
