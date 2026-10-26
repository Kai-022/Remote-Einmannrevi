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

