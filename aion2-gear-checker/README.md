# AION 2 EU – Daeva Gear Checker (Kleriker / PvE)

**Live-Webseite:** https://kai-022.github.io/Remote-Einmannrevi/aion2-gear-checker/?v=shugo2

## Shugo.GG als Hauptimport (ohne Installation, ohne Cloudflare)

1. Besuche https://shugo.gg/de/character und suche deinen Charakter auf den **Global-EU-Servern**.
2. Öffne sein Profil. Der Link sieht beispielsweise so aus: `https://shugo.gg/character/global/eu-siel/Name`.
3. Füge die Profiladresse oben im Daeva Gear Checker in das neue **Shugo.GG-Charakterlink**-Feld ein.
4. Mit **Gear über Link laden** versucht die Webseite, die öffentlich sichtbaren HTML-Profildaten direkt zu lesen. Das funktioniert **nur**, wenn Shugo.GG Cross-Origin-Browserzugriffe freigibt. Shugo.GG hat laut eigener FAQ **keine öffentliche API**. Keine privaten Endpunkte, keine Proxy-Umgehung.
5. Wenn der direkte Abruf (CORS) blockiert wird, öffne über **Shugo-Profil öffnen** das Profil, wähle den Tab **Ausrüstung**, drücke **Strg + A**, **Strg + C**, kehre zum Checker zurück und füge die Kopie mit **Strg + V** im Feld **Kopierter Text aus dem Charakterprofil** ein. Drücke **Kopiertes Gear übernehmen**.
6. Der Import übernimmt Slotnamen, Gegenstände und Verbesserungsstufen inklusive sichtbarer Durchbruchsstufen. Nicht aus dem Profil hervorgehende **Seelenbindungs-/Soul-Binding-Zusatzwerte** werden **nicht erfunden**; diese kannst du im Gear-Editor nachtragen.

Unter **Weitere Importmöglichkeiten** sind weiterhin der alte offizielle NCSOFT-Link, JSON-Datei-Import und experimentelle Optionen erreichbar.

## Grenzen
- Der Shugo-Link **allein garantiert keinen automatischen Abruf**: Für direkte `fetch`-Anfragen gelten die CORS-Regeln von Shugo.GG.
- Der Import aus kopiertem Profiltext liest nur, was du selbst auf der Seite siehst und kopierst.
- Die offiziellen AION-2-Charakterdienste können zeitweise nicht erreichbar sein; Shugo.GG ist von diesen Daten ebenfalls abhängig.
- **Kein Login/Passwort**, keine externe Serververbindung außer zum ausdrücklich gewählten öffentlichen Profil.
- Die Gear-/PvE-Empfehlungen sind heuristisch. Neue Profilimporte mit fehlenden Zusatzwerten gelten als „noch nicht geprüft“.

## Dateien
- `index.html`: Gear- und Pet-Bewertung, manueller Editor einschließlich 5 Arkana-Plätzen
- `import.js`: ältere offizielle Profil- und JSON-Importmöglichkeiten
- `shugo.js`: Shugo-Link, öffentlicher HTML-Abrufversuch, Profiltext-Erkennung und Übernahme

Datenquelle zum Nachlesen: https://shugo.gg/de/faq (Shugo.GG: keine öffentliche API).

Inoffizielles Fanprojekt, weder von NCSOFT noch Shugo.GG betrieben.