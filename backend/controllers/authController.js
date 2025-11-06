const connectToDatabase = require('../database/database');

//rejestracja
exports.register = async (req, res) => {
  const { login, password, username } = req.body;

  if (!login || !password || !username) {
    return res.status(400).json({ message: 'Wszystkie pola są wymagane.' });
  }

  try {
    const db = await connectToDatabase();

    const existingUser = await db.get('SELECT * FROM users WHERE login = ?', [login]);
    if (existingUser) {
      return res.status(400).json({ message: 'Użytkownik o takim loginie już istnieje.' });
    }

    await db.run(
      'INSERT INTO users (login, password, username) VALUES (?, ?, ?)',
      [login, password, username]
    );

    res.status(201).json({ message: 'Rejestracja zakończona sukcesem!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
};

//logowanie
exports.login = async (req, res) => {
  const { login, password } = req.body;

  try {
    const db = await connectToDatabase();

    const user = await db.get(
      'SELECT * FROM users WHERE login = ? AND password = ?',
      [login, password]
    );

    if (!user) {
      return res.status(401).json({ message: 'Nieprawidłowy login lub hasło.' });
    }

    res.json({ message: `Witaj, ${user.username}!`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
};
