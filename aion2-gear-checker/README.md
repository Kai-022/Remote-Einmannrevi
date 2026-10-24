# AION 2 – Daeva Gear Checker (EU, Kleriker PvE)

**Website:** https://kai-022.github.io/Remote-Einmannrevi/aion2-gear-checker/?v=shugo4

## Einfach: Shugo-Link einfügen

1. Öffne den Gear Checker.
2. Füge deinen EU-Charakterlink von Shugo.GG ein (z. B. `https://shugo.gg/character/global/eu-siel/Jacode`).
3. Die öffentliche Profilseite wird im Hintergrund über **Jina Reader** als Text abgefragt. Dazu wird dein öffentlicher Profil-Link an Jina AI gesendet. Eine Installation, ein API-Schlüssel, Cloudflare oder ein eigenes Serverkonto sind nicht nötig.
4. Soweit der Dienst das Profil bereitstellt, werden die aufgeführten Ausrüstungs-Slots, Gegenstände, Verzauberungsstufen (+N) und Durchbruchsstufen (◆N) übernommen.
5. Die Auswertung zeigt den bestehenden PvE-Kleriker-Gear-Plan und die Pet-Ziele. *Seelenbindungswerte, die das Profil nicht enthält, werden nicht erfunden.*

**Wichtig:** Der Seitenparser ist mit dem öffentlichen Shugo-Profilformat getestet. Ein erfolgreicher Browser-End-to-End-Import via Jina Reader ist noch **nicht** nachgewiesen. Jina kann Limits haben, Antworten zurückhalten oder durch den Zielserver blockiert werden. Da Shugo.GG [keine öffentliche API](https://shugo.gg/de/faq) anbietet, kann ein Einfügen des Links **keinen garantierten Live-Import** liefern.

## Falls der automatische Abruf fehlschlägt

Klicke auf „Falls der automatische Import nicht klappt“, öffne das Profil auf Shugo.GG und kopiere die sichtbare Ausrüstungsansicht mittels Strg+A, Strg+C. Füge diesen Text anschließend in das Textfeld ein und übernimm das erkannte Gear.

Erweiterte alte NCSOFT- und JSON-Importmöglichkeiten sowie die manuelle Eingabe bleiben eingeklappt verfügbar.

## Datenschutz und Grenzen

- Kein Spiel-Login, keine Cookies, keine Passwörter.
- Beim Einfügen eines vollständigen Links wird dessen **öffentliche Profiladresse** an Jina Reader gesendet. Das ist ein **externer Lesedienst**, aber kein eigenes Cloudflare-Konto.
- Der Gear Checker speichert die übernommenen Werte nur im eigenen Browser (localStorage).
- Ein Profil-Link allein beinhaltet keine Ausrüstungsdaten. Ohne eine vom Browser erreichbare Datenquelle kann keine statische GitHub-Pages-Seite automatisch importieren.
- Profile können gecacht, unvollständig oder vorübergehend nicht verfügbar sein. Die angezeigten PvE-Empfehlungen sind heuristisch und nicht als exakte DPS-Rechnung zu verstehen.

## Projektdateien

- `index.html` – Gear- und Pet-Auswertung, Bearbeitung
- `shugo.js` – ein Linkfeld, Reader-Abfrage, Gear-Parsing, Fehlerbehandlung
- `import.js` – ältere Importmöglichkeiten (eingeklappt)

Fanprojekt ohne Verbindung zu NCSOFT oder Shugo.GG.