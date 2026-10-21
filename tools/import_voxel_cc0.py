#!/usr/bin/env python3
"""Import and bundle Kenney CC0 Isometric Blocks sprites for FRACTURE.
Pinned, versioned upstream commit. Runtime does not fetch third-party files.
https://kenney-assets.itch.io/isometric-blocks - CC0 1.0 Universal
"""
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.parse import quote
import struct
import hashlib

ROOT=Path(__file__).resolve().parent.parent
DEST=ROOT/"assets"/"voxel"
PIN="0d66f7aebf6faf651ab680c9b83b2d8a40e666a1"
BASE="https://raw.githubusercontent.com/GeorgeQLe/assets-2d-isometric/"+PIN+"/assets/kenney/isometric-blocks/PNG/Voxel%20tiles/"
IDS=[f'{i:02}' for i in range(1,56)]
DEST.mkdir(parents=True, exist_ok=True)
checks=[]
for id in IDS:
    name="voxelTile_"+id+".png"
    to=DEST/name
    if to.is_file():
        data=to.read_bytes()
    else:
        req=Request(BASE+quote(name),headers={"User-Agent":"FRACTURE-Open-Asset-Importer/1.0"})
        with urlopen(req,timeout=35) as resp:data=resp.read()
        to.write_bytes(data)
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):raise RuntimeError(name+" invalid PNG")
    w,h=struct.unpack(">II",data[16:24])
    if w<24 or w>1024 or h<24 or h>1024:raise RuntimeError(name+" invalid dimensions")
    checks.append((name,len(data),hashlib.sha256(data).hexdigest()))
    print(name,w,h,len(data))
(DEST/"SOURCE_AND_LICENSE.txt").write_text(
"Kenney - Isometric Blocks\n"
"Source: https://kenney-assets.itch.io/isometric-blocks\n"
"License: Creative Commons Zero 1.0 Universal (CC0-1.0)\n"
"Mirror: https://github.com/GeorgeQLe/assets-2d-isometric\n"
"Mirror commit: "+PIN+"\n"
"Images: 55 individually extracted Voxel tiles sprites\n"
"All assets bundled in the repository, no runtime network downloads.\n"
"Full official notice: https://creativecommons.org/publicdomain/zero/1.0/\n",
encoding="utf-8")
print("VALIDATED",len(checks),"CC0 PNGs",sum(x[1] for x in checks),"bytes")
