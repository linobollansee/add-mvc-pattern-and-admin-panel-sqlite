// Quill Rich Text Editor Initialization / Quill Rich-Text-Editor Initialisierung
// This script initializes the Quill editor for blog post content editing in the admin panel
// Dieses Skript initialisiert den Quill-Editor für das Bearbeiten von Blogbeitrags-Inhalten im Admin-Panel

// Initialize Quill editor / Initialisiere Quill-Editor
// Attached to element with id="editor" / Angehängt an Element mit id="editor"
// Configuration includes toolbar with formatting options / Konfiguration enthält Toolbar mit Formatierungsoptionen
const quill = new Quill("#editor", {
  theme: "snow", // Snow theme provides clean, modern interface / Snow-Theme bietet saubere, moderne Oberfläche
  modules: {
    toolbar: [
      // Header levels 1-3 / Überschrift-Ebenen 1-3
      [{ header: [1, 2, 3, false] }],
      // Text formatting: bold, italic, underline, strikethrough / Textformatierung: fett, kursiv, unterstrichen, durchgestrichen
      ["bold", "italic", "underline", "strike"],
      // Blockquote and code block / Blockzitat und Code-Block
      ["blockquote", "code-block"],
      // Lists: ordered and bullet / Listen: nummeriert und Aufzählungszeichen
      [{ list: "ordered" }, { list: "bullet" }],
      // Indentation controls / Einrückungssteuerung
      [{ indent: "-1" }, { indent: "+1" }],
      // Insert link and image / Link und Bild einfügen
      ["link", "image"],
      // Text and background color / Text- und Hintergrundfarbe
      [{ color: [] }, { background: [] }],
      // Text alignment / Textausrichtung
      [{ align: [] }],
      // Clear formatting / Formatierung löschen
      ["clean"],
    ],
  },
  placeholder: "Write your post content here...", // Placeholder text / Platzhaltertext
});

// Handle form submission / Formularübermittlung handhaben
// Get the post form element / Hole das Post-Formular-Element
const form = document.getElementById("postForm");
form.addEventListener("submit", function (e) {
  // Get HTML content from Quill editor / Hole HTML-Inhalt vom Quill-Editor
  // quill.root.innerHTML contains the formatted HTML / quill.root.innerHTML enthält das formatierte HTML
  const content = quill.root.innerHTML;

  // Set content to hidden input field for form submission / Setze Inhalt in verstecktes Eingabefeld für Formularübermittlung
  // This input is sent to server with POST request / Dieses Eingabefeld wird mit POST-Anfrage an Server gesendet
  document.getElementById("content").value = content;

  // Validate content is not empty / Validiere dass Inhalt nicht leer ist
  // quill.getText() returns plain text without HTML tags / quill.getText() gibt reinen Text ohne HTML-Tags zurück
  if (quill.getText().trim().length === 0) {
    e.preventDefault(); // Prevent form submission / Verhindere Formularübermittlung
    alert("Content cannot be empty"); // Show error message / Zeige Fehlermeldung
    return false;
  }
});
