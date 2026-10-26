# Schon angelegten Cloudflare Worker verwenden (remote-einmannrevi)

Wenn in Cloudflare der Pfad `Workers → remote-einmannrevi → Production → Builds` zu sehen ist, ist **bereits ein Worker** vorhanden. Du musst dafür **kein neues Pages-Projekt** erstellen.

Das GitHub-Repository enthält nun zwei gleichwertige Wrangler-Konfigurationen:

- `/wrangler.jsonc` für **Root directory: `/`** (Repository-Hauptverzeichnis).
- `/aion2-gear-checker/wrangler.jsonc` für **Root directory: `aion2-gear-checker`**.

Beide stellen genau den vorhandenen Worker **`remote-einmannrevi`** bereit und veröffentlichen dessen AION-2-Frontend zusammen mit der Abfrage-API. So sind beide üblichen Root-Einstellungen abgedeckt.

## Einstellungen unter Workers → remote-einmannrevi → Settings → Builds

| Einstellung | Wert |
|---|---|
| Verbundenes GitHub-Repository | `Kai-022/Remote-Einmannrevi` |
| Production branch | `main` |
| Root directory | `/` oder `aion2-gear-checker` – beide werden unterstützt |
| Build command | Leer lassen; falls Pflichtfeld: `echo ready` |
| Deploy command | `npx wrangler deploy` |
| Worker name | `remote-einmannrevi` (muss übereinstimmen) |

Ein GitHub-Commit löst bei aktivierter Git-Anbindung einen neuen Cloudflare-Build aus. Beim **erfolgreichen Production-Deployment** auf die angezeigte Worker-Adresse gehen:

- `/` → Webseite (AION 2 Gear Checker)
- `/api/health` → JSON mit `{"ok":true}`
- `/api/search?serverId=1305&name=Taty` → öffentliche EU-Charaktersuche
- `/api/character?... ` → öffentliche Ausrüstung, Skills und Daevanion-Boards

**Wichtig:** Einen erfolgreich veröffentlichten Worker erkennt man an einem erfolgreichen Production-Build und an `/api/health`. Die genaue `workers.dev`-Adresse findet man im Cloudflare-Dashboard beim Worker über **Visit**. Der private Cloudflare-Dashboard-Link ist nicht die öffentliche Webseite. Der erste echte Live-Import sollte mit Taty/Yustiel getestet werden; mögliche Sperren der NCSOFT-API müssen beim realen Cloudflare-Aufruf geprüft werden.

---

# AION 2 Gear Checker – Cloudflare Pages einrichten

Mit dieser Git-Anbindung soll der Gear Checker öffentlich auffindbare EU-Charaktere über **Server + Name** importieren, ohne ZAP-vServer und ohne zusätzliche Serverkosten.

## Schritt 1: GitHub mit Cloudflare verbinden

1. Öffne https://dash.cloudflare.com/ → **Workers & Pages**.
2. **Create application** → **Pages** → **Connect to Git**.
3. Wähle **GitHub**, autorisiere den Zugriff und wähle das bestehende Repository **Kai-022/Remote-Einmannrevi**.
4. Klicke auf **Begin setup**.

Wichtig: Verwende die **Git-Integration**, nicht **Drag & Drop / Direct Upload**. Damit die serverseitige Funktion funktioniert, muss Cloudflare den Quellcode aus GitHub bereitstellen.

## Schritt 2: Projekt-Einstellungen

| Feld | Wert |
|---|---|
| Project name | Freier Name, zum Beispiel aion2-gear-eu |
| Production branch | main |
| Framework preset | None |
| Root directory (advanced) | aion2-gear-checker |
| Build command | exit 0 |
| Build output directory | . |

Der einzelne Punkt bei Build output directory ist beabsichtigt: Die Website liegt direkt im gewählten Unterordner.

Anschließend **Save and Deploy** klicken. Die neue Website erscheint danach unter einer von Cloudflare erzeugten Adresse im Format **https://DEIN-PROJEKT.pages.dev**. DEIN-PROJEKT durch den tatsächlich gewählten Projektnamen ersetzen.

Wenn du bisher ein Pages-Projekt durch das Hochladen von Dateien erstellt hast, bitte ein **neues Git-verbundenes Pages-Projekt** anlegen, da sich der Bereitstellungstyp nicht nachträglich umstellen lässt.

## Schritt 3: Testen

1. Öffne die neue Cloudflare-Website (direkt die Startseite, ohne zusätzlichen Unterordner).
2. Hänge **/api/health** an die neue Cloudflare-Adresse an. Eine JSON-Antwort mit **"ok": true** bestätigt, dass der Datenserver aktiv ist.
3. Öffne die Hauptseite, wähle **Yustiel (Elyos)** und tippe **Taty** zum Testen ein.
4. Probiere danach einen anderen öffentlich auffindbaren EU-Charakter aus.
5. Gear, Item-Werte, Skillbilder und die fünf Daevanion-Boards werden – sofern von NCSOFT bereitgestellt – zusammen übernommen.

Beim ersten Import mit vielen Items und Boards kann der Abruf mehrere Sekunden bis etwa eine halbe Minute dauern. Das Programm ist ausschließlich **lesend** und verändert nichts am Spielkonto.

## Gut zu wissen

- Die alte GitHub-Pages-Adresse bleibt unverändert: https://kai-022.github.io/Remote-Einmannrevi/aion2-gear-checker/
- Auf der alten Adresse ist ohne extra API weiterhin nur der bisherige Testdatensatz nutzbar. Die **neue Cloudflare-Adresse** hat die Live-Schnittstelle automatisch eingebaut.
- Im Browser gespeicherte Daten sind pro Website-Adresse getrennt. Auf der neuen Adresse musst du deinen Charakter erneut importieren.
- Der Worker stellt nur die Wege **/api/health**, **/api/search**, **/api/character** bereit. Er akzeptiert nur feste öffentliche NCSOFT-Endpunkte und verwendet keine Spielkonten oder Zugangsdaten.
- Wenn **/api/health** einen 404-Fehler zeigt, prüfe die Root-/Build-Output-Einstellungen und die Git-Integration.
- Ein 403-/502-Fehler beim Import kann bedeuten, dass NCSOFT Zugriffe von Cloudflare nicht zulässt. Das lässt sich erst nach einem echten Cloudflare-Deployment feststellen. Es gibt keine garantierte dauerhafte offizielle Partner-API für diese öffentlichen Endpunkte.
- Der kostenlose Cloudflare-Plan begrenzt Worker-Anfragen. Ein normaler vollständiger Import umfasst etwa 32 externe NCSOFT-Abfragen und bleibt damit innerhalb der Grenze von 50 Subrequests pro Anfrage.

## Technische Dateien

- **_worker.js**: Such- und Import-Schnittstelle für Cloudflare Pages.
- **_routes.json**: Ruft den Worker nur für /api/* auf und vermeidet Worker-Kosten für statische Dateien.
- **nc-official-import.js**: Erkennt die Cloudflare-Adresse automatisch.
- **tests/cloudflare-worker.mjs**: Offline-Tests für Suchtreffer, Item-Details und Boards.

Cloudflare-Dokumentation: https://developers.cloudflare.com/pages/get-started/git-integration/ und https://developers.cloudflare.com/pages/functions/advanced-mode/ .
