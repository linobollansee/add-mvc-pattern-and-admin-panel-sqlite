// Authentication Controller - Login/Logout Handlers / Authentifizierungs-Controller - Login/Logout-Handler
// Handles user authentication for admin panel access
// Behandelt Benutzerauthentifizierung für Admin-Panel-Zugriff

import { Request, Response } from "express";

// Show the login form / Zeige das Login-Formular an
// Route: GET /login / Route: GET /login
// View: views/login.njk / Ansicht: views/login.njk
export function showLogin(req: Request, res: Response): void {
  // If user is already logged in, skip login form and go straight to admin
  // Wenn Benutzer bereits angemeldet ist, überspringe Login-Formular und gehe direkt zum Admin-Bereich
  if (req.session && req.session.isAuthenticated) {
    res.redirect("/admin/posts");
    return;
  }

  // Show login form (no error message on first visit)
  // Zeige Login-Formular (keine Fehlermeldung beim ersten Besuch)
  res.render("login.njk", {
    title: "Admin Login", // Page title / Seitentitel
    error: null, // No error initially / Zunächst kein Fehler
  });
}

// Process login form submission / Verarbeite Login-Formular-Übermittlung
// Route: POST /login / Route: POST /login
// Form fields: password / Formularfelder: Passwort
// Checks password against ADMIN_PASSWORD environment variable
// Überprüft Passwort gegen ADMIN_PASSWORD-Umgebungsvariable
export function handleLogin(req: Request, res: Response): void {
  // Extract password from form submission / Extrahiere Passwort aus Formularübermittlung
  const { password } = req.body;

  // Check if password matches the one in .env file
  // Überprüfe, ob Passwort mit dem in der .env-Datei übereinstimmt
  if (password === process.env.ADMIN_PASSWORD) {
    // Login successful - mark session as authenticated
    // Login erfolgreich - markiere Sitzung als authentifiziert
    req.session.isAuthenticated = true;

    // Redirect to where user was trying to go (or default to admin home)
    // Leite zur Ziel-URL weiter zu der Benutzer gehen wollte (oder Standard Admin-Startseite)
    // returnTo is set by middleware/auth.ts when blocking unauthenticated access
    // returnTo wird von middleware/auth.ts gesetzt beim Blockieren nicht authentifizierten Zugriffs
    const returnTo = req.session.returnTo || "/admin/posts";
    delete req.session.returnTo; // Clean up session / Bereinige Sitzung

    res.redirect(returnTo);
    return;
  }

  // Login failed - show form again with error message
  // Login fehlgeschlagen - zeige Formular erneut mit Fehlermeldung
  res.render("login.njk", {
    title: "Admin Login", // Page title / Seitentitel
    error: "Invalid password. Please try again.", // Error message / Fehlermeldung
  });
}

// Log out the current user / Melde den aktuellen Benutzer ab
// Route: GET /logout / Route: GET /logout
// Destroys session and redirects to home page
// Zerstört Sitzung und leitet zur Startseite weiter
export function handleLogout(req: Request, res: Response): void {
  // Destroy the session, removing authentication status
  // Zerstöre die Sitzung und entferne Authentifizierungsstatus
  req.session.destroy((err) => {
    // Log error if session destruction failed / Protokolliere Fehler wenn Sitzungszerstörung fehlschlug
    if (err) {
      console.error("Logout error:", err);
    }
    // Send user back to public homepage / Sende Benutzer zurück zur öffentlichen Startseite
    res.redirect("/");
  });
}
