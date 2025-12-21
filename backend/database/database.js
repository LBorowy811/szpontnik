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

  return db;
}

module.exports = connectToDatabase;
