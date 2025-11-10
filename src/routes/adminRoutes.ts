// Admin Panel Routes / Admin-Panel-Routen
// Defines routes for managing blog posts (CRUD operations)
// Definiert Routen zur Verwaltung von Blog-Beiträgen (CRUD-Operationen)
// ALL ROUTES REQUIRE AUTHENTICATION via requireAuth middleware
// ALLE ROUTEN ERFORDERN AUTHENTIFIZIERUNG über requireAuth-Middleware

import express from "express";
import * as adminController from "../controllers/adminController";
import { requireAuth } from "../middleware/auth";

// Create Express router instance / Erstelle Express-Router-Instanz
const router = express.Router();

// Apply authentication middleware to ALL admin routes
// Wende Authentifizierungs-Middleware auf ALLE Admin-Routen an
// This means every route below requires login
// Dies bedeutet, dass jede Route unten Login erfordert
// User must have session.isAuthenticated = true
// Benutzer muss session.isAuthenticated = true haben
router.use(requireAuth);

// Admin routes for managing posts (Create, Read, Update, Delete)
// Admin-Routen zur Verwaltung von Beiträgen (Erstellen, Lesen, Aktualisieren, Löschen)

// GET /admin/posts - List all posts with search/pagination
// GET /admin/posts - Liste alle Beiträge mit Suche/Paginierung auf
// Handler: adminController.index / Handler: adminController.index
// View: views/admin/posts/index.njk / Ansicht: views/admin/posts/index.njk
// Features: Search, pagination (10 posts per page) / Funktionen: Suche, Paginierung (10 Beiträge pro Seite)
router.get("/posts", adminController.index);

// GET /admin/posts/new - Show form to create new post
// GET /admin/posts/new - Zeige Formular zum Erstellen eines neuen Beitrags
// Handler: adminController.create / Handler: adminController.create
// View: views/admin/posts/edit.njk (empty form) / Ansicht: views/admin/posts/edit.njk (leeres Formular)
router.get("/posts/new", adminController.create);

// POST /admin/posts - Process new post creation
// POST /admin/posts - Verarbeite Erstellung eines neuen Beitrags
// Handler: adminController.store / Handler: adminController.store
// Body: { title, excerpt, content, author } / Body: { Titel, Auszug, Inhalt, Autor }
// Redirects to: /admin/posts on success / Leitet weiter zu: /admin/posts bei Erfolg
router.post("/posts", adminController.store);

// GET /admin/posts/:id/edit - Show form to edit existing post
// GET /admin/posts/:id/edit - Zeige Formular zum Bearbeiten eines vorhandenen Beitrags
// Handler: adminController.edit / Handler: adminController.edit
// View: views/admin/posts/edit.njk (filled with post data)
// Ansicht: views/admin/posts/edit.njk (gefüllt mit Beitragsdaten)
// Parameter: id - Post ID / Parameter: id - Beitrags-ID
router.get("/posts/:id/edit", adminController.edit);

// POST /admin/posts/:id - Process post update
// POST /admin/posts/:id - Verarbeite Beitragsaktualisierung
// Handler: adminController.update / Handler: adminController.update
// Body: { title, excerpt, content, author } / Body: { Titel, Auszug, Inhalt, Autor }
// Parameter: id - Post ID to update / Parameter: id - Zu aktualisierende Beitrags-ID
// Redirects to: /admin/posts on success / Leitet weiter zu: /admin/posts bei Erfolg
router.post("/posts/:id", adminController.update);

// POST /admin/posts/:id/delete - Delete a post
// POST /admin/posts/:id/delete - Lösche einen Beitrag
// Handler: adminController.destroy / Handler: adminController.destroy
// Parameter: id - Post ID to delete / Parameter: id - Zu löschende Beitrags-ID
// Redirects to: /admin/posts on success / Leitet weiter zu: /admin/posts bei Erfolg
router.post("/posts/:id/delete", adminController.destroy);

// Export router to be mounted in app.ts at /admin
// Exportiere Router um in app.ts bei /admin eingehängt zu werden
export default router;
