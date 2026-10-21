#!/usr/bin/env python3
"""Import real CC0 Kenney isometric assets from a pinned public GitHub mirror.

Run once on a machine with network access. The resulting PNGs are committed and
shipped with the game; no third-party runtime network requests are needed.
"""
from pathlib import Path
from io import BytesIO
from urllib.request import urlopen, Request
from PIL import Image
import hashlib, json

SOURCE_COMMIT = '0d66f7aebf6faf651ab680c9b83b2d8a40e666a1'
BASE = f'https://raw.githubusercontent.com/GeorgeQLe/assets-2d-isometric/{SOURCE_COMMIT}/assets/kenney'
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'kenney'
OUT.mkdir(parents=True, exist_ok=True)

DUNGEON = [
 'stoneTile_S','stoneUneven_S','stone_S','stoneMissingTiles_S','dirtTiles_S','planks_S',
 'stoneWall_S','stoneWall_E','stoneWall_N','stoneWall_W',
 'stoneWallBroken_S','stoneWallAged_S','stoneWallArchway_S','stoneWallDoorOpen_S',
 'stoneWallGate_S','stoneWallHalf_S','stoneWallColumn_S','stoneWallTop_S',
 'stoneColumn_S','stoneColumnWood_S','stoneStep_S','stoneSteps_S',
 'barrel_S','barrelsStacked_S','chestClosed_S','chestOpen_S','woodenCrate_S',
 'woodenCrates_S','tableRoundItemsChairs_S','tableShort_S',
 'woodenSupportBeams_S','stairs_S','stoneWallWindow_S',
]
LIBRARY = [
 'bookcaseBooks_S','bookcaseWideBooks_S','bookcaseWideBooksDesk_S',
 'bookcaseDestroyed_S','bookcaseHalfBooks_S','candleStand_S','candleStandDouble_S',
 'displayCaseSword_S','displayCaseBooks_S','bookStand_S','longTableDecorated_S',
 'floorCarpet_S','floorCarpetSmall_S','wallDoorway_S','libraryChair_S'
]
ASSETS = [('isometric-miniature-dungeon', x) for x in DUNGEON] + [('isometric-miniature-library', x) for x in LIBRARY]
results=[]
for pack, name in ASSETS:
    url=f'{BASE}/{pack}/Angle/{name}.png'
    try:
        raw=urlopen(Request(url,headers={'User-Agent':'FRACTURE-Asset-Importer'}),timeout=25).read()
        img=Image.open(BytesIO(raw)).convert('RGBA')
        if img.size != (256, 512):
            raise ValueError(f'Unexpected dimensions {img.size} for {name}')
        bbox=img.getbbox()
        if not bbox:raise ValueError(f'Fully transparent file: {name}')
        # Preserve original 256x512 registration, downsized to 50%, no lossy composites.
        img=img.resize((128,256),Image.Resampling.LANCZOS)
        target=OUT/f'{name}.png'
        img.save(target,optimize=True)
        results.append({'asset':name,'pack':pack,'source':url,'sha256':hashlib.sha256(raw).hexdigest(),'bbox':bbox,'bytes':len(raw),'output':str(target.name)})
        print(f'KENNEY {pack} {name}: {len(raw)} bytes, bbox={bbox}, saved={target.stat().st_size}',flush=True)
    except Exception as exc:
        raise RuntimeError(f'Could not download verified CC0 asset {url}: {exc}') from exc
(OUT/'manifest.json').write_text(json.dumps({'author':'Kenney','license':'CC0-1.0','sourceRepository':'GeorgeQLe/assets-2d-isometric','sourceCommit':SOURCE_COMMIT,'assets':results},indent=2),encoding='utf8')
print(f'Success: {len(results)} original Kenney CC0 sprites, optimized and bundled.')
