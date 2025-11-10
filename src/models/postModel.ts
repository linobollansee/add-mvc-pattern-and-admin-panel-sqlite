// Post Model - Data Access Layer / Post-Modell - Datenzugriffsschicht
// Handles all CRUD operations for blog posts with JSON file storage
// Behandelt alle CRUD-Operationen für Blog-Beiträge mit JSON-Dateispeicherung
// This is the ONLY file that directly reads/writes to posts.json
// Dies ist die EINZIGE Datei, die direkt posts.json liest/schreibt

import fs from "fs/promises";
import path from "path";
import sanitizeHtml from "sanitize-html"; // Prevents XSS attacks / Verhindert XSS-Angriffe
import type {
  Post,
  PostData,
  CreatePostInput,
  UpdatePostInput,
} from "../types/Post";

// Path to JSON database file / Pfad zur JSON-Datenbankdatei
// Located in: src/data/posts.json / Befindet sich in: src/data/posts.json
const DATA_FILE = path.join(__dirname, "../data/posts.json");

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

// PRIVATE HELPER: Read posts from JSON file / PRIVATER HELFER: Lese Beiträge aus JSON-Datei
// Called by: All public functions in this file / Aufgerufen von: Allen öffentlichen Funktionen in dieser Datei
// Returns: PostData object with posts array and nextId / Gibt zurück: PostData-Objekt mit Posts-Array und nextId
async function readData(): Promise<PostData> {
  try {
    // Read file contents as UTF-8 string / Lese Dateiinhalt als UTF-8-String
    const data = await fs.readFile(DATA_FILE, "utf-8");
    // Parse JSON string into PostData object / Parse JSON-String in PostData-Objekt
    return JSON.parse(data) as PostData;
  } catch (error) {
    // If file doesn't exist or is invalid, log error and return empty data
    // Wenn Datei nicht existiert oder ungültig ist, protokolliere Fehler und gebe leere Daten zurück
    console.error("Error reading posts data:", error);
    return { posts: [], nextId: 1 }; // Empty database with first ID / Leere Datenbank mit erster ID
  }
}

// PRIVATE HELPER: Write posts to JSON file / PRIVATER HELFER: Schreibe Beiträge in JSON-Datei
// Called by: createPost(), updatePost(), deletePost() / Aufgerufen von: createPost(), updatePost(), deletePost()
// Writes: Entire PostData object back to posts.json / Schreibt: Gesamtes PostData-Objekt zurück in posts.json
async function writeData(data: PostData): Promise<boolean> {
  try {
    // Convert PostData to formatted JSON string (2-space indentation for readability)
    // Konvertiere PostData in formatierten JSON-String (2-Leerzeichen-Einrückung für Lesbarkeit)
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true; // Write successful / Schreiben erfolgreich
  } catch (error) {
    // Write failed, log error / Schreiben fehlgeschlagen, protokolliere Fehler
    console.error("Error writing posts data:", error);
    return false;
  }
}

