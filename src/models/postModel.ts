// Post Model - Data Access Layer / Post-Modell - Datenzugriffsschicht
// Handles all CRUD operations for blog posts with SQLite database
// Behandelt alle CRUD-Operationen für Blog-Beiträge mit SQLite-Datenbank

import db from "../config/database";
import sanitizeHtml from "sanitize-html"; // Prevents XSS attacks / Verhindert XSS-Angriffe
import type { Post, CreatePostInput, UpdatePostInput } from "../types/Post";

// HTML sanitization configuration / HTML-Bereinigungskonfiguration
// Allows safe HTML tags while preventing dangerous script injection
// Erlaubt sichere HTML-Tags während gefährliche Script-Injektionen verhindert werden
// Applied to post content before saving to database
// Wird auf Beitragsinhalte angewendet vor dem Speichern in der Datenbank
const sanitizeOptions: sanitizeHtml.IOptions = {
  // Allowed HTML tags / Erlaubte HTML-Tags
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1", "h2", "img"]),
  // Allowed HTML attributes / Erlaubte HTML-Attribute
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "alt", "title"], // Image attributes / Bild-Attribute
    a: ["href", "target", "rel"], // Link attributes / Link-Attribute
  },
};

// HELPER: Map database row to Post object with proper naming / HELFER: Mappe Datenbankzeile zu Post-Objekt mit richtiger Benennung
function mapRowToPost(row: any): Post {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    author_id: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Include author if joined / Füge Autor hinzu wenn verbunden
    ...(row.author_name && {
      author: {
        id: row.author_id,
        name: row.author_name,
        email: row.author_email,
        bio: row.author_bio,
        created_at: row.author_created_at,
        updated_at: row.author_updated_at,
      },
    }),
  };
}

// PUBLIC API: Get all posts with author info, sorted by creation date (newest first)
// ÖFFENTLICHE API: Hole alle Beiträge mit Autoreninformationen, sortiert nach Erstellungsdatum (neueste zuerst)
// Called by: postController.index(), adminController.index() / Aufgerufen von: postController.index(), adminController.index()
export function getAllPosts(): Post[] {
  const stmt = db.prepare(`
    SELECT 
      p.id, p.title, p.slug, p.excerpt, p.content, p.author_id,
      p.created_at, p.updated_at,
      a.name as author_name, a.email as author_email, 
      a.bio as author_bio, a.created_at as author_created_at,
      a.updated_at as author_updated_at
    FROM posts p
    LEFT JOIN authors a ON p.author_id = a.id
    ORDER BY p.created_at DESC
  `);

  const rows = stmt.all();
  return rows.map(mapRowToPost);
}

// PUBLIC API: Get a single post by numeric ID / ÖFFENTLICHE API: Hole einen einzelnen Beitrag anhand numerischer ID
// Called by: adminController.edit(), adminController.update(), adminController.destroy()
// Aufgerufen von: adminController.edit(), adminController.update(), adminController.destroy()
export function getPostById(id: number | string): Post | undefined {
  const stmt = db.prepare(`
    SELECT 
      p.id, p.title, p.slug, p.excerpt, p.content, p.author_id,
      p.created_at, p.updated_at,
      a.name as author_name, a.email as author_email,
      a.bio as author_bio, a.created_at as author_created_at,
      a.updated_at as author_updated_at
    FROM posts p
    LEFT JOIN authors a ON p.author_id = a.id
    WHERE p.id = ?
  `);

  const row = stmt.get(parseInt(id.toString()));
  return row ? mapRowToPost(row) : undefined;
}

// PUBLIC API: Get a single post by URL slug / ÖFFENTLICHE API: Hole einen einzelnen Beitrag anhand URL-Slug
// Called by: postController.show() / Aufgerufen von: postController.show()
// Used for: Displaying individual posts on public site
// Verwendet für: Anzeigen einzelner Beiträge auf öffentlicher Seite
export function getPostBySlug(slug: string): Post | undefined {
  const stmt = db.prepare(`
    SELECT 
      p.id, p.title, p.slug, p.excerpt, p.content, p.author_id,
      p.created_at, p.updated_at,
      a.name as author_name, a.email as author_email,
      a.bio as author_bio, a.created_at as author_created_at,
      a.updated_at as author_updated_at
    FROM posts p
    LEFT JOIN authors a ON p.author_id = a.id
    WHERE p.slug = ?
  `);

  const row = stmt.get(slug);
  return row ? mapRowToPost(row) : undefined;
}

