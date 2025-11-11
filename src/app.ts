// Main Application Entry Point / Hauptanwendungs-Einstiegspunkt
// This is the central hub that ties the entire application together
// Dies ist der zentrale Knotenpunkt, der die gesamte Anwendung zusammenbindet

import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import dotenv from "dotenv";
import nunjucks from "nunjucks";
import path from "path";
// Import database and initialize / Importiere Datenbank und initialisiere
import { initializeDatabase } from "./config/database";
// Import route modules - each handles a specific part of the application
// Importiere Routen-Module - jedes behandelt einen spezifischen Teil der Anwendung
import postRoutes from "./routes/postRoutes"; // Public-facing blog post routes / Öffentliche Blog-Beitrags-Routen
import adminRoutes from "./routes/adminRoutes"; // Protected admin panel routes / Geschützte Admin-Panel-Routen
import authorRoutes from "./routes/authorRoutes"; // Protected author management routes / Geschützte Autoren-Verwaltungs-Routen
import authRoutes from "./routes/authRoutes"; // Authentication (login/logout) / Authentifizierung (Login/Logout)
import "./types/Session"; // TypeScript session type extensions / TypeScript-Sitzungstyp-Erweiterungen

// Load environment variables from .env file (SESSION_SECRET, ADMIN_PASSWORD, etc.)
// Lade Umgebungsvariablen aus .env-Datei (SESSION_SECRET, ADMIN_PASSWORD, etc.)
dotenv.config();

// Validate required environment variables / Validiere erforderliche Umgebungsvariablen
if (!process.env.SESSION_SECRET) {
  console.warn(
    "⚠️  WARNING: SESSION_SECRET not set in .env file. Using default (not secure for production)"
  );
}

if (!process.env.ADMIN_PASSWORD) {
  console.error("❌ ERROR: ADMIN_PASSWORD must be set in .env file");
  process.exit(1);
}

// Environment configuration / Umgebungskonfiguration
const isProduction = process.env.NODE_ENV === "production";
const port = parseInt(process.env.PORT || "3000");

// Create Express application instance / Erstelle Express-Anwendungsinstanz
const app = express();

// TEMPLATE ENGINE SETUP / TEMPLATE-ENGINE-EINRICHTUNG
// Configure Nunjucks to render .njk template files / Konfiguriere Nunjucks zum Rendern von .njk-Template-Dateien
// Templates are located in ./views/ directory / Templates befinden sich im ./views/ Verzeichnis
// Connects to: layout.njk, posts/*.njk, admin/*.njk, etc.
// Verbindet zu: layout.njk, posts/*.njk, admin/*.njk, etc.
const env = nunjucks.configure(path.join(__dirname, "views"), {
  autoescape: true, // Prevents XSS attacks by escaping HTML / Verhindert XSS-Angriffe durch HTML-Escaping
  express: app, // Integrate with Express / Integriere mit Express
  watch: !isProduction, // Only watch in development / Nur in Entwicklung beobachten
  noCache: !isProduction, // Disable cache in development / Cache in Entwicklung deaktivieren
});

// CUSTOM NUNJUCKS FILTERS / BENUTZERDEFINIERTE NUNJUCKS-FILTER
// These can be used in .njk templates to format data
// Diese können in .njk-Templates verwendet werden um Daten zu formatieren
// Example in template / Beispiel in Template: {{ post.createdAt | date("long") }}

// Date formatting filter - used in views to display post dates nicely
// Datumsformatierungsfilter - verwendet in Ansichten um Beitragsdaten schön anzuzeigen
env.addFilter("date", function (dateString: string, format: string): string {
  // Convert ISO string to Date object / Konvertiere ISO-String zu Date-Objekt
  const date = new Date(dateString);
  // Configure date format options / Konfiguriere Datumsformatoptionen
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric", // Show year / Zeige Jahr
    month: "long", // Show full month name / Zeige vollständigen Monatsnamen
    day: "numeric", // Show day / Zeige Tag
    hour: format.includes("h") ? "numeric" : undefined, // Show hour if format includes "h" / Zeige Stunde wenn Format "h" enthält
    minute: format.includes("m") ? "numeric" : undefined, // Show minute if format includes "m" / Zeige Minute wenn Format "m" enthält
  };
  // Return formatted date string / Gebe formatierten Datumsstring zurück
  return date.toLocaleDateString("en-US", options);
});

// Text truncation filter - used to show post excerpts
// Text-Kürzungsfilter - verwendet um Beitragsauszüge anzuzeigen
// Example / Beispiel: {{ post.content | truncate(150) }}
env.addFilter("truncate", function (str: string, length: number): string {
  // If string is longer than specified length, truncate and add ellipsis
  // Wenn String länger als angegebene Länge ist, kürze und füge Auslassungspunkte hinzu
  if (str.length > length) {
    return str.substring(0, length) + "...";
  }
  // Otherwise return original string / Andernfalls gebe ursprünglichen String zurück
  return str;
});

// Set Nunjucks as the view engine / Setze Nunjucks als View-Engine
app.set("view engine", "njk");

// SESSION MIDDLEWARE / SITZUNGS-MIDDLEWARE
// Enables authentication by storing login state / Ermöglicht Authentifizierung durch Speichern des Login-Status
// Connects to: ./middleware/auth.ts (checks session.isAuthenticated)
// Verbindet zu: ./middleware/auth.ts (prüft session.isAuthenticated)
// Used by: authController.ts (sets session.isAuthenticated on login)
// Verwendet von: authController.ts (setzt session.isAuthenticated beim Login)
app.use(
  session({
    // Secret key for signing session ID cookie / Geheimer Schlüssel zum Signieren des Sitzungs-ID-Cookies
    // Loaded from .env file or uses default / Geladen aus .env-Datei oder verwendet Standard
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    // Don't save session if unmodified / Sitzung nicht speichern wenn unverändert
    resave: false,
    // Don't create session until something stored / Keine Sitzung erstellen bis etwas gespeichert wird
    saveUninitialized: false,
    // Cookie configuration / Cookie-Konfiguration
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours - user stays logged in for 1 day / 24 Stunden - Benutzer bleibt 1 Tag angemeldet
      httpOnly: true, // Prevents JavaScript access to cookies / Verhindert JavaScript-Zugriff auf Cookies
      secure: isProduction, // Enable secure cookies in production / Sichere Cookies in Produktion aktivieren
      sameSite: "strict", // CSRF protection / CSRF-Schutz
    },
  })
);

// REQUEST PARSING MIDDLEWARE / ANFRAGE-PARSING-MIDDLEWARE
// Middleware to parse incoming request data / Middleware zum Parsen eingehender Anfragedaten

// Parse JSON request bodies / Parse JSON-Anfrage-Bodies
// Enables req.body for JSON data / Aktiviert req.body für JSON-Daten
app.use(express.json());

// Parse URL-encoded form data / Parse URL-kodierte Formulardaten
// Enables req.body for form submissions / Aktiviert req.body für Formularübermittlungen
// extended: true allows nested objects / extended: true erlaubt verschachtelte Objekte
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images) / Statische Dateien bereitstellen (CSS, JS, Bilder)
// Directory: public/ / Verzeichnis: public/
// Accessible at: http://localhost:3000/css/*, /js/*, etc.
// Erreichbar unter: http://localhost:3000/css/*, /js/*, etc.
app.use(express.static(path.join(__dirname, "../public")));

// ROUTE MOUNTING / ROUTEN-EINBINDUNG
// This is where we connect URL patterns to their handlers
// Hier verbinden wir URL-Muster mit ihren Handlern
// ROUTE HIERARCHY / ROUTEN-HIERARCHIE:
// / → redirects to /posts / → leitet weiter zu /posts
// /login, /logout → authRoutes → authController.ts
// /posts → postRoutes → postController.ts → postModel.ts → posts.json
// /admin → adminRoutes → requires authentication → adminController.ts → postModel.ts
//        → erfordert Authentifizierung → adminController.ts → postModel.ts