// PUBLIC API: Get all posts, sorted by creation date (newest first)
// ÖFFENTLICHE API: Hole alle Beiträge, sortiert nach Erstellungsdatum (neueste zuerst)
// Called by: postController.index(), adminController.index() / Aufgerufen von: postController.index(), adminController.index()
// Used for: Displaying post lists in both public and admin views
// Verwendet für: Anzeigen von Beitragslisten in öffentlichen und Admin-Ansichten
export async function getAllPosts(): Promise<Post[]> {
  // Load all posts from JSON file / Lade alle Beiträge aus JSON-Datei
  const data = await readData();
  // Sort posts by createdAt timestamp, newest first / Sortiere Beiträge nach createdAt-Zeitstempel, neueste zuerst
  return data.posts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// PUBLIC API: Get a single post by numeric ID / ÖFFENTLICHE API: Hole einen einzelnen Beitrag anhand numerischer ID
// Called by: adminController.edit(), adminController.update(), adminController.destroy()
// Aufgerufen von: adminController.edit(), adminController.update(), adminController.destroy()
// Used for: Admin operations (edit/update/delete) / Verwendet für: Admin-Operationen (bearbeiten/aktualisieren/löschen)
export async function getPostById(
  id: number | string // Can be number or string (will be parsed) / Kann Zahl oder String sein (wird geparst)
): Promise<Post | undefined> {
  // Load all posts / Lade alle Beiträge
  const data = await readData();
  // Find and return post with matching ID / Finde und gebe Beitrag mit übereinstimmender ID zurück
  // Convert id to number for comparison / Konvertiere ID zu Zahl für Vergleich
  return data.posts.find((post) => post.id === parseInt(id.toString()));
}

// PUBLIC API: Get a single post by URL slug / ÖFFENTLICHE API: Hole einen einzelnen Beitrag anhand URL-Slug
// Called by: postController.show() / Aufgerufen von: postController.show()
// Used for: Displaying individual posts on public site
// Verwendet für: Anzeigen einzelner Beiträge auf öffentlicher Seite
// Example: slug "my-first-post" → finds post with that slug
// Beispiel: Slug "my-first-post" → findet Beitrag mit diesem Slug
export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  // Load all posts / Lade alle Beiträge
  const data = await readData();
  // Find post by matching slug / Finde Beitrag durch übereinstimmenden Slug
  return data.posts.find((post) => post.slug === slug);
}

// PUBLIC API: Create a new blog post / ÖFFENTLICHE API: Erstelle einen neuen Blog-Beitrag
// Called by: adminController.store() / Aufgerufen von: adminController.store()
// PROCESS / PROZESS:
// 1. Read current posts from posts.json / Lese aktuelle Beiträge aus posts.json
// 2. Generate new post with auto-incremented ID / Generiere neuen Beitrag mit auto-inkrementierter ID
// 3. Create URL slug from title / Erstelle URL-Slug aus Titel
// 4. Sanitize HTML content (prevent XSS) / Bereinige HTML-Inhalt (verhindere XSS)
// 5. Add timestamps / Füge Zeitstempel hinzu
// 6. Write back to posts.json / Schreibe zurück in posts.json
export async function createPost(
  postData: CreatePostInput // Title, excerpt, content, and optional author / Titel, Auszug, Inhalt und optionaler Autor
): Promise<Post | null> {
  // Load existing posts / Lade vorhandene Beiträge
  const data = await readData();

  // Build new post object with generated fields / Baue neues Beitragsobjekt mit generierten Feldern
  const newPost: Post = {
    id: data.nextId, // Auto-increment ID / Auto-inkrementiere ID
    title: postData.title, // Post title / Beitragstitel
    slug: createSlug(postData.title), // Generate URL slug from title / Generiere URL-Slug aus Titel
    excerpt: postData.excerpt, // Short summary / Kurze Zusammenfassung
    content: sanitizeHtml(postData.content, sanitizeOptions), // Clean HTML to prevent XSS / Bereinige HTML um XSS zu verhindern
    author: postData.author || "Anonymous", // Default author if not provided / Standard-Autor wenn nicht angegeben
    createdAt: new Date().toISOString(), // Current timestamp / Aktueller Zeitstempel
    updatedAt: new Date().toISOString(), // Initially same as createdAt / Zunächst gleich wie createdAt
  };

  // Add new post to posts array / Füge neuen Beitrag zum Posts-Array hinzu
  data.posts.push(newPost);
  // Increment ID for next post / Inkrementiere ID für nächsten Beitrag
  data.nextId += 1;

  // Save to posts.json / Speichere in posts.json
  const success = await writeData(data);
  // Return new post on success, null on failure / Gebe neuen Beitrag bei Erfolg zurück, null bei Fehler
  return success ? newPost : null;
}

