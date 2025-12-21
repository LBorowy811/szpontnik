const connectToDatabase = require('../database/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// rejestracja
exports.register = async (req, res) => {
  const { login, password, username } = req.body;

  if (!login || !password || !username) {
    return res.status(400).json({ message: 'Wszystkie pola są wymagane.' });
  }

  try {
    const db = await connectToDatabase();

    // sprawdzenie, czy użytkownik o podanym loginie już istnieje
    const existingUserByLogin = await db.get('SELECT * FROM users WHERE login = ?', [login]);
    if (existingUserByLogin) {
      return res.status(400).json({ message: 'Użytkownik o takim loginie już istnieje.' });
    }

    // sprawdzenie, czy użytkonik o podanej nazwie już istnieje
    const existingUserByUsername = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUserByUsername) {
      return res.status(400).json({ message: 'Ta nazwa użytkonika jest już zajęta.' });
    }

    //hashowanie hasła
    const hashedPassword = await bcrypt.hash(password, 10);

    // zapisanie użytkonika w bazie
    await db.run(
      'INSERT INTO users (login, password, username) VALUES (?, ?, ?)',
      [login, hashedPassword, username]
    );
    res.status(201).json({ message: 'Rejestracja zakończona sukcesem!' });

  } catch (err) {
   if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message?.includes('UNIQUE constraint')) {
      
    // sprawdzenie czego dotyczy błąd
      if (err.message?.includes('username')) {
        return res.status(400).json({ message: 'Ta nazwa użytkownika jest już zajęta.' });
      } 
      else if (err.message?.includes('login')) {
        return res.status(400).json({ message: 'Użytkownik o takim loginie już istnieje.' });
      }
    }

    console.error('Błąd podczas rejestracji:', err);
    return res.status(500).json({ message: 'Błąd serwera podczas rejestracji.' });
  }
};

// logowanie
exports.login = async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ message: 'Login i hasło są wymagane.' });
  }

  try {
    const db = await connectToDatabase();

    // pobranie użytkownika z bazy
    const user = await db.get('SELECT * FROM users WHERE login = ?', [login]);

    // sprawdzenie, czy użytkownik istnieje
    if (!user) {
      return res.status(401).json({ message: 'Nieprawidłowy login lub hasło.' });
    }

    // porównanie podanego hasła z zahashowanym hasłem w bazie
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Nieprawidłowy login lub hasło.' });
    }

    const { password: _, ...userWithoutPassword } = user;

    // generowanie tokenu
    const token = jwt.sign(
      {  
        userId: user.id,
        username: user.username,
        login: user.login
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '2h' }
    );

    // ustawienie tokenu w ciasteczku
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
      maxAge: 7200000 // 2 godziny w milisekundach
    });

    // zwrócenie informacji o użytkowniku (bez tokenu)
    res.json({ 
      message: `Witaj, ${user.username}!`, 
      user: userWithoutPassword, 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
};

// wylogowanie
exports.logout = (req, res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
    maxAge: 0 //natychmiastowe wygaszenie ciasteczka
  });

  res.json({ message: 'Wylogowano pomyślnie.' });
}
