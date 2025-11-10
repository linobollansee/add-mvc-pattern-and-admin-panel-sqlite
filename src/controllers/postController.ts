// Post Controller - Public Blog Post Handlers / Post-Controller - Öffentliche Blog-Beitrag-Handler
// Handles displaying blog posts to public visitors (the "C" in MVC)
// Behandelt die Anzeige von Blog-Beiträgen für öffentliche Besucher (das "C" in MVC)
// No authentication required - these are public pages
// Keine Authentifizierung erforderlich - dies sind öffentliche Seiten

import { Request, Response } from "express";
import * as postModel from "../models/postModel"; // Import data access functions / Importiere Datenzugriffsfunktionen

// Display list of all blog posts (public view) / Zeige Liste aller Blog-Beiträge an (öffentliche Ansicht)
// Route: GET /posts / Route: GET /posts
// View: views/posts/index.njk / Ansicht: views/posts/index.njk
// Features: Pagination (6 posts per page) / Funktionen: Paginierung (6 Beiträge pro Seite)
export async function index(req: Request, res: Response): Promise<void> {
  try {
    // Get page from URL query parameter ?page=2, default to 1
    // Hole Seite aus URL-Abfrageparameter ?page=2, Standard ist 1
    const page = parseInt(req.query.page as string) || 1;
    const limit = 6; // Posts per page on public blog / Beiträge pro Seite im öffentlichen Blog
    // Fetch all posts from data/posts.json / Hole alle Beiträge aus data/posts.json
    const allPosts = await postModel.getAllPosts();

    // Calculate pagination values / Berechne Paginierungswerte
    const totalPosts = allPosts.length; // Total number of posts / Gesamtzahl der Beiträge
    const totalPages = Math.ceil(totalPosts / limit); // Total pages / Gesamtseiten
    const offset = (page - 1) * limit; // Starting index / Startindex
    const posts = allPosts.slice(offset, offset + limit); // Get posts for current page / Hole Beiträge für aktuelle Seite

    // Render the blog post list view / Rendere die Blog-Beitragsliste-Ansicht
    res.render("posts/index.njk", {
      posts, // Array of Post objects / Array von Post-Objekten
      currentPage: page, // For pagination links / Für Paginierungslinks
      totalPages, // For pagination links / Für Paginierungslinks
      hasPrevious: page > 1, // Show "Previous" button? / "Vorherige" Schaltfläche anzeigen?
      hasNext: page < totalPages, // Show "Next" button? / "Nächste" Schaltfläche anzeigen?
      title: "Blog Posts", // Page title / Seitentitel
    });
  } catch (error) {
    // Error occurred, log and display error page / Fehler aufgetreten, protokolliere und zeige Fehlerseite
    console.error("Error fetching posts:", error);
    res.status(500).render("error.njk", {
      message: "Error loading blog posts", // Error message / Fehlermeldung
      error,
    });
  }
}

// Display a single blog post by its slug / Zeige einen einzelnen Blog-Beitrag anhand seines Slugs an
// Route: GET /posts/:slug / Route: GET /posts/:slug
// View: views/posts/show.njk / Ansicht: views/posts/show.njk
// Example: /posts/my-first-post → finds post with slug "my-first-post"
// Beispiel: /posts/my-first-post → findet Beitrag mit Slug "my-first-post"
export async function show(req: Request, res: Response): Promise<void> {
  try {
    // Find post by slug from URL parameter / Finde Beitrag anhand Slug aus URL-Parameter
    const post = await postModel.getPostBySlug(req.params.slug);

    // Post not found - show 404 error / Beitrag nicht gefunden - zeige 404-Fehler
    if (!post) {
      res.status(404).render("error.njk", {
        message: "Post not found", // Error message / Fehlermeldung
        error: { status: 404 },
      });
      return;
    }

    // Render single post view / Rendere Einzelbeitragsansicht
    res.render("posts/show.njk", {
      post, // Full Post object with content / Vollständiges Post-Objekt mit Inhalt
      title: post.title, // Page title for <title> tag / Seitentitel für <title> Tag
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
