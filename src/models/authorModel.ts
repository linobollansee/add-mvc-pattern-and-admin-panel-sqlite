// Author Model - Data Access Layer / Autoren-Modell - Datenzugriffsschicht
// Handles all CRUD operations for authors with SQLite database
// Behandelt alle CRUD-Operationen für Autoren mit SQLite-Datenbank

import db from "../config/database";
import type {
  Author,
  CreateAuthorInput,
  UpdateAuthorInput,
} from "../types/Author";

// PUBLIC API: Get all authors, sorted by name / ÖFFENTLICHE API: Hole alle Autoren, sortiert nach Name
// Called by: adminController for author list and post forms / Aufgerufen von: adminController für Autorenliste und Beitragsformulare
export function getAllAuthors(): Author[] {
  const stmt = db.prepare(`
    SELECT id, name, email, bio, created_at, updated_at
    FROM authors
    ORDER BY name ASC
  `);

  return stmt.all() as Author[];
}

// PUBLIC API: Get a single author by ID / ÖFFENTLICHE API: Hole einen einzelnen Autor anhand ID
// Called by: authorController.edit(), authorController.update(), authorController.destroy()
// Aufgerufen von: authorController.edit(), authorController.update(), authorController.destroy()
export function getAuthorById(id: number | string): Author | undefined {
  const stmt = db.prepare(`
    SELECT id, name, email, bio, created_at, updated_at
    FROM authors
    WHERE id = ?
  `);

  return stmt.get(parseInt(id.toString())) as Author | undefined;
}

// PUBLIC API: Create a new author / ÖFFENTLICHE API: Erstelle einen neuen Autor
// Called by: authorController.store() / Aufgerufen von: authorController.store()
export function createAuthor(authorData: CreateAuthorInput): Author | null {
  try {
    const stmt = db.prepare(`
      INSERT INTO authors (name, email, bio)
      VALUES (?, ?, ?)
    `);

    const info = stmt.run(
      authorData.name,
      authorData.email || null,
      authorData.bio || null
    );

    // Return the newly created author / Gebe den neu erstellten Autor zurück
    return getAuthorById(info.lastInsertRowid as number) || null;
  } catch (error) {
    console.error("Error creating author:", error);
    return null;
  }
}

// PUBLIC API: Update an existing author / ÖFFENTLICHE API: Aktualisiere einen vorhandenen Autor
// Called by: authorController.update() / Aufgerufen von: authorController.update()
export function updateAuthor(
  id: number | string,
  authorData: UpdateAuthorInput
): Author | null {
  try {
    const stmt = db.prepare(`
      UPDATE authors
      SET name = ?,
          email = ?,
          bio = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `);

    const info = stmt.run(
      authorData.name,
      authorData.email || null,
      authorData.bio || null,
      parseInt(id.toString())
    );

    // Return null if no rows were updated / Gebe null zurück wenn keine Zeilen aktualisiert wurden
    if (info.changes === 0) {
      return null;
    }

    // Return the updated author / Gebe den aktualisierten Autor zurück
    return getAuthorById(id) || null;
  } catch (error) {
    console.error("Error updating author:", error);
    return null;
  }
}

// PUBLIC API: Delete an author / ÖFFENTLICHE API: Lösche einen Autor
// Called by: authorController.destroy() / Aufgerufen von: authorController.destroy()
// Note: Posts with this author will have author_id set to NULL (due to ON DELETE SET NULL)
// Hinweis: Beiträge mit diesem Autor werden author_id auf NULL gesetzt (aufgrund von ON DELETE SET NULL)
export function deleteAuthor(id: number | string): boolean {
  try {
    const stmt = db.prepare(`
      DELETE FROM authors
      WHERE id = ?
    `);

    const info = stmt.run(parseInt(id.toString()));

    return info.changes > 0;
  } catch (error) {
    console.error("Error deleting author:", error);
    return false;
  }
}

// PUBLIC API: Search authors by name or email / ÖFFENTLICHE API: Suche Autoren nach Name oder E-Mail
// Called by: authorController.index() (when search query provided)
// Aufgerufen von: authorController.index() (wenn Suchanfrage bereitgestellt wird)
export function searchAuthors(query: string): Author[] {
  const stmt = db.prepare(`
    SELECT id, name, email, bio, created_at, updated_at
    FROM authors
    WHERE name LIKE ? OR email LIKE ?
    ORDER BY name ASC
  `);

  const searchPattern = `%${query}%`;
  return stmt.all(searchPattern, searchPattern) as Author[];
}

// PUBLIC API: Get author with post count / ÖFFENTLICHE API: Hole Autor mit Beitragszahl
// Useful for displaying how many posts each author has written
// Nützlich um anzuzeigen wie viele Beiträge jeder Autor geschrieben hat
export function getAuthorsWithPostCount(): Array<
  Author & { post_count: number }
> {
  const stmt = db.prepare(`
    SELECT 
      a.id,
      a.name,
      a.email,
      a.bio,
      a.created_at,
      a.updated_at,
      COUNT(p.id) as post_count
    FROM authors a
    LEFT JOIN posts p ON a.id = p.author_id
    GROUP BY a.id
    ORDER BY a.name ASC
  `);

  return stmt.all() as Array<Author & { post_count: number }>;
}
