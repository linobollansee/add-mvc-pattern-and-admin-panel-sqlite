// Author Routes - Admin Author Management / Autoren-Routen - Admin-Autoren-Verwaltung
// Defines all routes for CRUD operations on authors
// Definiert alle Routen für CRUD-Operationen auf Autoren
// ALL ROUTES REQUIRE AUTHENTICATION (enforced by middleware)
// ALLE ROUTEN ERFORDERN AUTHENTIFIZIERUNG (erzwungen durch Middleware)

import { Router } from "express";
import * as authorController from "../controllers/authorController";
import { requireAuth } from "../middleware/auth"; // Authentication middleware / Authentifizierungs-Middleware

const router = Router();

// Apply authentication middleware to all routes / Wende Authentifizierungs-Middleware auf alle Routen an
router.use(requireAuth);

// LIST: Display all authors / LISTE: Zeige alle Autoren an
// GET /admin/authors → authorController.index()
router.get("/authors", authorController.index);

// CREATE FORM: Show form to create new author / ERSTELLUNGSFORMULAR: Zeige Formular zum Erstellen eines neuen Autors
// GET /admin/authors/new → authorController.create()
router.get("/authors/new", authorController.create);

// CREATE: Handle author creation form submission / ERSTELLEN: Behandle Autorenerstellungsformularübermittlung
// POST /admin/authors → authorController.store()
router.post("/authors", authorController.store);

// EDIT FORM: Show form to edit existing author / BEARBEITUNGSFORMULAR: Zeige Formular zum Bearbeiten eines vorhandenen Autors
// GET /admin/authors/:id/edit → authorController.edit()
router.get("/authors/:id/edit", authorController.edit);

// UPDATE: Handle author update form submission / AKTUALISIEREN: Behandle Autorenaktualisierungsformularübermittlung
// POST /admin/authors/:id → authorController.update()
router.post("/authors/:id", authorController.update);

// DELETE: Handle author deletion / LÖSCHEN: Behandle Autorenlöschung
// POST /admin/authors/:id/delete → authorController.destroy()
router.post("/authors/:id/delete", authorController.destroy);

export default router;
