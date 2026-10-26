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

## Want to Buy – Einkaufsplan für Marken (EU / PvE-Kleriker)

Oben unter dem Kopfbereich steht jetzt der Knopf **🛒 Want to Buy**. Die Liste funktioniert auch ohne erfolgreichen Gear-Import und umfasst die Shugo-Festival-, Albtraum-, Saison-, Abgrund- und Daeva-Pass-Shops. Vorrang haben nachhaltige Charakter-Upgrades, dann situative Fortschritte und zuletzt Skins. Für jeden Eintrag lässt sich **Gekauft** abhaken; offene Einkäufe können gefiltert werden. Unter **Eigenen Wunsch hinzufügen** kannst du weitere Shop-Gegenstände eintragen. Die Liste wird nur lokal im Browser gespeichert. Mit **Gekauft-Häkchen zurücksetzen** startest du eine neue Runde. Es gibt keine automatischen Resets und keine erfundenen aktuellen Preise.

Quellen zum Gegenprüfen:
- https://metabot.gg/en/aion-2/shops
- https://www.odealo.com/articles/best-items-to-buy-first-aion-2-currency-shop-guide
- https://metaroad.gg/aion2/getting-started/aion-2-events-and-shugo-festa

Die Prioritäten sind PvE-Richtwerte, keine vollständige oder garantiert aktuelle 1:1-Liste der Shop-Angebote im Spiel.


## Offizieller NCSOFT EU-Import (getestet am 26.10.2026)

Im Abschnitt **AION 2 – offizieller Charakterimport (Test)** kannst du einen offiziellen EU-Charakterlink eingeben. Für das einmalig getestete Profil (Server-ID `1305`) wurde ein tatsächlicher Serverabruf von NCSOFT mit HTTP 200 bestätigt: **25 Gear-Slots, alle 25 Item-Detailantworten, 35 Skills und 5 Daevanion-Tafeln**. Die Details enthalten Seelenbindung, Basiswerte, Manasteine und Göttersteine, wo vom Quellserver angegeben.

Der Browser importiert dazu die Datei `nc-character-snapshot.json` von unserer **eigenen GitHub-Pages-Seite**. Es ist kein Cloudflare und keine CORS-Ausnahme erforderlich. Es ist aktuell ein **Snapshot nur dieses einen EU-Charakters** und **kein beliebig live abrufbarer Import**. Die Webseite zeigt den Daten-Zeitstempel. Für andere Charaktere wäre später ein öffentlicher Datenserver nötig.

Zum Aktualisieren dieses Testdatensatzes:
1. Auf GitHub ins Repository **Kai-022/Remote-Einmannrevi** unter **Actions** gehen.
2. **AION 2 Official API Probe** auswählen, dann **Run workflow**.
3. Der Workflow fragt die öffentlichen Charakter- und Item-Daten sparsam ab und ersetzt den Snapshot bei Erfolg.
4. Nach erfolgreicher GitHub-Pages-Veröffentlichung die Webseite neu öffnen und denselben offiziellen Profil-Link importieren.

Hinweise: Die offiziellen Web-Endpunkte besitzen keinen zugesicherten Public-API-Vertrag; zukünftige HTTP-403-Fehler sind möglich. Der Snapshot enthält ausschließlich öffentlich sichtbare Charakterdaten aus der offiziellen Profilseite und ist als statische JSON-Datei in diesem **öffentlichen GitHub-Repository** lesbar. Manuell eingetragene Gear-Werte werden nur nach Bestätigung ersetzt. Die Funktion greift nicht auf deinen Spielclient oder Logindaten zu.

`nc-probe.py` prüft die zwei öffentlichen API-Endpunkte; `nc-snapshot.py` erstellt den Datensatz mit Gear-Detailantworten. Die Dateien werden per `.github/workflows/aion2-official-probe.yml` ausgeführt.


## Upgrade-Plan / Gear-Advisor (EU)

Der Reiter **„✦ Upgrade-Plan“** verknüpft die öffentlich auslesbaren Charakterdaten mit einem transparenten Verbesserungsplan. Er zeigt priorisierte Vorschläge und einen einzelnen nächsten Schritt.

**Automatisch aus dem öffentlichen Profil:** Klasse und Stufe, importierte Ausrüstung mit +Stufe und Seltenheit, vorhandene Zusatzwerte aus den Gegenstandsdetails sowie Daevanion-Knoten, soweit NCSOFT sie liefert. Jeder Vorschlag ist anhand dieser Werte nachvollziehbar; bei fehlenden Details wird keine Reroll-Empfehlung erfunden.

**Manuell und nur lokal im Browser:** Pantheon-Besitz/Aufstellung, erledigte Schritte, Materialbewertung in Kina, verfügbares Budget und Vergleichspreis eines Ersatzgegenstands. Die Einstellungen werden getrennt nach Server und Charakter-ID gespeichert.

**Kosten:** Reroll-Gebühren und benötigte Reset-Kodexe stammen aus der EU-Clienttabelle „Soul Binding costs“ (Stand 24.10.2026). Die Gebühren gelten für **einen Versuch**, nicht für einen garantierten Zielwert. Ein Reset-Kodex hat keinen automatisch bekannten Marktpreis. Sobald der Nutzer einen Materialwert einträgt, wird der hypothetische Gesamtpreis für einen Versuch berechnet und optional mit einem selbst eingetragenen Ersatzpreis verglichen. Bei unbekannten Kosten gibt es keinen falschen „günstigsten“ Sieger.

**Item-/Drop-Recherche:** Externe Links führen zu Gegenstandsdaten, Dropquoten, Soul-Binding-Pools und Verstärkungsrechnern. Ein aus einem Gegenstandsnamen abgeleiteter Fundort wird ausdrücklich als **Suchhinweis** gekennzeichnet, nicht als bestätigter Drop. Für Ludra-Waffen gibt es ein dokumentiertes langfristiges Dungeon-Ziel mit EU-Quellenangabe. Der Advisor kopiert keine fremden Item-Datenbanken automatisiert.

**Grenzen:** Kein Hintergrundtracking bei geschlossenem Browser, keine Live-Auktionspreise, kein Zugriff auf das Spielinventar und keine bestätigte individuelle Klassen-BiS-Simulation. „↻ Charakter neu einlesen“ stößt den vorhandenen manuellen öffentlichen Import an und benötigt eine funktionierende Cloudflare-API. Auf GitHub Pages ist ohne Cloudflare-Live-Backend weiterhin nur der bekannte Test-Snapshot importierbar. Der Charakterimport wird niemals als erfolgreich markiert, bevor er wirklich Daten liefert.

Datenquellen:
- [Aion2.gg EU-Itemdaten](https://aion2.gg/database/items)
- [EU-Dropquoten](https://aion2.gg/database/drop-rates?type=Equip)
- [Soul Binding: mögliche Slotwerte](https://aion2.gg/tools/soul-imprint)
- [Soul Binding: Gebühren und Reset-Kodexe](https://aion2.gg/database/tables/soul-binding-costs)
- [Verstärkungsrechner](https://aion2.gg/tools/enchant-planner)
- [Upgrade-Reihenfolge](https://aion2.gg/tools/upgrade-order)

Tests: node aion2-gear-checker/tests/upgrade-advisor.mjs oder GitHub Actions „AION 2 Upgrade Advisor Test“.

