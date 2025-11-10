// Public Post Routes / Öffentliche Beitrags-Routen
// Defines routes for viewing blog posts (public access, no auth required)
// Definiert Routen zum Anzeigen von Blog-Beiträgen (öffentlicher Zugriff, keine Authentifizierung erforderlich)

import express from "express";
import * as postController from "../controllers/postController";

// Create Express router instance / Erstelle Express-Router-Instanz
const router = express.Router();

// Public routes for viewing blog posts (no authentication required)
// Öffentliche Routen zum Anzeigen von Blog-Beiträgen (keine Authentifizierung erforderlich)

// GET /posts - Blog homepage with post list / GET /posts - Blog-Startseite mit Beitragsliste
// Handler: postController.index / Handler: postController.index
// View: views/posts/index.njk / Ansicht: views/posts/index.njk
// Features: Pagination, shows 6 posts per page / Funktionen: Paginierung, zeigt 6 Beiträge pro Seite
router.get("/", postController.index);

// GET /posts/:slug - Individual post page / GET /posts/:slug - Einzelne Beitragsseite
// Handler: postController.show / Handler: postController.show
// View: views/posts/show.njk / Ansicht: views/posts/show.njk
// Parameter: slug - URL-friendly version of post title / Parameter: slug - URL-freundliche Version des Beitragstitels
// Example: /posts/my-first-post / Beispiel: /posts/my-first-post
router.get("/:slug", postController.show);

// Export router to be mounted in app.ts at /posts
// Exportiere Router um in app.ts bei /posts eingehängt zu werden
export default router;
