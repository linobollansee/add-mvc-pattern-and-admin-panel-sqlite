// Environment Variable Type Definitions / Umgebungsvariablen-Typdefinitionen
// Defines TypeScript types for environment variables used throughout the application
// Definiert TypeScript-Typen für Umgebungsvariablen, die in der gesamten Anwendung verwendet werden

// Application-specific environment variables interface
// Anwendungsspezifisches Interface für Umgebungsvariablen
export interface AppProcessEnv {
  // Secret key for encrypting session cookies / Geheimer Schlüssel zum Verschlüsseln von Sitzungs-Cookies
  // Used by: app.ts for session middleware configuration
  // Verwendet von: app.ts für Sitzungs-Middleware-Konfiguration
  SESSION_SECRET?: string;

  // Admin username for authentication / Admin-Benutzername für Authentifizierung
  // Reserved for future multi-user support / Reserviert für zukünftige Mehrbenutzer-Unterstützung
  // Currently not actively used / Derzeit nicht aktiv verwendet
  ADMIN_USERNAME?: string;

  // Admin password for accessing admin panel / Admin-Passwort für Zugriff auf Admin-Panel
  // Checked by: authController.ts during login process
  // Überprüft von: authController.ts während des Login-Prozesses
  ADMIN_PASSWORD?: string;

  // Application environment mode / Anwendungsumgebungsmodus
  // Controls logging, error handling, and security features
  // Steuert Protokollierung, Fehlerbehandlung und Sicherheitsfunktionen
  NODE_ENV?: "development" | "production" | "test";
}

// Extend Node's global ProcessEnv type with our custom interface
// Erweitere Node's globalen ProcessEnv-Typ mit unserem benutzerdefinierten Interface
declare global {
  namespace NodeJS {
    // Merge our AppProcessEnv with the default ProcessEnv
    // Verschmelze unser AppProcessEnv mit dem Standard-ProcessEnv
    interface ProcessEnv extends AppProcessEnv {}
  }
}

// Export empty object to make this a module / Exportiere leeres Objekt, um dies zu einem Modul zu machen
export {};
