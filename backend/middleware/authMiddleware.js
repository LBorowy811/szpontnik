const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // pobranie tokenu z ciasteczek
    const token = req.cookies.accessToken;

    // brak tokenu
    if (!token) {
        return res.status(401).json({ message: 'Brak tokenu'});
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            // nieprawidłowy token
            return res.status(403).json({ message: "Nieprawidłowy lub wygasły token"});
        }

        // dodanie informacji o użytkowniku do obiektu request
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken };
