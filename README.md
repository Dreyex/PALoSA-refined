# PALoSA: Pseudonymisierungs-App für Log-Dateien

PALoSA (Pseudonymisierungs-App für Log-Dateien von Server-Anwendungen) ist eine Full-Stack-Webanwendung, die entwickelt wurde, um sensible Daten in verschiedenen Dateiformaten sicher und konfigurierbar zu pseudonymisieren. Die Anwendung besteht aus einem modernen React-Frontend für die Interaktion mit dem Benutzer und einem robusten Node.js/Express-Backend, das die gesamte Verarbeitungslogik übernimmt.

## ✨ Features

*   **Sicherer Datei-Upload:** Unterstützt das Hochladen von `.log`, `.txt`, `.json` und `.xml` Dateien.
*   **Flexible Konfiguration:** Bietet verschiedene Einstellungsmöglichkeiten, die auf den Dateityp zugeschnitten sind:
    *   **Standard-Pseudonymisierung:** Erkennt und anonymisiert automatisch E-Mail-Adressen und IPv4-Adressen in Log- und Textdateien.
    *   **Benutzerdefinierte Regex-Muster:** Ermöglicht die Definition eigener Suchmuster für alle Dateitypen.
    *   **JSON-Struktur-Pseudonymisierung:** Ermöglicht gezieltes Anonymisieren von Werten bestimmter Felder (`sources`) und das Erstellen neuer, zusammengeführter Felder (`derived`) über eine `config.json`.
*   **Deterministische Pseudonymisierung:** Verwendet CryptoPAn für die konsistente und sichere Anonymisierung von IPv4-Adressen.
*   **Session-basiertes Arbeiten:** Jeder Upload- und Verarbeitungsvorgang wird in einer isolierten Session verwaltet, um Daten sauber zu trennen.
*   **Download als ZIP:** Alle verarbeiteten Dateien werden in einem ZIP-Archiv für den einfachen Download bereitgestellt.
*   **Automatisches Aufräumen:** Ein Cron-Job bereinigt regelmäßig alte Session-Verzeichnisse, um den Server sauber zu halten.

## 🚀 Tech Stack

| Bereich   | Technologien                                                                                              |
| :-------- | :-------------------------------------------------------------------------------------------------------- |
| **Frontend**  | [React](https://reactjs.org/) 19, [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [ogl](https://o-gl.github.io/) (für Hintergrund-Shader) |
| **Backend**   | [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/), [Multer](https://github.com/expressjs/multer) (für Datei-Uploads), [Archiver](https://www.archiverjs.com/) (für ZIP-Archivierung), [express-session](https://github.com/expressjs/session) |
| **Testing**   | [Jest](https://jestjs.io/) für Unit- und Integrationstests.                                                  |
| **Linting**   | [ESLint](https://eslint.org/) für Code-Qualität in Client und Server.                                     |

## 📂 Projektstruktur

Das Projekt ist in zwei Hauptbereiche unterteilt: `client` und `server`.

```
.
├── client/         # React/Vite Frontend
│   ├── public/     # Statische Assets
│   └── src/
│       ├── components/ # Wiederverwendbare React-Komponenten
│       │   └── ui/     # Allgemeine UI-Elemente (Button, Card, etc.)
│       └── utils/      # Hilfsfunktionen für das Frontend
│
├── server/         # Node.js/Express Backend
│   ├── __tests__/  # Jest-Tests für das Backend
│   ├── coverage/   # Test-Coverage-Berichte
│   ├── uploads/    # Temporäres Verzeichnis für hochgeladene Dateien
│   ├── output/     # Verzeichnis für verarbeitete, pseudonymisierte Dateien
│   ├── download/   # Verzeichnis für die erstellten ZIP-Archive
│   └── utils/      # Die Kernlogik der Pseudonymisierung
│
└── package.json    # Skripte zum gleichzeitigen Ausführen von Client & Server
```

## ⚙️ Erste Schritte

Um das Projekt lokal auszuführen, folgen Sie diesen Schritten.

### Voraussetzungen

*   Node.js (Version 18 oder höher empfohlen)
*   npm (wird mit Node.js installiert)

### Installation & Einrichtung

1.  **Repository klonen:**
    ```bash
    git clone https://github.com/ihr-benutzername/PALoSA-refined.git
    cd PALoSA-refined
    ```

2.  **Abhängigkeiten installieren:**
    Dieses Skript installiert die Abhängigkeiten für das Root-Verzeichnis, den Client und den Server gleichzeitig.
    ```bash
    npm run install-dependencies
    ```

3.  **Umgebungsvariablen einrichten:**
    Erstellen Sie eine `.env`-Datei im `server/`-Verzeichnis und fügen Sie einen geheimen Schlüssel für die Pseudonymisierung hinzu.
    ```env
    # server/.env
    pseudoKey=dies-ist-ein-sehr-sicherer-key123
    ```

### Verfügbare Skripte

Die wichtigsten Skripte werden aus dem Projekt-Root ausgeführt:

| Skript                     | Beschreibung                                                                            |
| :------------------------- | :-------------------------------------------------------------------------------------- |
| `npm run dev`              | Startet den Client (Vite) und den Server (Nodemon) gleichzeitig im Entwicklungsmodus.   |
| `npm run build`            | Erstellt die optimierten Builds für Client und Server für die Produktion.               |
| `npm start-production`     | Startet den Server im Produktionsmodus und liefert den statischen Client-Build aus.     |
| `npm test --prefix server` | Führt die Jest-Tests für das Backend aus.                                               |

##  Funktionsweise

1.  **Session-Start:** Beim ersten Aufruf der Webseite erstellt der Server eine eindeutige Session-ID für den Benutzer.
2.  **Datei-Upload:** Der Benutzer wählt Dateien und ggf. Konfigurationsdateien aus. Diese werden per `multer` in ein session-spezifisches Verzeichnis auf dem Server geladen (z.B. `server/uploads/SESSION_ID/`).
3.  **Konfiguration:** Der Benutzer wählt die gewünschten Pseudonymisierungs-Optionen über die UI aus.
4.  **Verarbeitung:**
    *   Ein Klick auf "Pseudonymisieren" sendet die Einstellungen an den `/api/pseudo` Endpunkt.
    *   Der `processManager` auf dem Server startet den Workflow:
        1.  Erforderliche Ausgabe- und Download-Verzeichnisse werden erstellt.
        2.  `mergeSettings` kombiniert die UI-Einstellungen mit eventuell hochgeladenen `config.json`-Dateien.
        3.  Die Originaldateien werden in das `output`-Verzeichnis kopiert und dabei mit `-pseudo` umbenannt.
        4.  `processLogFiles` und `processJsonFiles` führen die eigentliche Pseudonymisierung auf den kopierten Dateien durch.
        5.  `zipDir` packt den Inhalt des `output`-Verzeichnisses in ein ZIP-Archiv im `download`-Verzeichnis.
5.  **Download & Bereinigung:** Der Benutzer kann das fertige ZIP-Archiv herunterladen. Mit "Cleanup" werden alle zugehörigen Session-Verzeichnisse auf dem Server gelöscht.