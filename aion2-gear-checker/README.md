# AION 2 EU – Daeva Gear Checker mit Charakterimport

**Webseite:** https://kai-022.github.io/Remote-Einmannrevi/aion2-gear-checker/

Charaktersuche, Gear-Import und PvE-Gear-Bewertung für Kleriker (EU). Keine Installation auf dem eigenen PC.

## Einmaliges Online-Setup: Cloudflare Worker
GitHub Pages unterstützt keine serverseitigen Funktionen. Ein Cloudflare Worker überbrückt den CORS-Schutz des Browsers und fragt dafür ausschließlich die dokumentierte öffentliche Vi.ki-API ab. **Der Worker muss einmal in einem eigenen Cloudflare-Konto bereitgestellt werden.** Das kann ChatGPT mit der bestehenden GitHub-Verbindung nicht selbst ausführen.

1. Öffne https://dash.cloudflare.com/ und erstelle bei Bedarf ein kostenloses Konto.
2. Wähle **Workers & Pages → Create application → GitHub** (bei manchen Layouts erst **Import a repository**).
3. Verbinde GitHub und wähle **Kai-022/Remote-Einmannrevi**, Branch **main**.
4. Name für den Worker: **aion2-gear-eu-proxy** (muss zur `wrangler.jsonc` passen).
5. Root directory: **aion2-gear-checker**; Deploy command: **npx wrangler deploy**. Ein Build-Schritt ist nicht notwendig.
6. Klicke **Save and Deploy**. Cloudflare liefert eine öffentliche Adresse wie `https://aion2-gear-eu-proxy.DEIN-SUBDOMAIN.workers.dev`.
7. Öffne den [Gear Checker](https://kai-022.github.io/Remote-Einmannrevi/aion2-gear-checker/), füge die Worker-Adresse im Feld **Worker-Adresse** ein und klicke **Verbindung testen & speichern**.

Alternativ lässt sich die Datei [cloudflare-worker.js](cloudflare-worker.js) ohne Git-Integration im Cloudflare-Worker-Code-Editor hinterlegen und veröffentlichen.

## Charakterimport per offiziellem EU-Profil-Link
1. Öffne die offizielle Charakterseite bei `aion2.plaync.com`.
2. Kopiere die vollständige URL inklusive `?region=eu`.
3. Füge sie unter **„Einfacher: Charakterlink einfügen“** in den Gear Checker ein und klicke **Gear aus Link importieren**.
4. Die Webseite erkennt Server- und Charakter-ID ohne Namenssuche. Anschließend versucht sie, die öffentliche Equipment-API auszulesen.
5. **Ein Link ersetzt keinen Backend-Zugriff**: Wenn NCSOFT/Vi.ki CORS oder HTTP 403 liefert, muss der eigene Cloudflare Worker konfiguriert werden. Die Webseite zeigt den Grund an und behält vorhandene Gear-Eingaben.

## Charakterimport per Namenssuche
1. EU-Charaktername eingeben und **EU-Charakter suchen** anklicken.
2. Richtigen Server aus der Trefferliste wählen und **Importieren** klicken.
3. Vorhandenes Gear, Verbesserungsstufen und – wenn die öffentliche Datenquelle sie liefert – Seelenbindungswerte werden eingelesen. Fehlende Werte kannst du von Hand ergänzen.
4. Gear- und Upgrade-Empfehlungen sind Richtwerte, keine exakte DPS-Berechnung.

## Probleme und Grenzen
- **Worker /health ist erreichbar, Suche schlägt fehl:** Das Problem ist bei der öffentlichen Vi.ki- oder NCSOFT-Datenquelle. Diese können zeitweise HTTP 403/502 melden. Der Proxy kann keinen echten Quellserver-Ausfall beheben.
- **Verbindung testen funktioniert nicht:** Worker-URL und Cloudflare-Deployment kontrollieren.
- **Gear-Werte unvollständig:** Die öffentlichen Profil-APIs stellen möglicherweise nicht alle Seelenbindungsdaten bereit.
- **End-to-End:** Der Code und GitHub-Stand wurden geprüft; eine Live-Suche mit einem realen EU-Charakter kann ohne veröffentlichten Worker nicht bestätigt werden.

## Datenschutz
- Kein Spiel-Login, kein Passwort, keine Verbindung zum Spielclient.
- Die Webseite speichert eingetragene Gear-Daten nur lokal im Browser (localStorage).
- Eine Suche schickt Charakternamen an **deinen Cloudflare Worker**, der sie zur öffentlichen Vi.ki-API weitergibt. Der Proxy akzeptiert nur feste API-Routen und EU-Region.
- Die App hat keinen Zugriff auf dein Inventar, geheime Spielinformationen oder deinen Account.

## Dateistruktur
- `index.html` – Website, Gear-Auswertung, Pet-Ziele
- `import.js` – UI, Proxy-Anbindung, Import der Charakterdaten
- `cloudflare-worker.js` – Cloudflare Worker (EU-only, GET, whitelist)
- `wrangler.jsonc` – Cloudflare Git-Deploy-Konfiguration

Inoffizielles AION-2-Fanprojekt, nicht mit NCSOFT verbunden. API: https://vi.ki/docs
