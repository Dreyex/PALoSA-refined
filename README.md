# PALoSA-refined

**PALoSA** (Pseudonymisierungs-App für Log-Dateien von Server-Anwendungen) ist eine moderne Full-Stack-Webanwendung zur sicheren und flexiblen Pseudonymisierung sensibler Daten in Log-, Text-, JSON- und XML-Dateien. Sie kombiniert ein intuitives React-Frontend mit einem leistungsfähigen Node.js/Express-Backend.

---

## Features

- **Datei-Upload:** Unterstützt `.log`, `.txt`, `.json` und `.xml`.
- **Konfigurierbare Pseudonymisierung:** 
  - Automatische Erkennung und Anonymisierung von E-Mail- und IPv4-Adressen.
  - Eigene Regex-Muster für alle Dateitypen.
  - JSON-spezifische Konfiguration: gezielte Feldpseudonymisierung (`sources`) und Zusammenführung mehrerer Felder (`derived`) via `config.json`.
- **Deterministische IP-Pseudonymisierung:** CryptoPAn für konsistente Ergebnisse.
- **Session-Management:** Jede Verarbeitung läuft in einer eigenen Session.
- **ZIP-Download:** Alle pseudonymisierten Dateien als ZIP-Archiv.
- **Automatisches Aufräumen:** Cron-Job entfernt alte Sessions.

---

## Tech Stack

| Bereich      | Technologien                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide React, ogl                                                               |
| **Backend**  | Node.js, Express.js, Multer, Archiver, express-session                                                        |
| **Testing**  | Jest                                                                                                          |
| **Linting**  | ESLint                                                                                                        |

---

## Projektstruktur

```
.
├── client/         # React/Vite Frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   └── ui/
│       └── utils/
├── server/         # Node.js/Express Backend
│   ├── __tests__/
│   ├── coverage/
│   ├── uploads/
│   ├── output/
│   ├── download/
│   └── utils/
└── package.json
```

---

## Schnellstart

### Voraussetzungen

- Node.js (empfohlen: v18+)
- npm

### Installation

1. **Repository klonen:**
    ```bash
    git clone https://github.com/ihr-benutzername/PALoSA-refined.git
    cd PALoSA-refined
    ```

2. **Abhängigkeiten installieren:**
    ```bash
    npm run install-dependencies
    ```

3. **Umgebungsvariablen setzen:**
    Erstellen Sie `server/.env` mit:
    ```env
    PSEUDO_KEY=dies-ist-ein-sehr-sicherer-key123
    ```

### Wichtige Skripte

| Skript                     | Beschreibung                                              |
|----------------------------|-----------------------------------------------------------|
| `npm run dev`              | Startet Client & Server im Entwicklungsmodus              |
| `npm run logs:clear`       | Löscht die Logs aus dem Verzeichnis ./server/logs/        |
| `npm run build`            | Erstellt Produktions-Builds für Client & Server           |
| `npm start`                | Startet den Server im Produktionsmodus                    |

---

## Ablauf

1. **Session-Start:** Server erstellt eine Session-ID.
2. **Datei-Upload:** Dateien und Konfiguration werden hochgeladen.
3. **Konfiguration:** Einstellungen werden im Frontend gewählt.
4. **Verarbeitung:** 
   - Einstellungen und Konfigurationen werden zusammengeführt.
   - Dateien werden pseudonymisiert und ins Output-Verzeichnis kopiert.
   - ZIP-Archiv wird erstellt.
5. **Download & Bereinigung:** ZIP kann heruntergeladen werden, Session-Verzeichnisse werden aufgeräumt.

---

## Wichtige Hinweise zur config-Datei

- Die Konfigurationsdatei muss für JSON-Dateien **json-config.json** und für XML-Dateien **xml-config.json** heißen.
- Die Datei muss folgende Struktur und Form einhalten:
- [Externe Website](https://www.jsonschemavalidator.net/) zum prüfen des Schemas der config-Datei (Schema kopieren und links einfügen | Rechts den Inhalt ihrer config-Datei einfügen)

```json
{
    "type": "object",
    "properties": {
        "sources": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "derived": {
            "type": "object",
            "propertyNames": {
                "pattern": "^.*$"
            },
            "additionalProperties": {
                "type": "object",
                "properties": {
                    "sources": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        }
                    },
                    "separator": {
                        "type": "string"
                    }
                },
                "required": ["sources", "separator"],
                "additionalProperties": false
            }
        }
    },
    "required": ["sources", "derived"],
    "additionalProperties": false
}
```

### Beispiele für gültige config-Dateien:

#### Nur Sources:
```json
{
    "sources": ["firstname", "lastname", "email", "ipAddress", "location"],
    "derived": {}
}
```
> **Hinweis:** Die Pfade zu den Feldern müssen nicht angegeben werden wie bei den derived-Feldern.

#### Nur Derived:
*Mit einem derived-Feld*
```json
{
    "sources": [],
    "derived": {
        "user.fullname": {
            "sources": ["user.firstname", "user.lastname"],
            "separator": " "
        }
    }
}
```

*Mit mehreren derived-Feldern*
```json
{
  "sources": [],
  "derived": {
    "user.fullname": {
      "sources": [
        "user.firstname",
        "user.lastname"
      ],
      "separator": " "
    },
    "user.address": {
      "sources": [
        "user.street",
        "user.plz"
      ],
      "separator": " "
    }
  }
}
```
> **Hinweis:** Wenn die Quellfelder nicht pseudonymisiert werden, ist das zusammengesetzte Feld ebenfalls nicht pseudonymisiert.  
> **Hinweis:** Die Pfade zu den Quellfeldern und dem Derived-Feld müssen mit Punkten getrennt angegeben werden.

#### Sources & Derived:
```json
{
    "sources": ["email", "ipAddress"],
    "derived": {
        "user.fullname": {
            "sources": ["user.firstname", "user.lastname"],
            "separator": " "
        }
    }
}
```


