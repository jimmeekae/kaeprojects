import Database from 'better-sqlite3';

export const db = new Database('data.db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS charges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT UNIQUE,
    amount REAL,
    phone_number TEXT,
    currency TEXT,
    provider TEXT,
    provider_ref TEXT,
    status TEXT
  )
`).run();