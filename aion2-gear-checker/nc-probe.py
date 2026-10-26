#!/usr/bin/env python3
"""Read-only connectivity probe for AION 2's public EU armory.

Only GET /api/character/info and /api/character/equipment.
Does not download inventories, logins, player sessions, or private data.
Publishes a status SUMMARY, not the character's detailed data.
"""
import datetime as dt
import json
import os
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://aion2.plaync.com/api/character/"
PUBLIC_CHARACTER_ID = "GXf_uDNlKcYJYIHNvVUVBbBYQmXHGspXUlVENSk2RAc="
SERVER_ID = "1305"
OUTPUT = os.path.join(os.path.dirname(__file__), "nc-test-result.json")


def check(endpoint):
    query = urllib.parse.urlencode(
        {"region": "eu", "lang": "en", "characterId": PUBLIC_CHARACTER_ID, "serverId": SERVER_ID}
    )
    request = urllib.request.Request(
        BASE + endpoint + "?" + query,
        headers={"Accept": "application/json", "User-Agent": "Mozilla/5.0 (compatible; AION2GearChecker/0.1)"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=14) as response:
            raw = response.read(1_000_001)
            if len(raw) > 1_000_000:
                return {"ok": False, "http": response.status, "reason": "response_too_large"}
            try:
                body = json.loads(raw)
            except (json.JSONDecodeError, UnicodeDecodeError):
                return {"ok": False, "http": response.status, "reason": "not_json"}
            if not isinstance(body, dict):
                return {"ok": False, "http": response.status, "reason": "unexpected_shape"}
            summary = {"ok": True, "http": response.status, "topLevelFields": list(body.keys())[:25]}
            if endpoint == "info":
                profile = body.get("profile") or body.get("data", {}).get("profile") or {}
                if isinstance(profile, dict):
                    summary["hasProfile"] = bool(profile)
                    summary["hasClassName"] = bool(profile.get("className"))
            else:
                equip = body.get("equipment") or body.get("data", {}).get("equipment") or {}
                slots = equip.get("equipmentList", []) if isinstance(equip, dict) else []
                summary["gearCount"] = len(slots)
                summary["hasSkillData"] = "skill" in body
            return summary
    except urllib.error.HTTPError as error:
        return {"ok": False, "http": error.code, "reason": "upstream_http_error"}
    except urllib.error.URLError as error:
        return {"ok": False, "http": None, "reason": error.reason.__class__.__name__}
    except (TimeoutError, OSError) as error:
        return {"ok": False, "http": None, "reason": error.__class__.__name__}



def check_search():
    query = urllib.parse.urlencode({
        "keyword": "Taty", "serverId": SERVER_ID, "region": "eu",
        "localeInfo": "en-US", "page": 1, "size": 30
    })
    req = urllib.request.Request(
        "https://api-search.plaync.com/aion2global/search/v2/character?" + query,
        headers={"Accept":"application/json","User-Agent":"Mozilla/5.0"},
        method="GET"
    )
    try:
        with urllib.request.urlopen(req, timeout=14) as response:
            data=json.loads(response.read(1_000_000))
            rows=data.get("list") or []
            correct=[r for r in rows if r.get("serverId")==int(SERVER_ID) and
                     str(r.get("name","")).replace("<em>","").replace("</em>","").casefold()=="taty"]
            return {"ok":True,"http":response.status,"matches":len(rows),"exactMatch":bool(correct),
                    "fields":list(rows[0])[:20] if rows else []}
    except urllib.error.HTTPError as e:
        return {"ok":False,"http":e.code}
    except Exception as e:
        return {"ok":False,"reason":type(e).__name__}

def main():
    summary = {
        "checkedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "region": "eu",
        "serverId": SERVER_ID,
        "source": "official NCSoft public character web endpoints",
        "info": check("info"),
        "equipment": check("equipment"),
        "search": check_search(),
        "note": "A positive result confirms server-side accessibility, not browser CORS or unrestricted use."
    }
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf8") as output:
        json.dump(summary, output, ensure_ascii=False, indent=2)
        output.write("\n")
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
