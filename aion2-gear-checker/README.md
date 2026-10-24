# AION 2 EU – Daeva Gear Checker (ohne Cloudflare)

**Webseite:** https://kai-022.github.io/Remote-Einmannrevi/aion2-gear-checker/

Ein Browser-Gear-Checker für den AION-2-Kleriker auf dem EU-Server. Es ist **kein Cloudflare-Konto**, keine Installation und kein selbst betriebener Server notwendig, um die Webseite und die manuelle Gear-Analyse zu nutzen.

## Charakterlink verwenden

1. Kopiere deinen offiziellen EU-Charakterlink von `aion2.plaync.com`.
2. Öffne den Gear Checker und füge den Link in **„Einfacher: Charakterlink einfügen“** ein.
3. Klicke **„Gear aus Link importieren“**.
4. Die Webseite erkennt Server und Charakter-ID lokal und versucht, die öffentlichen Gear-Daten direkt von Vi.ki oder NCSOFT abzurufen.

**Wichtige Grenze:** Der Charakterlink enthält nur IDs, **nicht** die Gear-Daten. GitHub Pages kann Browser-Zugriffsrechte fremder Seiten nicht umgehen. Wenn Vi.ki CORS-Anfragen ablehnt oder NCSOFT HTTP 403 liefert, ist der automatische Import ohne externen Backend-Dienst nicht möglich. Die Seite zeigt dann eine verständliche Fehlermeldung, statt Erfolg vorzutäuschen. Ein tatsächlich erfolgreicher Live-Import wurde bisher nicht bestätigt.

## Auch ohne Live-Daten nutzbar

- **Manuelle Eingabe:** Eigene Gear-Slots auswählen, Namen, Verbesserungsstufe und Seelenbindungswerte eingeben; die Seite bewertet die eingetragenen Werte und erstellt eine Prioritätenliste.
- **JSON-Import:** Vorliegende Equipment-Daten als JSON-Datei auswählen. Voraussetzung ist ein von der Webseite erkanntes Datenformat; eine beliebige Datei aus dem Spiel ist nicht automatisch kompatibel.
- **Demo:** Ohne echte Charakterdaten testen.
- **Pet-Ziele:** Alle 45 vorgeschlagenen Spezieskenntnisse durchsehen.

## Datenschutz

- Kein Spiel-Login und keine Passwörter.
- Die Webseiten-App speichert deine Angaben nur im Browser.
- Beim versuchten Online-Import sendet der Browser den Charakternamen oder öffentliche IDs direkt an die öffentliche Datenquelle Vi.ki bzw. NCSOFT.
- Kein Cloudflare-Worker, keine Proxy-Verbindung im Code.

## Dateien

- `index.html` – Gear- und Pet-Analyse
- `import.js` – EU-Charakterlink, optionaler direkter Namenssuchversuch, JSON-Import

Inoffizielles Fanprojekt ohne Verbindung zu NCSOFT.