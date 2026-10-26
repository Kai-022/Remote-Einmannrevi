# AION 2 EU – Live-Import für beliebige Charaktere

Das Frontend liegt unter https://kai-022.github.io/Remote-Einmannrevi/aion2-gear-checker/ und kann wegen Browser-CORS nicht direkt die offizielle NCSOFT-API aufrufen. `nc-live-server.py` bietet zwei **öffentliche, lesende** Routen und fragt ausschließlich die festen NCSOFT-Domains ab.

- `GET /api/search?serverId=1305&name=Taty` – exakte Charaktersuche auf einem EU-Server.
- `GET /api/character?serverId=1305&characterId=...` – Profildaten, Gear, Item-Details, Skills und Daevanion.
- `GET /health` – Funktionsprüfung.

Die serverseitige Suche kontrolliert Server-ID und vollständigen Namen; das Frontend kontrolliert das Profil erneut. Nur öffentliche Profile. Die NCSOFT-Endpunkte sind nicht als dauerhaft unterstützte öffentliche API garantiert.

## Auf einem eigenen Linux-Server starten

1. GitHub-Repository `Kai-022/Remote-Einmannrevi` auf den Linux-Server kopieren.
2. Python 3.10 oder neuer installieren. Weitere Python-Pakete sind nicht nötig.
3. `python3 aion2-gear-checker/nc-live-server.py` ausführen. Die Anwendung lauscht **nur lokal** auf `127.0.0.1:8765`.
4. Mit `curl http://127.0.0.1:8765/health` die lokale Verbindung testen.
5. Für die öffentliche Webseite eine **HTTPS-Domain** und einen Reverse Proxy mit HTTPS/TLS nutzen, z. B. Caddy. Die DNS-Adresse muss auf den Server zeigen.
6. Im Gear Checker **Eigener Live-Datenserver (optional)** aufklappen und `https://deine-api-domain` eintragen, speichern. Danach lassen sich andere EU-Charaktere über Server und Namen laden.

Beispiel-Caddyfile (die Adresse durch die tatsächlich eingerichtete Domain ersetzen):

```caddy
api.example.de {
    reverse_proxy 127.0.0.1:8765
}
```

Das Skript darf nicht direkt unverschlüsselt über das Internet veröffentlicht werden. Ein Reverse Proxy sollte zusätzlich Verbindungs- und Anfrage-Limits setzen. Der Dienst beschränkt die Quelle auf NCSOFT, validiert IDs, begrenzt die Zahl gleichzeitiger Anfragen, verzögert Upstream-Anfragen und nutzt einen kurzen In-Memory-Cache. Es werden keine Zugangsdaten benötigt oder verarbeitet. Ohne HTTPS-Domain und laufenden Prozess ist der Live-Import anderer Charaktere **noch nicht aktiv**.

**Nicht verwechseln:** GitHub Pages kann selbst keinen Python-Server ausführen. Die GitHub-Actions-Testdatei `nc-character-snapshot.json` ist nur eine Momentaufnahme eines einzelnen Charakters.

## Alternative: Docker (z. B. Linux-Server oder Synology Container Manager)

Im Repository-Hauptverzeichnis:

```bash
docker build -t aion2-eu-api -f aion2-gear-checker/Dockerfile aion2-gear-checker
docker run -d --restart unless-stopped --name aion2-eu-api \
  -p 127.0.0.1:8765:8765 aion2-eu-api
```

Auch bei Docker wird eine öffentlich erreichbare HTTPS-Domain mit Reverse Proxy benötigt, damit der Browser auf GitHub Pages die Daten laden darf. Docker allein schaltet die GitHub-Webseite **nicht** für alle Charaktere frei. Wenn du keinen SSH-Zugang hast, kann der Container über die Container-Verwaltung des Hosts eingerichtet werden, sofern sie verfügbar ist.
