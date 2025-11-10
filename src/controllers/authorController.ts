// Author Controller - Admin Author Handlers / Autoren-Controller - Admin-Autoren-Handler
// Handles CRUD operations for authors in the admin panel
// Behandelt CRUD-Operationen für Autoren im Admin-Panel
// ALL FUNCTIONS REQUIRE AUTHENTICATION (enforced by authorRoutes.ts)
// ALLE FUNKTIONEN ERFORDERN AUTHENTIFIZIERUNG (erzwungen durch authorRoutes.ts)

import { Request, Response } from "express";
import * as authorModel from "../models/authorModel"; // Import database functions / Importiere Datenbankfunktionen

// Display admin dashboard with all authors / Zeige Admin-Dashboard mit allen Autoren an
// Route: GET /admin/authors / Route: GET /admin/authors
// View: views/admin/authors/index.njk / Ansicht: views/admin/authors/index.njk
export async function index(req: Request, res: Response): Promise<void> {
  try {
    // Get search term from URL query parameter / Hole Suchbegriff aus URL-Abfrageparameter
    const searchQuery = (req.query.search as string) || "";
    let authors;

    // If searching, filter authors; otherwise get all with post count
    // Wenn Suche, filtere Autoren; andernfalls hole alle mit Beitragszahl
    if (searchQuery) {
      authors = authorModel.searchAuthors(searchQuery);
    } else {
      authors = authorModel.getAuthorsWithPostCount();
    }

    // Render admin authors list view / Rendere Admin-Autorenliste-Ansicht
    res.render("admin/authors/index.njk", {
      authors,
      searchQuery, // To preserve search term in form / Um Suchbegriff im Formular zu erhalten
      title: "Admin - Manage Authors", // Page title / Seitentitel
    });
  } catch (error) {
    // Error occurred, log and display error page / Fehler aufgetreten, protokolliere und zeige Fehlerseite
    console.error("Error fetching authors:", error);
    res.status(500).render("error.njk", {
      message: "Error loading authors", // Error message / Fehlermeldung
      error,
    });
  }
}

// Display form to create a new author / Zeige Formular zum Erstellen eines neuen Autors an
// Route: GET /admin/authors/new / Route: GET /admin/authors/new
// View: views/admin/authors/edit.njk (empty form) / Ansicht: views/admin/authors/edit.njk (leeres Formular)
export async function create(_req: Request, res: Response): Promise<void> {
  // Render edit form with no author data (null = new author, not editing existing)
  // Rendere Bearbeitungsformular ohne Autorendaten (null = neuer Autor, nicht vorhandenen bearbeiten)
  res.render("admin/authors/edit.njk", {
    author: null, // null indicates new author creation / null zeigt neue Autorenerstellung an
    title: "Admin - Create Author", // Page title / Seitentitel
  });
}

// Handle author creation (form submission) / Behandle Autorenerstellung (Formularübermittlung)
// Route: POST /admin/authors / Route: POST /admin/authors
// Receives: Form data (name, email, bio) / Empfängt: Formulardaten (Name, E-Mail, Bio)
// On success: Redirects to /admin/authors / Bei Erfolg: Leitet zu /admin/authors weiter
// On error: Re-renders form with error message / Bei Fehler: Rendert Formular neu mit Fehlermeldung
export async function store(req: Request, res: Response): Promise<void> {
  try {
    // Extract form fields / Extrahiere Formularfelder
    const { name, email, bio } = req.body;

    // Validate required fields / Validiere Pflichtfelder
    if (!name) {
      res.status(400).render("admin/authors/edit.njk", {
        author: req.body, // Preserve user's input / Behalte Benutzereingabe
        error: "Name is required", // Error message / Fehlermeldung
        title: "Admin - Create Author", // Page title / Seitentitel
      });
      return;
    }

    // Create author in database (SQLite via authorModel)
    // Erstelle Autor in Datenbank (SQLite über authorModel)
    const newAuthor = authorModel.createAuthor({
      name,
      email,
      bio,
    });

    if (newAuthor) {
      // Success - go back to author list / Erfolg - gehe zurück zur Autorenliste
      res.redirect("/admin/authors");
    } else {
      throw new Error("Failed to create author"); // Creation failed / Erstellung fehlgeschlagen
    }
  } catch (error) {
    // Error occurred, log and re-render form / Fehler aufgetreten, protokolliere und rendere Formular neu
    console.error("Error creating author:", error);
    res.status(500).render("admin/authors/edit.njk", {
      author: req.body, // Preserve user's input / Behalte Benutzereingabe
      error: "Error creating author (email might already exist)", // Error message / Fehlermeldung
      title: "Admin - Create Author", // Page title / Seitentitel
    });
  }
}

