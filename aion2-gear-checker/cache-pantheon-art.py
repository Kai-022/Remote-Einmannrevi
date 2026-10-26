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
    "urugugu.webp": "https://media.wikily.gg/d9ef9e2b-cdbf-43cb-a423-2947e69d538d/2026-10-01/d2835208-eb11-4ffe-9a40-491649ccdf47-ad_pic_a_u_urugugu_canyon.webp",
    "draupnir.webp": "https://media.wikily.gg/d9ef9e2b-cdbf-43cb-a423-2947e69d538d/2026-10-01/154b4d2a-920c-4845-8dae-2722d8be10d6-ad_pic_a_u_draupnir.webp",
    "drakan-guruta.webp": "https://media.wikily.gg/d9ef9e2b-cdbf-43cb-a423-2947e69d538d/2026-10-01/3e382c12-bc38-482f-98e1-5fc1cea26c49-ad_pic_a_mob_beritrad_04_v01.webp",
    "veteran-shujakan.webp": "https://media.wikily.gg/d9ef9e2b-cdbf-43cb-a423-2947e69d538d/2026-10-01/d7e9ca22-6a4c-49c7-bb43-6cd2ee06050f-ad_pic_a_mob_lycan_05.webp",
    "dark-shadow-vishwada.webp": "https://media.wikily.gg/d9ef9e2b-cdbf-43cb-a423-2947e69d538d/2026-10-01/1a09535d-f08a-46d6-a1db-b87fdf8b7b5f-ad_pic_a_mob_beritrad_03_v01.webp",
    "divine-ansas.webp": "https://media.wikily.gg/d9ef9e2b-cdbf-43cb-a423-2947e69d538d/2026-10-01/27cd5ce7-231e-4ad2-b1f3-3434cf7b6738-ad_pic_a_mob_guardit_03.webp",
    "visionary-karuka.webp": "https://media.wikily.gg/d9ef9e2b-cdbf-43cb-a423-2947e69d538d/2026-10-01/0a9081f6-7cc9-4cfe-8b89-ed148c15b762-ad_pic_a_mob_lycan_04.webp",
    "harvest-moshav.webp": "https://media.wikily.gg/d9ef9e2b-cdbf-43cb-a423-2947e69d538d/2026-10-01/e29545f7-1e54-4d54-a240-ac5350df1dc9-ad_pic_a_mob_drakanelite_03_v01.webp",
    "blue-wave-kelpina.webp": "https://media.wikily.gg/d9ef9e2b-cdbf-43cb-a423-2947e69d538d/2026-10-01/efc0d6d0-cdeb-4878-aad2-b1f534127509-ad_pic_a_mob_waterele_04_v01.webp",
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
                content = rsp.read(1000001)
            if len(content) < 300 or len(content) > 1000000:
                raise ValueError("unexpected image size")
            if filename.endswith(".webp") and (content[:4] != b"RIFF" or content[8:12] != b"WEBP"):
                raise ValueError("invalid WEBP header")
            if filename.endswith(".png") and content[:8].hex() != "89504e470d0a1a0a":
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
