# AION 2 EU – Daeva Gear Checker

**Browserseite (sofern GitHub Pages aus main / root aktiv ist):**  
https://kai-022.github.io/Remote-Einmannrevi/aion2-gear-checker/

## EU-Charakterimport
1. Webseite öffnen, EU-Charakternamen eingeben, „EU-Charakter suchen“ auswählen.
2. Bei mehreren Treffern den richtigen Server und Charakter anklicken.
3. Die Seite versucht, Profil, angelegte Ausrüstung und Zusatzwerte aus öffentlichen Quellen zu importieren.
4. Auf „Gear“ und „Upgrade-Plan“ werden die erkannten Werte mit Kleriker-PvE-Empfehlungen verglichen.
5. Fehlende Seelenbindungswerte können in der manuellen Gear-Bearbeitung nachgetragen werden.
6. Zusätzlich gibt es eine JSON-Datei-Importoption und einen Demo-Modus.

**Wichtig:** Die statische GitHub-Pages-Seite hat keinen eigenen Proxy. Daher erfolgt der Abruf derzeit direkt aus dem Browser über die frei dokumentierte [Vi.ki-API](https://vi.ki/docs) oder die öffentliche NCSOFT-API. Wenn der Browser Cross-Origin-Anfragen (CORS) blockiert oder die offiziellen Server ausfallen, kann der Live-Import scheitern. Ein eigener Cloudflare Worker oder anderer Proxy wäre für zuverlässigen Betrieb sinnvoll. **Der Live-Import konnte noch nicht end-to-end auf einer veröffentlichten Seite geprüft werden.** Die JavaScript-Syntax ist geprüft und die Dateien sind auf GitHub gespeichert.

## Datenschutz
Keine Spiel-Logins oder Passwörter. Öffentliche Spielcharakterdaten werden bei einer Suche an die angegebenen externen API-Dienste geschickt. Gear-Einträge werden nur lokal im Browser gespeichert (localStorage). Änderungen betreffen ausschließlich die Webseite, niemals das Spiel. Inoffizielles Fanprojekt ohne Verbindung zu NCSOFT.

## Dateien
- `index.html` – Gear- und Pet-Analyse, manuelle Bearbeitung
- `import.js` – Charaktersuche, Auswahl mehrerer Server und Import
