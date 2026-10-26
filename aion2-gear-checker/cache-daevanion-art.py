#!/usr/bin/env python3
"""Cache the original AION 2 Cleric skill icons and Daevanion frames locally.

Images are NCSOFT game artwork (not MIT). Source/credit in IMAGE-SOURCES.md.
Only known fixed GitHub repository paths; does not fetch arbitrary URLs.
"""
import json
import os
import pathlib
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
SOURCE = "https://raw.githubusercontent.com/austinsc/aion2-planner/main/"
ICON_DIR = HERE / "nc-icons" / "skills"
FRAME_DIR = HERE / "nc-icons" / "frames"
SNAPSHOT = HERE / "nc-character-snapshot.json"
SKILLS = json.loads(SNAPSHOT.read_text(encoding="utf-8"))["equipment"]["skill"]["skillList"]
IDS = sorted({str(skill["id"]) for skill in SKILLS if isinstance(skill.get("id"), int)})
FRAMES = ["common", "rare", "legend", "unique", "start"]

def fetch(relative, destination, magic):
    if destination.is_file() and destination.stat().st_size > 200:
        return "cached"
    url = SOURCE + relative
    request = urllib.request.Request(url, headers={"User-Agent": "AION2-fan-gear-checker/1.0"})
    with urllib.request.urlopen(request, timeout=25) as response:
        data = response.read(500_001)
    if len(data) > 500_000 or len(data) < 200 or not data.startswith(magic):
        raise ValueError("Invalid image file: " + relative)
    if magic == b"RIFF" and data[8:12] != b"WEBP":
        raise ValueError("Not a WebP image: " + relative)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(data)
    return str(len(data))

def main():
    files = []
    for ident in IDS:
        name = ident + ".webp"
        files.append(("cleric-planner/icons/" + name, ICON_DIR / name, b"RIFF"))
    for grade in FRAMES:
        name = grade + ".png"
        files.append(("shared/sprites/" + name, FRAME_DIR / name, b"\x89PNG\r\n\x1a\n"))
    complete = 0
    for remote, target, magic in files:
        try:
            size = fetch(remote, target, magic)
            complete += 1
            print(target.relative_to(HERE), size)
        except Exception as exc:
            print("MISSING", remote, type(exc).__name__, str(exc)[:120])
    print("CACHED", complete, "OF", len(files))
    if complete != len(files):
        raise SystemExit(2)

if __name__ == "__main__":
    main()
