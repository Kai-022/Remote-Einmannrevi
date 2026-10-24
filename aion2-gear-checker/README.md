# AION 2 – Daeva Gear Checker (EU, Kleriker PvE)

**Webseite:** https://kai-022.github.io/Remote-Einmannrevi/aion2-gear-checker/?v=8

Die Seite braucht **keine Installation und kein Cloudflare-Konto**.

## 1. Offiziellen Charakterlink einfügen
Du kannst deinen EU-Charakterlink von `aion2.plaync.com` direkt einfügen. Dabei werden die Region, Server-ID und Charakter-ID erkannt. Anschließend versucht die Webseite die Daten direkt abzurufen.

**Einschränkung:** Der offizielle Link enthält selbst keine Gear-Daten. Browser-Direktzugriffe auf Vi.ki und NCSOFT können durch CORS/HTTP 403 scheitern; das kann ein statisches GitHub-Pages-Projekt nicht umgehen.

## 2. Alternativ: Gear von der geöffneten offiziellen Seite übernehmen (experimentell)
Diese Variante versucht den Abruf auf **aion2.plaync.com selbst**, statt von der fremden GitHub-Adresse.

1. Öffne im Desktop-Browser den Gear Checker.
2. Zeige die Lesezeichenleiste mit **Strg+Umschalt+B** an.
3. Ziehe den goldenen Link **„✧ AION-2-Gear übernehmen“** in die Lesezeichenleiste. Das ist ein kleines Lesezeichen mit JavaScript, keine Erweiterung und keine Installation.
4. Öffne dein offizielles EU-Charakterprofil auf `aion2.plaync.com`.
5. Klicke **dort**, während das Profil offen ist, auf das neue Lesezeichen.
6. Es öffnet sich ein Fenster mit dem Gear Checker. Wenn die offizielle Seite ihre Ausrüstungs-API erreichen kann und Lesezeichen-Skripte zulässt, werden deine aktuellen Gear-Slots übertragen und ausgewertet.

Das Lesezeichen sendet **ausschließlich** die öffentlich vom offiziellen Charakterprofil abrufbare Equipment-Antwort und öffentliche Charakterdaten an die eigene GitHub-Pages-Seite. Es liest **keine Login-Cookies**, Passwörter oder versteckte Spielclient-Daten. Der Empfänger akzeptiert nur Nachrichten aus dem offiziellen Seitenursprung und vom öffnenden Fenster.

**Wichtige Grenze:** Diese Funktion ist experimentell und konnte mit einem echten Charakterprofil noch nicht live getestet werden. Sie funktioniert **nicht**, wenn auch die offizielle Website ihre Equipment-API nicht abrufen kann oder Lesezeichen-Skripte unterbindet.

## 3. Ohne verfügbare API
- Manuell eintragen: Ausrüstungsplatz, Gegenstand, Verbesserungsstufe und Zusatzwerte.
- Vorhandene Daten als JSON-Datei importieren, sofern die Struktur erkannt wird.
- Demodaten zum Testen anzeigen.

Eingaben werden im Browser gespeichert (localStorage). Der Checker zeigt keine erfundenen Live-Ausrüstungswerte an. Gear-Empfehlungen sind Heuristiken, keine exakte Schadenssimulation.

## Dateien
- `index.html`: Browser-Oberfläche
- `import.js`: Linkimport, Namenssuche, Lesezeichen-Transfer, JSON-Import

Inoffizielles Fanprojekt, nicht mit NCSOFT verbunden.