// PUBLIC API: Create a new blog post / ÖFFENTLICHE API: Erstelle einen neuen Blog-Beitrag
// Called by: adminController.store() / Aufgerufen von: adminController.store()
export function createPost(postData: CreatePostInput): Post | null {
  try {
    const stmt = db.prepare(`
      INSERT INTO posts (title, slug, excerpt, content, author_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    const slug = createSlug(postData.title);
    const sanitizedContent = sanitizeHtml(postData.content, sanitizeOptions);

    const info = stmt.run(
      postData.title,
      slug,
      postData.excerpt,
      sanitizedContent,
      postData.author_id || null
    );

    // Return the newly created post / Gebe den neu erstellten Beitrag zurück
    return getPostById(info.lastInsertRowid as number) || null;
  } catch (error) {
    console.error("Error creating post:", error);
    return null;
  }
}

// PUBLIC API: Update an existing blog post / ÖFFENTLICHE API: Aktualisiere einen vorhandenen Blog-Beitrag
// Called by: adminController.update() / Aufgerufen von: adminController.update()
export function updatePost(
  id: number | string,
  postData: UpdatePostInput
): Post | null {
  try {
    const stmt = db.prepare(`
      UPDATE posts
      SET title = ?,
          slug = ?,
          excerpt = ?,
          content = ?,
          author_id = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `);

    const slug = createSlug(postData.title);
    const sanitizedContent = sanitizeHtml(postData.content, sanitizeOptions);

    const info = stmt.run(
      postData.title,
      slug,
      postData.excerpt,
      sanitizedContent,
      postData.author_id || null,
      parseInt(id.toString())
    );

    // Return null if no rows were updated / Gebe null zurück wenn keine Zeilen aktualisiert wurden
    if (info.changes === 0) {
      return null;
    }

    // Return the updated post / Gebe den aktualisierten Beitrag zurück
    return getPostById(id) || null;
  } catch (error) {
    console.error("Error updating post:", error);
    return null;
  }
}

// PUBLIC API: Delete a blog post / ÖFFENTLICHE API: Lösche einen Blog-Beitrag
// Called by: adminController.destroy() / Aufgerufen von: adminController.destroy()
export function deletePost(id: number | string): boolean {
  try {
    const stmt = db.prepare(`
      DELETE FROM posts
      WHERE id = ?
    `);

    const info = stmt.run(parseInt(id.toString()));

    return info.changes > 0;
  } catch (error) {
    console.error("Error deleting post:", error);
    return false;
  }
}

// PUBLIC API: Search posts by keyword / ÖFFENTLICHE API: Suche Beiträge nach Schlüsselwort
// Called by: adminController.index() (when search query provided)
// Aufgerufen von: adminController.index() (wenn Suchanfrage bereitgestellt wird)
// Searches in: title, excerpt, and content fields / Sucht in: Titel, Auszug und Inhaltsfeldern
export function searchPosts(query: string): Post[] {
  const stmt = db.prepare(`
    SELECT 
      p.id, p.title, p.slug, p.excerpt, p.content, p.author_id,
      p.created_at, p.updated_at,
      a.name as author_name, a.email as author_email,
      a.bio as author_bio, a.created_at as author_created_at,
      a.updated_at as author_updated_at
    FROM posts p
    LEFT JOIN authors a ON p.author_id = a.id
    WHERE p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?
    ORDER BY p.created_at DESC
  `);

  const searchPattern = `%${query}%`;
  const rows = stmt.all(searchPattern, searchPattern, searchPattern);
  return rows.map(mapRowToPost);
}

// PRIVATE HELPER: Create a URL-friendly slug from a title
// PRIVATER HELFER: Erstelle einen URL-freundlichen Slug aus einem Titel
// Called by: createPost(), updatePost() / Aufgerufen von: createPost(), updatePost()
// Example: "My First Post!" → "my-first-post" / Beispiel: "My First Post!" → "my-first-post"
// Process / Prozess:
// 1. Convert to lowercase / Konvertiere zu Kleinbuchstaben
// 2. Remove special characters / Entferne Sonderzeichen
// 3. Replace spaces with hyphens / Ersetze Leerzeichen mit Bindestrichen
// 4. Remove duplicate hyphens / Entferne doppelte Bindestriche
function createSlug(title: string): string {
  return title
    .toLowerCase() // Convert to lowercase / Konvertiere zu Kleinbuchstaben
    .trim() // Remove leading/trailing whitespace / Entferne führende/nachfolgende Leerzeichen
    .replace(/[^\w\s-]/g, "") // Remove special characters / Entferne Sonderzeichen
    .replace(/\s+/g, "-") // Replace spaces with hyphens / Ersetze Leerzeichen mit Bindestrichen
    .replace(/-+/g, "-"); // Remove duplicate hyphens / Entferne doppelte Bindestriche
}