// Display form to edit an existing author / Zeige Formular zum Bearbeiten eines vorhandenen Autors an
// Route: GET /admin/authors/:id/edit / Route: GET /admin/authors/:id/edit
// View: views/admin/authors/edit.njk (populated with author data)
// Ansicht: views/admin/authors/edit.njk (gefüllt mit Autorendaten)
export async function edit(req: Request, res: Response): Promise<void> {
  try {
    // Fetch author by ID from URL parameter / Hole Autor anhand ID aus URL-Parameter
    const author = authorModel.getAuthorById(req.params.id);

    // Author not found - show 404 / Autor nicht gefunden - zeige 404
    if (!author) {
      res.status(404).render("error.njk", {
        message: "Author not found", // Error message / Fehlermeldung
        error: { status: 404 },
      });
      return;
    }

    // Render edit form with existing author data / Rendere Bearbeitungsformular mit vorhandenen Autorendaten
    res.render("admin/authors/edit.njk", {
      author, // Author object to populate form fields / Autoren-Objekt zum Füllen der Formularfelder
      title: `Admin - Edit Author: ${author.name}`, // Page title / Seitentitel
    });
  } catch (error) {
    // Error occurred, log and display error page / Fehler aufgetreten, protokolliere und zeige Fehlerseite
    console.error("Error fetching author:", error);
    res.status(500).render("error.njk", {
      message: "Error loading author", // Error message / Fehlermeldung
      error,
    });
  }
}

// Handle author update (form submission) / Behandle Autorenaktualisierung (Formularübermittlung)
// Route: POST /admin/authors/:id / Route: POST /admin/authors/:id
// Receives: Form data (name, email, bio) / Empfängt: Formulardaten (Name, E-Mail, Bio)
// On success: Redirects to /admin/authors / Bei Erfolg: Leitet zu /admin/authors weiter
export async function update(req: Request, res: Response): Promise<void> {
  try {
    // Extract form fields / Extrahiere Formularfelder
    const { name, email, bio } = req.body;

    // Validate required fields / Validiere Pflichtfelder
    if (!name) {
      res.status(400).render("admin/authors/edit.njk", {
        author: { ...req.body, id: req.params.id }, // Preserve user's input with ID / Behalte Benutzereingabe mit ID
        error: "Name is required", // Error message / Fehlermeldung
        title: "Admin - Edit Author", // Page title / Seitentitel
      });
      return;
    }

    // Update author in database (SQLite via authorModel)
    // Aktualisiere Autor in Datenbank (SQLite über authorModel)
    const updatedAuthor = authorModel.updateAuthor(req.params.id, {
      name,
      email,
      bio,
    });

    if (updatedAuthor) {
      // Success - go back to author list / Erfolg - gehe zurück zur Autorenliste
      res.redirect("/admin/authors");
    } else {
      throw new Error("Author not found or failed to update"); // Update failed / Aktualisierung fehlgeschlagen
    }
  } catch (error) {
    // Error occurred, log and re-render form / Fehler aufgetreten, protokolliere und rendere Formular neu
    console.error("Error updating author:", error);
    res.status(500).render("admin/authors/edit.njk", {
      author: { ...req.body, id: req.params.id }, // Preserve user's input with ID / Behalte Benutzereingabe mit ID
      error: "Error updating author (email might already be used)", // Error message / Fehlermeldung
      title: "Admin - Edit Author", // Page title / Seitentitel
    });
  }
}

// Handle author deletion / Behandle Autorenlöschung
// Route: POST /admin/authors/:id/delete / Route: POST /admin/authors/:id/delete
// Deletes: Author from database / Löscht: Autor aus Datenbank
// Note: Posts with this author will have author_id set to NULL
// Hinweis: Beiträge mit diesem Autor werden author_id auf NULL gesetzt
// On success: Redirects to /admin/authors / Bei Erfolg: Leitet zu /admin/authors weiter
export async function destroy(req: Request, res: Response): Promise<void> {
  try {
    // Delete author from database by ID / Lösche Autor aus Datenbank anhand ID
    const success = authorModel.deleteAuthor(req.params.id);

    if (success) {
      // Success - go back to author list / Erfolg - gehe zurück zur Autorenliste
      res.redirect("/admin/authors");
    } else {
      throw new Error("Author not found or failed to delete"); // Deletion failed / Löschung fehlgeschlagen
    }
  } catch (error) {
    // Error occurred, log and display error page / Fehler aufgetreten, protokolliere und zeige Fehlerseite
    console.error("Error deleting author:", error);
    res.status(500).render("error.njk", {
      message: "Error deleting author", // Error message / Fehlermeldung
      error,
    });
  }
}
