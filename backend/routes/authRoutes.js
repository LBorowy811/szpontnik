const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

//rejestracja
router.post('/register', authController.register);

//logowanie
router.post('/login', authController.login);

//odświeżanie tokenu
router.post('/refresh', authController.refresh);

//wylogowanie
router.post('/logout' ,authController.logout);

//weryfikacja tokenu - endpoint dla frontendu do sprawdzania ważności tokenu
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: {
            id: req.user.userId,
            username: req.user.username,
            login: req.user.login
        }
    });
});

module.exports = router;
