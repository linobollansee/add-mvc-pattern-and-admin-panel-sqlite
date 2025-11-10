// Admin Controller - Admin Panel Handlers / Admin-Controller - Admin-Panel-Handler
// Handles CRUD operations for blog posts in the admin panel (the "C" in MVC)
// Behandelt CRUD-Operationen für Blog-Beiträge im Admin-Panel (das "C" in MVC)
// ALL FUNCTIONS REQUIRE AUTHENTICATION (enforced by adminRoutes.ts)
// ALLE FUNKTIONEN ERFORDERN AUTHENTIFIZIERUNG (erzwungen durch adminRoutes.ts)

import { Request, Response } from "express";
import * as postModel from "../models/postModel"; // Import database functions / Importiere Datenbankfunktionen

// Display admin dashboard with all posts / Zeige Admin-Dashboard mit allen Beiträgen an
// Route: GET /admin/posts / Route: GET /admin/posts
// View: views/admin/posts/index.njk / Ansicht: views/admin/posts/index.njk
// Features: Search functionality, pagination (10 posts per page)
// Funktionen: Suchfunktionalität, Paginierung (10 Beiträge pro Seite)
export async function index(req: Request, res: Response): Promise<void> {
  try {
    // Get search term from URL query parameter / Hole Suchbegriff aus URL-Abfrageparameter
    const searchQuery = (req.query.search as string) || "";
    // Get page number from URL, default to 1 / Hole Seitennummer aus URL, Standard ist 1
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10; // Posts per page in admin (more than public view) / Beiträge pro Seite im Admin (mehr als öffentliche Ansicht)
    let allPosts;

    // If searching, filter posts; otherwise get all
    // Wenn Suche, filtere Beiträge; andernfalls hole alle
    if (searchQuery) {
      // Search in title/excerpt/content / Suche in Titel/Auszug/Inhalt
      allPosts = await postModel.searchPosts(searchQuery);
    } else {
      // Get all posts / Hole alle Beiträge
      allPosts = await postModel.getAllPosts();
    }

    // Calculate pagination values / Berechne Paginierungswerte
    const totalPosts = allPosts.length; // Total number of posts / Gesamtzahl der Beiträge
    const totalPages = Math.ceil(totalPosts / limit); // Total pages / Gesamtseiten
    const offset = (page - 1) * limit; // Starting index / Startindex
    const posts = allPosts.slice(offset, offset + limit); // Get posts for current page / Hole Beiträge für aktuelle Seite

    // Render admin posts list view / Rendere Admin-Beitragsliste-Ansicht
    res.render("admin/posts/index.njk", {
      posts, // Array of Post objects / Array von Post-Objekten
      searchQuery, // To preserve search term in form / Um Suchbegriff im Formular zu erhalten
      currentPage: page, // For pagination links / Für Paginierungslinks
      totalPages, // For pagination links / Für Paginierungslinks
      hasPrevious: page > 1, // Show "Previous" button? / "Vorherige" Schaltfläche anzeigen?
      hasNext: page < totalPages, // Show "Next" button? / "Nächste" Schaltfläche anzeigen?
      title: "Admin - Manage Posts", // Page title / Seitentitel
    });
  } catch (error) {
    // Error occurred, log and display error page / Fehler aufgetreten, protokolliere und zeige Fehlerseite
    console.error("Error fetching posts:", error);
    res.status(500).render("error.njk", {
      message: "Error loading posts", // Error message / Fehlermeldung
      error,
    });
  }
}

// Display form to create a new post / Zeige Formular zum Erstellen eines neuen Beitrags an
// Route: GET /admin/posts/new / Route: GET /admin/posts/new
// View: views/admin/posts/edit.njk (empty form) / Ansicht: views/admin/posts/edit.njk (leeres Formular)
export async function create(_req: Request, res: Response): Promise<void> {
  // Render edit form with no post data (null = new post, not editing existing)
  // Rendere Bearbeitungsformular ohne Beitragsdaten (null = neuer Beitrag, nicht vorhandenen bearbeiten)
  res.render("admin/posts/edit.njk", {
    post: null, // null indicates new post creation / null zeigt neue Beitragserstellung an
    title: "Admin - Create Post", // Page title / Seitentitel
  });
}

// Handle post creation (form submission) / Behandle Beitragserstellung (Formularübermittlung)
// Route: POST /admin/posts / Route: POST /admin/posts
// Receives: Form data (title, excerpt, content, author) / Empfängt: Formulardaten (Titel, Auszug, Inhalt, Autor)
// On success: Redirects to /admin/posts / Bei Erfolg: Leitet zu /admin/posts weiter
// On error: Re-renders form with error message / Bei Fehler: Rendert Formular neu mit Fehlermeldung
export async function store(req: Request, res: Response): Promise<void> {
  try {
    // Extract form fields / Extrahiere Formularfelder
    const { title, excerpt, content, author } = req.body;

    // Validate required fields / Validiere Pflichtfelder
    if (!title || !excerpt || !content) {
      res.status(400).render("admin/posts/edit.njk", {
        post: req.body, // Preserve user's input / Behalte Benutzereingabe
        error: "Title, excerpt, and content are required", // Error message / Fehlermeldung
        title: "Admin - Create Post", // Page title / Seitentitel
      });
      return;
    }

    // Create post in database (posts.json via postModel)
    // Erstelle Beitrag in Datenbank (posts.json über postModel)
    const newPost = await postModel.createPost({
      title,
      excerpt,
      content,
      author,
    });

    if (newPost) {
      // Success - go back to post list / Erfolg - gehe zurück zur Beitragsliste
      res.redirect("/admin/posts");
    } else {
      throw new Error("Failed to create post"); // Creation failed / Erstellung fehlgeschlagen
    }
  } catch (error) {
    // Error occurred, log and re-render form / Fehler aufgetreten, protokolliere und rendere Formular neu
    console.error("Error creating post:", error);
    res.status(500).render("admin/posts/edit.njk", {
      post: req.body, // Preserve user's input / Behalte Benutzereingabe
      error: "Error creating post", // Error message / Fehlermeldung
      title: "Admin - Create Post", // Page title / Seitentitel
    });
  }
}

