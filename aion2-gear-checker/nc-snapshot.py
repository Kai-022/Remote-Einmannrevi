#!/usr/bin/env python3
"""Read a single public EU character profile from NC's official armory, rate limited.

No credentials. Only public character info, equipment and equipped-item details.
Generated JSON is a snapshot: it is NOT updated automatically by GitHub Pages.
"""
import datetime as dt
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.realpath(__file__))
DEST = os.path.join(ROOT, "nc-character-snapshot.json")
BASE = "https://aion2.plaync.com/api/character/"
REGION = "eu"
SERVER_ID = "1305"
CHARACTER_ID = "GXf_uDNlKcYJYIHNvVUVBbBYQmXHGspXUlVENSk2RAc="
CHARACTER_URL = ("https://aion2.plaync.com/en-us/characters/" +
                 SERVER_ID + "/" + urllib.parse.quote(CHARACTER_ID, safe="") + "?region=eu")
last_call = [0.0]


def get(endpoint, query):
    elapsed = time.monotonic() - last_call[0]
    if elapsed < 1.1:
        time.sleep(1.1 - elapsed)
    last_call[0] = time.monotonic()
    params = {"region": REGION, "lang": "en", "characterId": CHARACTER_ID, "serverId": SERVER_ID}
    params.update(query)
    request = urllib.request.Request(
        BASE + endpoint + "?" + urllib.parse.urlencode(params),
        headers={"User-Agent": "Mozilla/5.0 (compatible; AION2GearChecker/0.1)", "Accept": "application/json"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            raw = response.read(2_000_001)
            if response.status != 200 or len(raw) > 2_000_000:
                return None, "bad_response"
            result = json.loads(raw)
            if isinstance(result, dict):
                return result, None
            return None, "unexpected_json"
    except urllib.error.HTTPError as e:
        return None, "http_" + str(e.code)
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, json.JSONDecodeError) as e:
        return None, type(e).__name__


def main():
    info, info_error = get("info", {})
    equipment, equip_error = get("equipment", {})
    if info_error or equip_error:
        print("Cannot make profile snapshot:", info_error, equip_error)
        return
    equipment_block = equipment.get("equipment", {})
    if not isinstance(equipment_block, dict):
        print("Unexpected equipment shape")
        return
    slots = equipment_block.get("equipmentList", [])
    if not isinstance(slots, list) or len(slots) > 80:
        print("Unexpected slot count")
        return
    details = {}
    failures = []
    # Read each equipped item exactly once. No catalog crawling.
    for slot in slots:
        if not isinstance(slot, dict):
            continue
        item_id, pos = slot.get("id"), slot.get("slotPos")
        if item_id is None or pos is None:
            continue
        try:
            item_id, pos = int(item_id), int(pos)
            enchant = int(slot.get("enchantLevel") or 0)
            exceed = int(slot.get("exceedLevel") or 0)
            if not (0 < item_id < 2**54 and 0 <= pos <= 1000 and 0 <= enchant <= 100 and 0 <= exceed <= 100):
                continue
        except (TypeError, ValueError):
            continue
        obj, err = get("equipment/item", {
            "id": item_id, "slotPos": pos,
            "enchantLevel": enchant, "exceedLevel": exceed
        })
        if err is not None:
            failures.append({"slotPos": pos, "reason": err})
            continue
        details[str(pos)] = obj
    boards = {}
    daevanion = info.get("daevanion") or {}
    candidates = (daevanion.get("boardList") or daevanion.get("boards") or
                  daevanion.get("list") or []) if isinstance(daevanion, dict) else []
    for board in candidates[:5]:
        if not isinstance(board, dict):
            continue
        bid = board.get("id") or board.get("boardId")
        try:
            bid = int(bid)
            if bid < 1 or bid > 10000:
                continue
        except (TypeError, ValueError):
            continue
        obj, err = get("daevanion/detail", {"boardId": bid})
        if obj:
            boards[str(bid)] = obj
        else:
            print("Board not loaded:", bid, err)
    out = {
        "version": 1,
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "profileUrl": CHARACTER_URL,
        "region": REGION, "serverId": SERVER_ID, "characterId": CHARACTER_ID,
        "info": info, "equipment": equipment, "items": details,
        "daevanionBoards": boards, "itemErrors": failures,
        "source": "public NCSOFT character website, read-only"
    }
    with open(DEST, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    print(json.dumps({
        "success": True, "slots": len(slots), "detailedItems": len(details),
        "failedItems": len(failures), "boards": len(boards),
        "size": os.path.getsize(DEST), "hasSkill": "skill" in equipment
    }))


if __name__ == "__main__":
    main()
