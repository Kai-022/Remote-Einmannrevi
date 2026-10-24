# AION 2 EU – Daeva Gear Checker (Kleriker PvE)

**Webseite:** https://kai-022.github.io/Remote-Einmannrevi/aion2-gear-checker/?v=shugo3

## Gear aus Shugo.GG übernehmen – ohne Cloudflare und ohne Installation

**Empfohlen: Lesezeichen-Import.** Ein normaler `fetch()` aus einer GitHub-Pages-Webseite zu Shugo.GG schlägt bei Browser-CORS-Sperren mit `Failed to fetch` fehl. Shugo.GG bietet laut [FAQ](https://shugo.gg/de/faq) außerdem keine öffentliche API.

1. Gear Checker auf dem **Desktop** öffnen.
2. Lesezeichenleiste mit **Strg + Umschalt + B** anzeigen.
3. Den goldenen Link **„✧ Gear aus Shugo übernehmen“** in die Lesezeichenleiste **ziehen** (nicht im Gear Checker anklicken).
4. Das öffentliche EU-Charakterprofil unter `https://shugo.gg/character/global/eu-SERVER/NAME` öffnen und warten, bis die Ausrüstung angezeigt wird.
5. **Auf Shugo.GG** das neue Lesezeichen anklicken.
6. Der Gear Checker öffnet sich. Das Lesezeichen versucht, ausschließlich die sichtbare Ausrüstung aus Shugo.GG zu übertragen. Die Webseite erkennt bekannte Slots und die im Profil sichtbaren +Verzauberungs- und ◆Durchbruchsstufen.

Es werden keine Passwörter, Cookies, Spiel-Login-Daten oder versteckten API-Daten übertragen. Der Gear Checker akzeptiert den Transfer nur aus dem öffnenden Shugo.GG-Browserfenster.

**Einschränkungen:**
- Dieser Ablauf ist **experimentell** und konnte nicht mit einem echten Shugo-Profil im Browser vollständig getestet werden.
- Wenn das Profil keine Ausrüstung anzeigt, Shugo Lesezeichen-Skripte blockiert oder der Browser das zusätzliche Fenster abtrennt, klappt die Übernahme nicht.
- Shugo.GG zeigt nicht alle Seelenbindungswerte; fehlende Werte müssen im Gear Editor ergänzt werden.
- Ein Profil-Link alleine kann die Cross-Origin-Sperre nicht aufheben.
- Ein automatischer Live-Import direkt nur durch das Einfügen eines Shugo-Links ist **nicht** als zuverlässig funktionierende Funktion anzusehen.

## Fallback: kopieren und einfügen
Shugo-Profil öffnen, **Ausrüstung** anzeigen, **Strg + A**, **Strg + C**. Dann Text in den Gear Checker im Feld „Kopierter Text aus dem Charakterprofil“ mit **Strg + V** einsetzen und **Kopiertes Gear übernehmen** wählen.

Weitere Optionen: manuelle Gear-Eingabe, Import einer bereits vorhandenen JSON-Datei, Demo. Alle lokalen Eingaben bleiben im Browser gespeichert.

## Dateien
- `index.html`: Gear- und Pet-Bewertung, Editor inklusive Arkana
- `shugo.js`: Shugo Link, optionaler Direktabruf, Textparser, Lesezeichen-Transfer
- `import.js`: offizielle Profile und JSON-Import als ältere Alternativen

Fanprojekt, keine Verbindung zu Shugo.GG oder NCSOFT.