// Display form to edit an existing post / Zeige Formular zum Bearbeiten eines vorhandenen Beitrags an
// Route: GET /admin/posts/:id/edit / Route: GET /admin/posts/:id/edit
// View: views/admin/posts/edit.njk (populated with post data)
// Ansicht: views/admin/posts/edit.njk (gefüllt mit Beitragsdaten)
export async function edit(req: Request, res: Response): Promise<void> {
  try {
    // Fetch post by ID from URL parameter / Hole Beitrag anhand ID aus URL-Parameter
    const post = await postModel.getPostById(req.params.id);

    // Post not found - show 404 / Beitrag nicht gefunden - zeige 404
    if (!post) {
      res.status(404).render("error.njk", {
        message: "Post not found", // Error message / Fehlermeldung
        error: { status: 404 },
      });
      return;
    }

    // Render edit form with existing post data / Rendere Bearbeitungsformular mit vorhandenen Beitragsdaten
    res.render("admin/posts/edit.njk", {
      post, // Post object to populate form fields / Post-Objekt zum Füllen der Formularfelder
      title: `Admin - Edit Post: ${post.title}`, // Page title / Seitentitel
    });
  } catch (error) {
    // Error occurred, log and display error page / Fehler aufgetreten, protokolliere und zeige Fehlerseite
    console.error("Error fetching post:", error);
    res.status(500).render("error.njk", {
      message: "Error loading post", // Error message / Fehlermeldung
      error,
    });
  }
}

// Handle post update (form submission) / Behandle Beitragsaktualisierung (Formularübermittlung)
// Route: POST /admin/posts/:id / Route: POST /admin/posts/:id
// Receives: Form data (title, excerpt, content, author) / Empfängt: Formulardaten (Titel, Auszug, Inhalt, Autor)
// Updates: Post in posts.json via postModel / Aktualisiert: Beitrag in posts.json über postModel
// On success: Redirects to /admin/posts / Bei Erfolg: Leitet zu /admin/posts weiter
export async function update(req: Request, res: Response): Promise<void> {
  try {
    // Extract form fields / Extrahiere Formularfelder
    const { title, excerpt, content, author } = req.body;

    // Validate required fields / Validiere Pflichtfelder
    if (!title || !excerpt || !content) {
      res.status(400).render("admin/posts/edit.njk", {
        post: { ...req.body, id: req.params.id }, // Preserve user's input with ID / Behalte Benutzereingabe mit ID
        error: "Title, excerpt, and content are required", // Error message / Fehlermeldung
        title: "Admin - Edit Post", // Page title / Seitentitel
      });
      return;
    }

    // Update post in database (posts.json via postModel)
    // Aktualisiere Beitrag in Datenbank (posts.json über postModel)
    const updatedPost = await postModel.updatePost(req.params.id, {
      title,
      excerpt,
      content,
      author,
    });

    if (updatedPost) {
      // Success - go back to post list / Erfolg - gehe zurück zur Beitragsliste
      res.redirect("/admin/posts");
    } else {
      throw new Error("Post not found or failed to update"); // Update failed / Aktualisierung fehlgeschlagen
    }
  } catch (error) {
    // Error occurred, log and re-render form / Fehler aufgetreten, protokolliere und rendere Formular neu
    console.error("Error updating post:", error);
    res.status(500).render("admin/posts/edit.njk", {
      post: { ...req.body, id: req.params.id }, // Preserve user's input with ID / Behalte Benutzereingabe mit ID
      error: "Error updating post", // Error message / Fehlermeldung
      title: "Admin - Edit Post", // Page title / Seitentitel
    });
  }
}

// Handle post deletion / Behandle Beitragslöschung
// Route: POST /admin/posts/:id/delete / Route: POST /admin/posts/:id/delete
// Deletes: Post from posts.json via postModel / Löscht: Beitrag aus posts.json über postModel
// On success: Redirects to /admin/posts / Bei Erfolg: Leitet zu /admin/posts weiter
export async function destroy(req: Request, res: Response): Promise<void> {
  try {
    // Delete post from database by ID / Lösche Beitrag aus Datenbank anhand ID
    const success = await postModel.deletePost(req.params.id);

    if (success) {
      // Success - go back to post list / Erfolg - gehe zurück zur Beitragsliste
      res.redirect("/admin/posts");
    } else {
      throw new Error("Post not found or failed to delete"); // Deletion failed / Löschung fehlgeschlagen
    }
  } catch (error) {
    // Error occurred, log and display error page / Fehler aufgetreten, protokolliere und zeige Fehlerseite
    console.error("Error deleting post:", error);
    res.status(500).render("error.njk", {
      message: "Error deleting post", // Error message / Fehlermeldung
      error,
    });
  }
}
