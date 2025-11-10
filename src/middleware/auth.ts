// Authentication Middleware / Authentifizierungs-Middleware
// Protects admin routes from unauthorized access
// Schützt Admin-Routen vor unbefugtem Zugriff

import { Request, Response, NextFunction } from "express";

// Middleware function to check if user is authenticated
// Middleware-Funktion zur Überprüfung, ob Benutzer authentifiziert ist
// Used by: routes/adminRoutes.ts on all /admin/* routes
// Verwendet von: routes/adminRoutes.ts auf allen /admin/* Routen
export function requireAuth(
  req: Request, // Incoming HTTP request / Eingehende HTTP-Anfrage
  res: Response, // HTTP response object / HTTP-Antwort-Objekt
  next: NextFunction // Function to call next middleware / Funktion zum Aufrufen der nächsten Middleware
): void {
  // Check if user has valid session with isAuthenticated flag set to true
  // Überprüfe, ob Benutzer eine gültige Sitzung mit isAuthenticated-Flag auf true hat
  if (req.session && req.session.isAuthenticated) {
    // User is authenticated, proceed to next middleware or route handler
    // Benutzer ist authentifiziert, fahre mit nächster Middleware oder Route-Handler fort
    return next();
  }

  // User is not authenticated, save the requested URL for redirect after login
  // Benutzer ist nicht authentifiziert, speichere die angeforderte URL für Umleitung nach Login
  // This allows returning to the originally requested page after successful login
  // Dies ermöglicht die Rückkehr zur ursprünglich angeforderten Seite nach erfolgreichem Login
  req.session.returnTo = req.originalUrl;

  // Redirect unauthenticated user to login page
  // Leite nicht authentifizierten Benutzer zur Login-Seite weiter
  res.redirect("/login");
}
