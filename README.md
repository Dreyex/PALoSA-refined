# PALoSA-refined

**Monorepo mit Vite + React Frontend und Express Backend**  
**Release-Version:** v1.1.0  
**Deployment-Szenario:** Internes Server-Hosting ohne Docker (Nginx + systemd/PM2)

---

## Übersicht

Dieses Projekt besteht aus einem React-Frontend (gebaut mit Vite) und einem Express-Backend. Es ist als Monorepo strukturiert und unterstützt reproduzierbare Releases durch Git-Tagging (z. B. `v1.1.0`). Beide Komponenten werden lokal auf einem Server für interne Nutzer bereitgestellt. [104][106][100]

---

## Projektstruktur

```
PALoSA-refined/
├── client
│   ├── public
│   │   ├── favicon.ico
│   │   ├── logo.svg
│   │   └── vite.svg
│   ├── src
│   │   ├── components
│   │   │   ├── ui
│   │   │   │   ├── Aurora.jsx
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── CheckboxOptionList.jsx
│   │   │   │   ├── FileInput.jsx
│   │   │   │   ├── FileItem.jsx
│   │   │   │   ├── FileList.jsx
│   │   │   │   ├── FileUploadInput.jsx
│   │   │   │   ├── IconCheckbox.jsx
│   │   │   │   ├── SelectFilesButton.jsx
│   │   │   │   └── TextPatternInput.jsx
│   │   │   ├── FileUploadCard.jsx
│   │   │   └── SettingField.jsx
│   │   ├── utils
│   │   │   └── validateConfig.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   └── vite.config.js
├── server
│   ├── download
│   ├── output
│   ├── uploads
│   ├── utils
│   │   ├── archive.js
│   │   ├── copyFileToOutput.js
│   │   ├── createDir.js
│   │   ├── createFile.js
│   │   ├── generateFileName.js
│   │   ├── ipBuffer.js
│   │   ├── isEMailAddress.js
│   │   ├── isIPv4Address.js
│   │   ├── mergeSettings.js
│   │   ├── processJsonFiles.js
│   │   ├── processLogFiles.js
│   │   ├── processManager.js
│   │   ├── PseudoContentRegex.js
│   │   ├── pseudonymizeMail.js
│   │   └── requestRegex.js
│   ├── index.js
│   ├── package-lock.json
│   └── package.json
├── CheatSheet.md
├── package-lock.json
├── package.json
└── Readme.md
```


---

## Release-Workflow

1. **Frontend:**  
   - Im branch/tag (`release/v1-1-0`) bauen mit  
     `npm run build`  
     Das statische Build-Verzeichnis (z. B. `/frontend/dist`) wird von Nginx ausgeliefert. [100]

2. **Backend:**  
   - Im branch/tag auschecken  
     `npm ci --omit=dev`  
     Bei TypeScript/Bundler:  
     `npm run build` (Output in `/backend/dist`)
   - Production-Start:  
     `NODE_ENV=production node dist/server.js`  
     Alternativ via PM2:  
     `pm2 start dist/server.js --name palo-backend --env production` [106][110]

3. **Umgebungsvariablen:**  
   - In `.env.production` sensible Settings (z. B. PORT, DB_URL, SECRET_KEY) pflegen  
   - `NODE_ENV=production` wird extern gesetzt (systemd, PM2, CLI), nicht in `.env`! [129][134]

4. **Nginx-Konfiguration:**  
   - Serve statische Frontend-Dateien aus `/frontend/dist`  
   - Proxy API-Requests (z. B. `/api`) an Express (`localhost:3000`) [100][103][108]

5. **Tagging:**  
   - Der Release-Commit erhält den Tag `v1.1.0`
   - Build-/Deploy-Skripte beziehen sich exakt auf diesen Tag

---

## Beispielhafte Nginx-Konfiguration

```nginx
server {
    listen 80;
    server_name dein.server;
    root /pfad/zum/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---
## Backend als Dienst

**Mit PM2:**  

```sh
pm2 start dist/server.js --name palo-backend --env production
pm2 save
pm2 startup         # Autostart sichern
```

**Mit systemd:** 
```ini
[Unit]
Description=PALoSA Backend
After=network.target

[Service]
Environment=NODE_ENV=production
WorkingDirectory=/pfad/zum/backend
ExecStart=/usr/bin/node /pfad/zum/dist/server.js
Restart=always
User=appuser

[Install]
WantedBy=multi-user.target
```

---

## Changelog & Versionierung

Releases werden per SemVer getaggt (z. B. `v1.1.0`).  

---

*Hinweis:* Für produktive Sicherheit CORS, Helmet und Fehlerbehandlung im Express-Backend aktivieren.

---

**Release-Tag: v1.1.0 | Stand: 2025-08-13**