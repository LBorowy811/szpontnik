const fs = require('fs');
const path = require('path');
const usersFilePath = path.join(__dirname, '../data/users.json');

function loadUsers() {
  const data = fs.readFileSync(usersFilePath, 'utf8');
  return JSON.parse(data);
}

function saveUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

exports.register = (req, res) => {
  const { login, password, username } = req.body;

  if (!login || !password || !username) {
    return res.status(400).json({ message: 'Wszystkie pola są wymagane.' });
  }

  const users = loadUsers();

  if (users.find(u => u.login === login)) {
    return res.status(400).json({ message: 'Użytkownik o takim loginie już istnieje.' });
  }

  const newUser = { id: Date.now(), login, password, username };
  users.push(newUser);
  saveUsers(users);

  res.status(201).json({ message: 'Rejestracja zakończona sukcesem!' });
};

exports.login = (req, res) => {
  const { login, password } = req.body;

  const users = loadUsers();
  const user = users.find(u => u.login === login && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Nieprawidłowy login lub hasło.' });
  }

  res.json({ message: `Witaj, ${user.username}!`, user });
};
