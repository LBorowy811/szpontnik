const connectToDatabase = require('../database/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// stale
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000; // 15 minut
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7dni

// generowanie access tokenu
const createAccessToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username, 
      login: user.login 
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
};

  // generowanie refresh tokenu
const createRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
};

// rejestracja
exports.register = async (req, res) => {
  const { login, password, username } = req.body;

  // sprawdzenie, czy wszystkie pola są wypełnione
  if (!login || !password || !username) {
    return res.status(400).json({ 
      message: 'Wszystkie pola są wymagane.'
    });
  }

  try {
    const db = await connectToDatabase();

    // pobieranie użytkownika o danym loginie z bazy
    const existingUserByLogin = await db.get(
      'SELECT * FROM users WHERE login = ?', 
      [login]
    );

    // sprawdzenie, czy użytkownik o danym loginie już istnieje
    if (existingUserByLogin) {
      return res.status(400).json({ 
        message: 'Użytkownik o takim loginie już istnieje.' 
      });
    }

    // pobieranie użytkownika o danym username z bazy
    const existingUserByUsername = await db.get(
      'SELECT * FROM users WHERE username = ?', 
      [username]
    );

    // sprawdzenie, czy użytkownik o danym username już istnieje
    if (existingUserByUsername) {
      return res.status(400).json({ 
        message: 'Ta nazwa użytkonika jest już zajęta.' 
      });
    }

    //hashowanie hasła
    const hashedPassword = await bcrypt.hash(password, 10);

    // zapisanie użytkonika w bazie
    await db.run(
      'INSERT INTO users (login, password, username) VALUES (?, ?, ?)',
      [login, hashedPassword, username]
    );

    // jeżeli rejestracja się powiedzie
    res.status(201).json({ 
      message: 'Rejestracja zakończona sukcesem!' 
    });

  } catch (err) {
   if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || 
       err.message?.includes('UNIQUE constraint')) {

    // jeżeli błąd dotyczy username
      if (err.message?.includes('username')) {
        return res.status(400).json({ 
          message: 'Ta nazwa użytkownika jest już zajęta.' 
        });
      } 
      // jeżeli błąd dotyczy loginu
      else if (err.message?.includes('login')) {
        return res.status(400).json({ 
          message: 'Użytkownik o takim loginie już istnieje.' 
        });
      }
    }

    // inne błędy (np. db, biblioteki itp.)
    console.error('Błąd podczas rejestracji:', err);
    return res.status(500).json({ 
      message: 'Błąd serwera podczas rejestracji.' 
    });
  }
};

// logowanie
exports.login = async (req, res) => {
  const { login, password } = req.body;

  // sprawdzenie, czy wszystkie pola są wypełnmione
  if (!login || !password) {
    return res.status(400).json({ 
      message: 'Login i hasło są wymagane.' 
    });
  }

  try {
    const db = await connectToDatabase();

    // pobranie loginu użytkownika z bazy
    const user = await db.get(
      'SELECT * FROM users WHERE login = ?', 
      [login]);

    // sprawdzenie, czy użytkownik istnieje
    if (!user) {
      return res.status(401).json({ 
        message: 'Nieprawidłowy login lub hasło.' 
      });
    }

    // porównanie podanego hasła z zahashowanym hasłem w bazie
    const isPasswordValid = await bcrypt.compare(
      password, 
      user.password
    );

    // jeżeli hasło jest niewlaściwe
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Nieprawidłowy login lub hasło.' 
      });
    }

    // destrukturyzacja usera
    const { password: _, ...userWithoutPassword } = user;

    // generowanie tokenów
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user.id);

    // zapisanie refresh tokenu do bazy
    await db.run(
      'UPDATE users SET refresh_token = ? WHERE id = ?', 
      [refreshToken, user.id]
    );

    // ustawienie access tokenu w ciasteczku
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
      maxAge: ACCESS_COOKIE_MAX_AGE
    });

    // ustawienie refresh tokenu w ciasteczku
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
      maxAge: REFRESH_COOKIE_MAX_AGE
    });

    // zwrócenie informacji o użytkowniku
    res.json({ 
      message: `Witaj, ${user.username}!`, 
      user: userWithoutPassword, 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Błąd serwera.' 
    });
  }
};

// wylogowanie
exports.logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  // ustawienie refresh token na NULL jezeli istnieje
  if (refreshToken) {
    const db = await connectToDatabase();
    await db.run(
      'UPDATE users SET refresh_token = NULL WHERE refresh_token = ?',
      [refreshToken]
    );
  }

  // czyszczenie ciasteczek
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  // zwrócenie informacji o wylogowaniu
  res.json({ 
    message: 'Wylogowano pomyślnie.' 
  });
}

// odświeżanie tokenu
exports.refresh = async (req, res) => {

  // odczytywanie tokenu z ciasteczka
  const refreshToken = req.cookies.refreshToken;

  // sprawdzenie, czy token istnieje
  if (!refreshToken) {
    return res.status(401).json({ 
      message: 'Brak refresh tokenu.' 
    })
  }

  try {
    const db = await connectToDatabase()

    //weryfikacja tokenu
    const decoded = jwt.verify(
      refreshToken, 
      process.env.REFRESH_TOKEN_SECRET
    );

    //weryfikacja istnienia użytkownika i tokenu w bazie
    const user = await db.get(
      'SELECT * FROM users WHERE id = ? AND refresh_token = ?', 
      [decoded.userId, refreshToken]
    );

    if (!user) {
      return res.status(403).json({ 
        message: 'Nieprawidłowy refresh token.' 
      });
    }

    // generowanie nowych tokenów
    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user.id);

    //aktualizacja refresh tokenu w bazie
    await db.run(
      'UPDATE users SET refresh_token = ? WHERE id = ?', 
      [newRefreshToken, decoded.userId]
    );

    // ustawienie access tokenu w ciasteczku
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
      maxAge: ACCESS_COOKIE_MAX_AGE
    });

    // ustawienie refresh tokenu w ciasteczku
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
      maxAge: REFRESH_COOKIE_MAX_AGE
    });

    // destrukturyzacja usera
    const { password: _, refreshToken : __, ...userWithoutPassword } = user;

    // zwrocenie informacji o odswiezeniu tokenu
    res.json({ 
      message: 'Token odświeżony pomyślnie', 
      user: userWithoutPassword, 
    });

  } catch (err) {
    // obsluga bledow jwt

    // token wygasl
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        message: 'Refresh token wygasł, zaloguj się ponownie.' 
      });
    }

    // token jest nieprawidlowy
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        message: 'Nieprawidłowy refresh token.' 
      });
    }

    console.error("Błąd podczas odświeżania tokenu:", err);
    res.status(500).json({ 
      message: 'Błąd serwera podczas odświeżania tokenu.' 
    });
  }
}
