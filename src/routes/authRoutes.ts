// Authentication Routes / Authentifizierungs-Routen
// Handles login and logout functionality
// Behandelt Login- und Logout-Funktionalität

import express from "express";
import * as authController from "../controllers/authController";

// Create Express router instance / Erstelle Express-Router-Instanz
const router = express.Router();

// Login routes - allow users to authenticate / Login-Routen - ermöglichen Benutzern sich zu authentifizieren

// GET /login - Display login form / GET /login - Zeige Login-Formular an
// Handler: authController.showLogin / Handler: authController.showLogin
// View: views/login.njk / Ansicht: views/login.njk
// Accessed by: Unauthenticated users or redirected by auth middleware
// Zugriff durch: Nicht authentifizierte Benutzer oder umgeleitet durch Auth-Middleware
router.get("/login", authController.showLogin);

// POST /login - Process login submission / POST /login - Verarbeite Login-Übermittlung
// Handler: authController.handleLogin / Handler: authController.handleLogin
// Body: { password } / Body: { Passwort }
// Sets session.isAuthenticated on success / Setzt session.isAuthenticated bei Erfolg
// Redirects to: /admin/posts or returnTo URL / Leitet weiter zu: /admin/posts oder returnTo-URL
router.post("/login", authController.handleLogin);

// Logout route - destroy session and return to home
// Logout-Route - zerstöre Sitzung und kehre zur Startseite zurück

// GET /logout - Log out current user / GET /logout - Melde aktuellen Benutzer ab
// Handler: authController.handleLogout / Handler: authController.handleLogout
// Destroys session and redirects to / / Zerstört Sitzung und leitet zu / weiter
router.get("/logout", authController.handleLogout);

// Export router to be mounted in app.ts
// Exportiere Router um in app.ts eingehängt zu werden
export default router;
