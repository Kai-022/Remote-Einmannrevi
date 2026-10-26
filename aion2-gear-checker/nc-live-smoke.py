#!/usr/bin/env python3
"""GitHub Actions smoke check: report public search shape, without publishing IDs."""
import importlib.util
import json
import os
import re

path = os.path.join(os.path.dirname(__file__), "nc-live-server.py")
spec = importlib.util.spec_from_file_location("nc_live", path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
result = {"syntax": True}
try:
    raw = mod.query_json(mod.SEARCH, {
        "keyword": "Taty", "region": "eu", "localeInfo": "en-US",
        "serverId": 1305, "page": 1, "size": 100
    })
    rows = raw.get("list", [])
    result["searchCount"] = len(rows)
    result["firstResults"] = [{
        "serverId": str(e.get("serverId", "")),
        "name": re.sub(r"<[^>]*>", "", e.get("name", ""))[:60],
        "hasCharacterId": bool(e.get("characterId"))
    } for e in rows[:6] if isinstance(e, dict)]
    result["exactMatches"] = len(mod.search_character(1305, "Taty")["characters"])
except Exception as error:
    result["errorType"] = type(error).__name__
output = os.path.join(os.path.dirname(__file__), "nc-live-search-result.json")
with open(output, "w", encoding="utf-8") as fp:
    json.dump(result, fp, ensure_ascii=False, indent=2)
print(json.dumps(result, ensure_ascii=False))