// PUBLIC API: Update an existing blog post / ÖFFENTLICHE API: Aktualisiere einen vorhandenen Blog-Beitrag
// Called by: adminController.update() / Aufgerufen von: adminController.update()
// PROCESS / PROZESS:
// 1. Find post by ID / Finde Beitrag anhand ID
// 2. Update fields (preserve createdAt, update updatedAt) / Aktualisiere Felder (behalte createdAt, aktualisiere updatedAt)
// 3. Regenerate slug from new title / Regeneriere Slug aus neuem Titel
// 4. Sanitize HTML content / Bereinige HTML-Inhalt
// 5. Write back to posts.json / Schreibe zurück in posts.json
export async function updatePost(
  id: number | string, // Post ID to update / Zu aktualisierende Beitrags-ID
  postData: UpdatePostInput // New title, excerpt, content, author / Neuer Titel, Auszug, Inhalt, Autor
): Promise<Post | null> {
  // Load all posts / Lade alle Beiträge
  const data = await readData();
  // Find index of post to update / Finde Index des zu aktualisierenden Beitrags
  const index = data.posts.findIndex(
    (post) => post.id === parseInt(id.toString())
  );

  // Post not found / Beitrag nicht gefunden
  if (index === -1) {
    return null;
  }

  // Update post while preserving original createdAt
  // Aktualisiere Beitrag während ursprüngliches createdAt beibehalten wird
  data.posts[index] = {
    ...data.posts[index], // Keep existing fields (id, createdAt) / Behalte vorhandene Felder (id, createdAt)
    title: postData.title, // Update title / Aktualisiere Titel
    slug: createSlug(postData.title), // Regenerate slug from new title / Regeneriere Slug aus neuem Titel
    excerpt: postData.excerpt, // Update excerpt / Aktualisiere Auszug
    content: sanitizeHtml(postData.content, sanitizeOptions), // Clean HTML / Bereinige HTML
    author: postData.author, // Update author / Aktualisiere Autor
    updatedAt: new Date().toISOString(), // New update timestamp / Neuer Aktualisierungszeitstempel
  };

  // Save changes / Speichere Änderungen
  const success = await writeData(data);
  // Return updated post on success, null on failure / Gebe aktualisierten Beitrag bei Erfolg zurück, null bei Fehler
  return success ? data.posts[index] : null;
}

// PUBLIC API: Delete a blog post / ÖFFENTLICHE API: Lösche einen Blog-Beitrag
// Called by: adminController.destroy() / Aufgerufen von: adminController.destroy()
export async function deletePost(
  id: number | string // Post ID to delete / Zu löschende Beitrags-ID
): Promise<boolean> {
  // Load all posts / Lade alle Beiträge
  const data = await readData();
  // Find index of post to delete / Finde Index des zu löschenden Beitrags
  const index = data.posts.findIndex(
    (post) => post.id === parseInt(id.toString())
  );

  // Post not found / Beitrag nicht gefunden
  if (index === -1) {
    return false;
  }

  // Remove post from array / Entferne Beitrag aus Array
  data.posts.splice(index, 1);
  // Save modified data / Speichere geänderte Daten
  return await writeData(data);
}

// PUBLIC API: Search posts by keyword / ÖFFENTLICHE API: Suche Beiträge nach Schlüsselwort
// Called by: adminController.index() (when search query provided)
// Aufgerufen von: adminController.index() (wenn Suchanfrage bereitgestellt wird)
// Searches in: title, excerpt, and content fields / Sucht in: Titel, Auszug und Inhaltsfeldern
export async function searchPosts(
  query: string // Search term (case-insensitive) / Suchbegriff (Groß-/Kleinschreibung unabhängig)
): Promise<Post[]> {
  // Load all posts / Lade alle Beiträge
  const data = await readData();
  // Convert search query to lowercase for case-insensitive search
  // Konvertiere Suchanfrage zu Kleinbuchstaben für Groß-/Kleinschreibung-unabhängige Suche
  const lowerQuery = query.toLowerCase();

  // Filter posts that match search query and sort by date
  // Filtere Beiträge die Suchanfrage entsprechen und sortiere nach Datum
  return data.posts
    .filter(
      (post) =>
        // Search in title / Suche in Titel
        post.title.toLowerCase().includes(lowerQuery) ||
        // Search in excerpt / Suche in Auszug
        post.excerpt.toLowerCase().includes(lowerQuery) ||
        // Search in content / Suche in Inhalt
        post.content.toLowerCase().includes(lowerQuery)
    )
    .sort(
      // Sort by creation date, newest first / Sortiere nach Erstellungsdatum, neueste zuerst
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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
