#!/usr/bin/env python3
"""Cache game-owned Pantheon icons inside the GitHub Pages/Worker asset directory.

Original artwork copyright NCSOFT. This is an unofficial visual reference.
Sources: xtopolis/aion2-static and Wikily AION 2 Pantheon item database.
"""
from pathlib import Path
from urllib.request import Request, urlopen
import sys

DEST = Path(__file__).resolve().parent / "pantheon-icons"
SRC = "https://raw.githubusercontent.com/xtopolis/aion2-static/main/public/icons/pantheon/"
FILES = {
    "artwork.webp": SRC + "artwork.webp",
    "statue.webp": SRC + "statue.webp",
    "colossus-guardian-lord-nahma.webp": SRC + "colossus-guardian-lord-nahma.webp",
    "colossus-ascended-atheron-bound.webp": SRC + "colossus-ascended-atheron-bound.webp",
    "colossus-kaisinels-illusion-bound.webp": SRC + "colossus-kaisinels-illusion-bound.webp",
    "colossus-tyrant-tassin-bound.webp": SRC + "colossus-tyrant-tassin-bound.webp",
    "bakarma.png": "https://media.wikily.gg/d9ef9e2b-cdbf-43cb-a423-2947e69d538d/2026-09-30/cf4d45e8-8781-4a69-9f27-ebba70ea694b-icon_ad_statues_a_u_mob_bakarma_02.png",
    "fire-temple.png": "https://media.wikily.gg/d9ef9e2b-cdbf-43cb-a423-2947e69d538d/2026-09-30/223a26ee-72d7-4af3-bfee-88021e3c0a5a-icon_ad_pic_a_u_fire_temple.png",
}

def main():
    DEST.mkdir(parents=True, exist_ok=True)
    errors = []
    for filename, url in FILES.items():
        path = DEST / filename
        if path.exists() and path.stat().st_size > 300:
            print("cached", filename)
            continue
        try:
            with urlopen(Request(url, headers={"User-Agent": "AION2-GearChecker-Fan-Project/1.0"}), timeout=25) as rsp:
                content = rsp.read(300001)
            if len(content) < 300 or len(content) > 300000:
                raise ValueError("unexpected image size")
            if filename.endswith(".webp") and (content[:4] != b"RIFF" or content[8:12] != b"WEBP"):
                raise ValueError("invalid WEBP header")
            if filename.endswith(".png") and content[:8] != b"\\x89PNG\\r\\n\\x1a\\n":
                raise ValueError("invalid PNG header")
            path.write_bytes(content)
            print("saved", filename, len(content))
        except Exception as exc:
            errors.append(filename)
            print("ERROR", filename, type(exc).__name__, str(exc)[:160])
    print("Pantheon graphics:", len(FILES) - len(errors), "/", len(FILES))
    if errors:
        sys.exit(1)

if __name__ == "__main__":
    main()
