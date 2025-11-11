// Database Configuration and Initialization / Datenbankkonfiguration und Initialisierung
// Sets up SQLite database connection and creates tables
// Richtet SQLite-Datenbankverbindung ein und erstellt Tabellen

import BetterSqlite3 from "better-sqlite3";
import path from "path";
import fs from "fs";

// Database file path / Datenbankdateipfad
const DB_DIR = path.join(__dirname, "../data");
const DB_PATH = path.join(DB_DIR, "blog.sqlite");

// Ensure data directory exists / Stelle sicher, dass Datenverzeichnis existiert
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Create database connection / Erstelle Datenbankverbindung
const db: BetterSqlite3.Database = new BetterSqlite3(DB_PATH);

// Enable foreign key constraints / Aktiviere Fremdschlüssel-Einschränkungen
db.pragma("foreign_keys = ON");

// Initialize database tables / Initialisiere Datenbanktabellen
export async function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log("Initializing database...");

      // Create authors table / Erstelle Autoren-Tabelle
      // Stores author information with basic profile data
      // Speichert Autoreninformationen mit grundlegenden Profildaten
      db.exec(`
        CREATE TABLE IF NOT EXISTS authors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          bio TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);

      // Create posts table / Erstelle Beitrags-Tabelle
      // Stores blog posts with relationship to authors
      // Speichert Blog-Beiträge mit Beziehung zu Autoren
      db.exec(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          excerpt TEXT NOT NULL,
          content TEXT NOT NULL,
          author_id INTEGER,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL
        )
      `);

      // Create index on slug for faster lookups / Erstelle Index auf Slug für schnellere Suchen
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)
      `);

      // Create index on author_id for faster joins / Erstelle Index auf author_id für schnellere Joins
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)
      `);

      console.log("Database tables created successfully!");
      resolve();
    } catch (error) {
      console.error("Database initialization error:", error);
      reject(error);
    }
  });
}

// Export database instance / Exportiere Datenbankinstanz
export default db;
