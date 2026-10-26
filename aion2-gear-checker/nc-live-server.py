#!/usr/bin/env python3
"""AION 2 EU read-only API for the public Gear Checker."""
import html
import json
import os
import re
import threading
import time
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = os.getenv("AION_API_HOST", "127.0.0.1")
PORT = int(os.getenv("AION_API_PORT", "8765"))
SITE = "https://aion2.plaync.com/api/character/"
SEARCH = "https://api-search.plaync.com/aion2global/search/v2/character"
ALLOWED_ORIGIN = "https://kai-022.github.io"
LOCK = threading.Lock()
LAST = [0.0]
CACHE = {}


def query_json(endpoint, params, ttl=240):
    """Bounded, throttled GET to known NCSOFT domains only."""
    url = endpoint + "?" + urllib.parse.urlencode(params)
    now = time.monotonic()
    with LOCK:
        stored = CACHE.get(url)
        if stored and now - stored[0] < ttl:
            return stored[1]
        pause = max(0.0, 1.0 - (now - LAST[0]))
        if pause:
            time.sleep(pause)
        LAST[0] = time.monotonic()
    request = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; EUCharacterGear/1.0)",
        "Accept": "application/json"
    })
    with urllib.request.urlopen(request, timeout=15) as response:
        body = response.read(2_000_001)
        if response.status != 200 or len(body) > 2_000_000:
            raise ValueError("Ungültige Antwort der Spielseite")
        result = json.loads(body)
    if not isinstance(result, dict):
        raise ValueError("Unerwartete Charakterdaten")
    with LOCK:
        if len(CACHE) > 1000:
            CACHE.clear()
        CACHE[url] = (time.monotonic(), result)
    return result


def valid_server(value):
    sid = int(value)
    if sid not in list(range(1301, 1324)) + list(range(2301, 2324)):
        raise ValueError("Unbekannter EU-Server")
    return sid


def base_query(sid, cid):
    return {"region": "eu", "lang": "en",
            "serverId": sid, "characterId": cid}



def search_character(sid, name):
    sid = valid_server(sid)
    name = name.strip()
    if not 2 <= len(name) <= 45:
        raise ValueError("Charaktername muss 2 bis 45 Zeichen haben")
    data = query_json(SEARCH, {
        "keyword": name, "region": "eu", "localeInfo": "en-US",
        "serverId": sid, "page": 1, "size": 100
    }, ttl=120)
    found = []
    for entry in data.get("list", [])[:100]:
        if not isinstance(entry, dict):
            continue
        raw_name = re.sub(r"<[^>]*>", "", str(entry.get("name", "")))
        clean_name = html.unescape(raw_name).strip()
        if (clean_name.casefold() != name.casefold() or
                str(entry.get("serverId")) != str(sid)):
            continue
        cid = str(entry.get("characterId", ""))
        if not re.fullmatch(r"[a-zA-Z0-9_+=/\\-]{8,256}", cid):
            continue
        found.append({
            "name": clean_name, "serverId": sid, "characterId": cid,
            "className": str(entry.get("className", "")),
            "level": entry.get("level", 0)
        })
    return {"characters": found[:20]}



def get_character(sid, cid):
    sid = valid_server(sid)
    if not re.fullmatch(r"[a-zA-Z0-9_+=/\\-]{8,256}", cid):
        raise ValueError("Ungültige Charakter-ID")
    base = base_query(sid, cid)
    info = query_json(SITE + "info", base)
    equipment = query_json(SITE + "equipment", base)
    profile = info.get("profile", {})
    if not isinstance(profile, dict) or not profile.get("characterName"):
        raise ValueError("Charakter wurde nicht gefunden")
    if str(profile.get("serverId", sid)) != str(sid):
        raise ValueError("Server des Charakters stimmt nicht überein")
    equipment_block = equipment.get("equipment", {})
    slots = equipment_block.get("equipmentList", []) if isinstance(equipment_block, dict) else []
    if not isinstance(slots, list) or len(slots) > 80:
        raise ValueError("Ungültige Ausrüstungsliste")
    items = {}
    errors = []
    for slot in slots:
        if not isinstance(slot, dict):
            continue
        try:
            item_id = int(slot["id"])
            position = int(slot["slotPos"])
            enchant = int(slot.get("enchantLevel") or 0)
            exceed = int(slot.get("exceedLevel") or 0)
            if not (0 < item_id < 2**54 and 0 <= position < 1000 and
                    0 <= enchant <= 100 and 0 <= exceed <= 100):
                continue
            detail = query_json(SITE + "equipment/item", {
                **base, "id": item_id, "slotPos": position,
                "enchantLevel": enchant, "exceedLevel": exceed
            })
            items[str(position)] = detail
        except (KeyError, ValueError, OSError, TimeoutError) as exc:
            errors.append({"slotPos": slot.get("slotPos"), "reason": type(exc).__name__})
    boards = {}
    daevanion = info.get("daevanion", {})
    board_list = daevanion.get("boardList", []) if isinstance(daevanion, dict) else []
    for board in board_list[:5]:
        try:
            bid = int(board.get("id", 0))
            if not 1 <= bid <= 10000:
                continue
            boards[str(bid)] = query_json(SITE + "daevanion/detail", {
                **base, "boardId": bid
            })
        except (ValueError, OSError, TimeoutError):
            continue
    return {
        "version": 1, "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "profileUrl": "https://aion2.plaync.com/en-us/characters/" + str(sid) +
        "/" + urllib.parse.quote(cid, safe="") + "?region=eu",
        "region": "eu", "serverId": str(sid), "characterId": cid,
        "info": info, "equipment": equipment, "items": items,
        "daevanionBoards": boards, "itemErrors": errors,
        "source": "NCSOFT public EU character endpoints"
    }



VISITS = {}
WORKERS = threading.BoundedSemaphore(2)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # avoid logging character IDs and usernames

    def send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        if self.headers.get("Origin") == ALLOWED_ORIGIN:
            self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
            self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urllib.parse.urlsplit(self.path)
        if path.path == "/health":
            return self.send_json(200, {"ok": True, "region": "eu"})
        if path.path not in ("/api/search", "/api/character"):
            return self.send_json(404, {"error": "Unbekannte Route"})
        params = urllib.parse.parse_qs(path.query, keep_blank_values=False)
        if len(path.query) > 1200:
            return self.send_json(400, {"error": "Anfrage zu lang"})
        ip = self.client_address[0]
        now = time.monotonic()
        with LOCK:
            last = VISITS.get(ip, 0)
            if now - last >= 3:
                VISITS[ip] = now
            if len(VISITS) > 500:
                VISITS.clear()
        if now - last < 3:
            return self.send_json(429, {"error": "Bitte kurz warten und erneut versuchen"})
        if not WORKERS.acquire(blocking=False):
            return self.send_json(503, {"error": "Server ausgelastet"})
        try:
            sid = (params.get("serverId") or [""])[0]
            if path.path == "/api/search":
                name = (params.get("name") or [""])[0]
                result = search_character(sid, name)
            else:
                cid = (params.get("characterId") or [""])[0]
                result = get_character(sid, cid)
            return self.send_json(200, result)
        except ValueError as err:
            return self.send_json(400, {"error": str(err)})
        except Exception:
            return self.send_json(502, {"error": "NCSOFT ist momentan nicht erreichbar"})
        finally:
            WORKERS.release()


if __name__ == "__main__":
    print(f"AION EU API at http://{HOST}:{PORT} (TLS reverse proxy required for public use)")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
