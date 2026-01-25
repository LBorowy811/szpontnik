const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'app.db');

async function connectToDatabase() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  //tabela użytkownicy - users
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT UNIQUE,
      password TEXT,
      username TEXT UNIQUE,
      refresh_token TEXT
    )
  `);

  //tabela statystyk gier - game_stats
  await db.exec(`
    CREATE TABLE IF NOT EXISTS game_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_type TEXT NOT NULL,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, game_type)
    )
  `);

  return db;
}

module.exports = connectToDatabase;