// Home page redirects to blog posts / Startseite leitet zu Blog-Beiträgen weiter
// GET / → redirect to /posts / GET / → leite weiter zu /posts
app.get("/", (_req: Request, res: Response) => {
  res.redirect("/posts");
});

// Mount route modules at their base paths / Hänge Routen-Module an ihren Basispfaden ein
// Handles /login and /logout / Behandelt /login und /logout
app.use("/", authRoutes);

// Public blog: /posts, /posts/:slug / Öffentlicher Blog: /posts, /posts/:slug
// No authentication required / Keine Authentifizierung erforderlich
app.use("/posts", postRoutes);

// Admin panel: /admin/posts, /admin/posts/:id/edit, etc.
// Admin-Panel: /admin/posts, /admin/posts/:id/edit, etc.
// All routes protected by requireAuth middleware / Alle Routen geschützt durch requireAuth-Middleware
app.use("/admin", adminRoutes);

// Author management: /admin/authors, /admin/authors/:id/edit, etc.
// Autoren-Verwaltung: /admin/authors, /admin/authors/:id/edit, etc.
// All routes protected by requireAuth middleware / Alle Routen geschützt durch requireAuth-Middleware
app.use("/admin", authorRoutes);

// ERROR HANDLERS / FEHLER-HANDLER
// These must come AFTER all routes / Diese müssen NACH allen Routen kommen
// Catches any unhandled routes or errors and displays error.njk template
// Fängt alle unbehandelten Routen oder Fehler ab und zeigt error.njk-Template

// 404 handler - catches any routes not matched above
// 404-Handler - fängt alle oben nicht übereinstimmenden Routen ab
app.use((_req: Request, res: Response) => {
  // Set HTTP status to 404 Not Found / Setze HTTP-Status auf 404 Nicht Gefunden
  res.status(404).render("error.njk", {
    message: "Page not found", // Error message / Fehlermeldung
    error: { status: 404 },
    title: "404 - Not Found", // Page title / Seitentitel
  });
});

// Global error handler - catches any errors thrown in routes/controllers
// Globaler Fehler-Handler - fängt alle in Routen/Controllern geworfenen Fehler ab
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Log error stack trace to console for debugging / Protokolliere Fehler-Stack-Trace zur Konsole zum Debuggen
  console.error(err.stack);
  // Set HTTP status to 500 Internal Server Error / Setze HTTP-Status auf 500 Interner Server-Fehler
  res.status(500).render("error.njk", {
    message: "Something went wrong!", // Error message / Fehlermeldung
    error: err,
    title: "Error", // Page title / Seitentitel
  });
});

// APPLICATION STARTUP / ANWENDUNGSSTART
// Wrap app initialization in async function to handle database initialization
// Wickle App-Initialisierung in async-Funktion ein um Datenbankinitialisierung zu handhaben
async function startServer(): Promise<void> {
  try {
    // Initialize database BEFORE starting server / Initialisiere Datenbank VOR dem Starten des Servers
    await initializeDatabase();
    console.log("✅ Database initialized successfully!");

    // Start the Express server / Starte den Express-Server
    const server = app.listen(port, () => {
      // Log success message with server URL / Protokolliere Erfolgsmeldung mit Server-URL
      console.log(`✅ Server running on http://localhost:${port}`);
      console.log(
        `📝 Environment: ${isProduction ? "production" : "development"}`
      );
    });

    // Graceful shutdown / Sanftes Herunterfahren
    process.on("SIGTERM", () => {
      console.log("SIGTERM signal received: closing HTTP server");
      server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.log("\nSIGINT signal received: closing HTTP server");
      server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1); // Exit if database initialization fails / Beende wenn Datenbankinitialisierung fehlschlägt
  }
}

// Start the application / Starte die Anwendung
startServer();
