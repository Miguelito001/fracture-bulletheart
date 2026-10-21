#!/usr/bin/env python3
"""Kenney Dungeon Pack 2.3 CC0 eight-direction actor art; pinned source."""
from pathlib import Path
from io import BytesIO
from urllib.request import urlopen,Request
from PIL import Image
import hashlib,json
COMMIT='45df48c4d45f8716216b1a9e22df0b69cd9f5932'
BASE=f'https://raw.githubusercontent.com/ETdoFresh/kenney.nl/{COMMIT}/kenneyDungeonPack_2.3/Characters/Male'
OUT=Path(__file__).resolve().parent.parent/'assets'/'kenney'/'characters'
OUT.mkdir(parents=True,exist_ok=True)
results=[]
for direction in range(8):
 for frame in ['Idle0','Run0','Run2','Run4','Run6','Run8']:
  name=f'Male_{direction}_{frame}.png';url=f'{BASE}/{name}'
  try:
   raw=urlopen(Request(url,headers={'User-Agent':'FRACTURE-CC0-Importer'}),timeout=25).read()
   a=Image.open(BytesIO(raw)).convert('RGBA');bbox=a.getbbox()
   if not bbox:raise ValueError('transparent')
   a.thumbnail((256,512),Image.Resampling.LANCZOS)
   a.save(OUT/name,optimize=True)
   results.append({'file':name,'url':url,'sha256':hashlib.sha256(raw).hexdigest(),'bbox':bbox,'dimensions':a.size})
   print('CHAR',name,'bbox',bbox,flush=True)
  except Exception as ex:raise RuntimeError(f'Error importing Kenney CC0 actor {url}: {ex}') from ex
(OUT/'manifest.json').write_text(json.dumps({'author':'Kenney','license':'CC0-1.0','source':'Kenney Dungeon Pack 2.3','commit':COMMIT,'files':results},indent=2),encoding='utf8')
print(f'Imported {len(results)} licensed eight-direction animation sprites',flush=True)
