// Author Type Definitions / Autoren-Typdefinitionen
// Defines TypeScript interfaces for author data structures
// Definiert TypeScript-Schnittstellen für Autorendatenstrukturen

// Complete author object / Vollständiges Autorenobjekt
// Used by: authorModel.ts for data operations / Verwendet von: authorModel.ts für Datenoperationen
// Stored in: SQLite database authors table / Gespeichert in: SQLite-Datenbank authors-Tabelle
export interface Author {
  // Unique identifier, auto-incremented / Eindeutige Kennung, auto-inkrementiert
  id: number;

  // Author's full name / Vollständiger Name des Autors
  // Required field / Pflichtfeld
  name: string;

  // Author's email address / E-Mail-Adresse des Autors
  // Optional, unique if provided / Optional, eindeutig wenn angegeben
  email?: string | null;

  // Author's biography / Biografie des Autors
  // Optional, can be long text / Optional, kann langer Text sein
  bio?: string | null;

  // ISO 8601 date string when author was created / ISO 8601 Datumsstring wann Autor erstellt wurde
  created_at: string;

  // ISO 8601 date string when author was last modified / ISO 8601 Datumsstring wann Autor zuletzt geändert wurde
  updated_at: string;
}

// Data needed to create a new author / Daten zum Erstellen eines neuen Autors
// Used in admin panel "Create Author" form / Verwendet im Admin-Panel "Autor erstellen" Formular
export interface CreateAuthorInput {
  // Author's name / Name des Autors
  name: string;

  // Optional email address / Optionale E-Mail-Adresse
  email?: string;

  // Optional biography / Optionale Biografie
  bio?: string;
}

// Data needed to update an existing author / Daten zum Aktualisieren eines vorhandenen Autors
// Used in admin panel "Edit Author" form / Verwendet im Admin-Panel "Autor bearbeiten" Formular
export interface UpdateAuthorInput {
  // Updated author name / Aktualisierter Autorenname
  name: string;

  // Updated email address / Aktualisierte E-Mail-Adresse
  email?: string;

  // Updated biography / Aktualisierte Biografie
  bio?: string;
}
