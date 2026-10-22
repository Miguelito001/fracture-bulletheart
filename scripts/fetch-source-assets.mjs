// Pinned and verified MIT-licensed open-source game assets. Download at build only.
// Original: https://github.com/cedrickchee/torchline-dungeon ; revision cf050b9ef0cfa4ebd5015574c19f179b47bffee1
import {mkdir,stat,writeFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
const REV='cf050b9ef0cfa4ebd5015574c19f179b47bffee1';
const FILES=[{"path":"assets/atlas/actor-sprites-atlas.png","size":11898550},{"path":"assets/atlas/dungeon-atlas.png","size":138504},{"path":"assets/atlas/environment-floor-atlas.png","size":323137},{"path":"assets/atlas/environment-wall-kit-atlas.png","size":1639838},{"path":"assets/atlas/environment-wall-spans-atlas.png","size":1220345},{"path":"assets/atlas/fx-atlas.png","size":20417},{"path":"assets/atlas/loot-atlas.png","size":30136},{"path":"assets/atlas/raster-asset-sheet.png","size":2510408},{"path":"assets/atlas/raster-hotbar-texture.png","size":110398},{"path":"assets/atlas/raster-left-panel-chrome.png","size":117832},{"path":"assets/atlas/raster-panel-texture.png","size":83099},{"path":"assets/atlas/raster-right-panel-chrome.png","size":109807},{"path":"assets/atlas/raster-sprites-atlas.png","size":770371},{"path":"assets/atlas/raster-ui-armor.png","size":14547},{"path":"assets/atlas/raster-ui-charm.png","size":10714},{"path":"assets/atlas/raster-ui-gold.png","size":15101},{"path":"assets/atlas/raster-ui-portrait.png","size":32816},{"path":"assets/atlas/raster-ui-potion.png","size":11847},{"path":"assets/atlas/raster-ui-rune.png","size":16709},{"path":"assets/atlas/raster-ui-shrine.png","size":15843},{"path":"assets/atlas/raster-ui-stairs.png","size":16123},{"path":"assets/atlas/raster-ui-weapon.png","size":11203},{"path":"assets/atlas/ui-atlas.png","size":29940},{"path":"assets/atlas/walls-doors-atlas.png","size":135401},{"path":"assets/audio/ambience-crypt-loop.ogg","size":42673},{"path":"assets/audio/buff-expire.ogg","size":4039},{"path":"assets/audio/door-open.ogg","size":4161},{"path":"assets/audio/elite-alert.ogg","size":4435},{"path":"assets/audio/floor-transition.ogg","size":4346},{"path":"assets/audio/footstep-stone-1.ogg","size":3758},{"path":"assets/audio/footstep-stone-2.ogg","size":3806},{"path":"assets/audio/footstep-stone-3.ogg","size":3733},{"path":"assets/audio/hit-heavy.ogg","size":3862},{"path":"assets/audio/hit-light.ogg","size":3763},{"path":"assets/audio/load-confirm.ogg","size":3862},{"path":"assets/audio/loot-pickup.ogg","size":3964},{"path":"assets/audio/monster-death.ogg","size":4098},{"path":"assets/audio/pause-open.ogg","size":3918},{"path":"assets/audio/potion-drink.ogg","size":3904},{"path":"assets/audio/rare-item-drop.ogg","size":4504},{"path":"assets/audio/save-confirm.ogg","size":3853},{"path":"assets/audio/shrine-activate.ogg","size":4523},{"path":"assets/audio/skill-select.ogg","size":4164},{"path":"assets/audio/torch-loop.ogg","size":33981}];
const root=process.cwd();
async function ensure(file){
 const target=join(root,file.path);
 try{if((await stat(target)).size===file.size)return;}catch{}
 await mkdir(dirname(target),{recursive:true});
 const url='https://raw.githubusercontent.com/cedrickchee/torchline-dungeon/'+REV+'/'+file.path;
 let last;
 for(let attempt=0;attempt<4;attempt++){
  try{
   const resp=await fetch(url,{signal:AbortSignal.timeout(110000)});
   if(!resp.ok)throw Error(file.path+' download HTTP '+resp.status);
   const buf=Buffer.from(await resp.arrayBuffer());
   if(buf.length!==file.size)throw Error(file.path+' mismatch '+buf.length+' != '+file.size);
   if(file.path.endsWith('.png')&&buf.subarray(1,4).toString('ascii')!=='PNG')throw Error(file.path+' invalid PNG');
   if(file.path.endsWith('.ogg')&&buf.subarray(0,4).toString('ascii')!=='OggS')throw Error(file.path+' invalid Ogg audio');
   await writeFile(target,buf);return;
  }catch(e){last=e;await new Promise(r=>setTimeout(r,750*(attempt+1)));}
 }
 throw last;
}
let i=0;await Promise.all(Array.from({length:6},async()=>{while(i<FILES.length){const item=FILES[i++];await ensure(item);}}));
console.log('FRACTURE CRYPTFIRE: '+FILES.length+' pinned MIT art/sound files verified.');
