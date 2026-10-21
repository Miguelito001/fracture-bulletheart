import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

// Verified public-domain, self-contained .glb models. Pinned to an audited commit.
// Publisher: Kenney.nl (CC0); redistribution/conversion: Hidencod/tge-assets (CC0).
const COMMIT = '4920991271cb3079006478ff77b851e1d04342b3';
export const MODELS = [
  'banner','barrel','chair','character-human','character-orc','chest','coin',
  'column','dirt','floor','floor-detail','gate','key','pot','potion',
  'rocks','shield-rectangle','stairs','stones','table','trap',
  'wall','wall-half','wall-narrow','wall-opening','weapon-sword',
  'wood-structure','wood-support'
];
const output = new URL('../public/models/', import.meta.url);
await mkdir(output,{recursive:true});
for (const name of MODELS) {
  const file = new URL(`${name}.glb`,output);
  try { const info=await stat(file); if(info.size>10_000) continue; } catch {}
  const url=`https://raw.githubusercontent.com/Hidencod/tge-assets/${COMMIT}/packs/mini-dungeon/${name}.glb`;
  let ok=false;
  for(let retry=0;retry<3&&!ok;retry++){
    try {
      const response=await fetch(url,{signal:AbortSignal.timeout(35_000)});
      if(!response.ok) throw Error(`${response.status} ${name}`);
      const data=Buffer.from(await response.arrayBuffer());
      if(data.length<1000||data.toString('ascii',0,4)!=='glTF')throw Error(`Invalid GLB ${name}`);
      await writeFile(file,data);ok=true;
    } catch(e) { if(retry===2)throw e;await new Promise(r=>setTimeout(r,1000*(retry+1))); }
  }
}
console.log(`CC0 3D models verified: ${MODELS.length} / ${MODELS.length}`);