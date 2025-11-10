// Session Data Type Extensions / Sitzungsdaten-Typerweiterungen
// Extends express-session to add custom properties for authentication
// Erweitert express-session um benutzerdefinierte Eigenschaften für die Authentifizierung

import "express-session";

// Extend the express-session module with our custom session properties
// Erweitere das express-session Modul mit unseren benutzerdefinierten Sitzungseigenschaften
declare module "express-session" {
  interface SessionData {
    // Set to true when user logs in successfully / Auf true gesetzt, wenn Benutzer sich erfolgreich anmeldet
    // Set by: authController.ts login() / Gesetzt von: authController.ts login()
    // Checked by: middleware/auth.ts / Überprüft von: middleware/auth.ts
    isAuthenticated?: boolean;

    // URL to redirect to after login / URL zur Weiterleitung nach dem Login
    // Set by: middleware/auth.ts when user tries to access protected route
    // Gesetzt von: middleware/auth.ts wenn Benutzer versucht auf geschützte Route zuzugreifen
    returnTo?: string;

    // Reserved for future multi-user support / Reserviert für zukünftige Mehrbenutzer-Unterstützung
    // Not currently used in the application / Wird derzeit nicht in der Anwendung verwendet
    username?: string;
  }
}
