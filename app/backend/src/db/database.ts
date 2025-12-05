import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.DB_PATH || '/app/data/sessionaudio.db';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Open database
    db = new Database(DB_PATH);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Enable WAL mode for better concurrent access
    db.pragma('journal_mode = WAL');

    console.log(`Database connected: ${DB_PATH}`);
  }

  return db;
}

export function initializeDatabase(): void {
  const db = getDatabase();

  // Read and execute schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Split by semicolon and execute each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    db.exec(statement);
  }

  console.log('Database schema initialized');
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
