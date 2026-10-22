// 0x72 DungeonTileset II v1.7 — CC0-1.0. Exact pinned GitHub mirror; no runtime network calls.
// Original creator: https://0x72.itch.io/dungeontileset-ii
// Mirror (under Apache-2.0 game client): https://github.com/marceloferreira357/bun-crawler-client
import {mkdir,stat,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
const pinned='2a00fd56341cb2278bc66350d5f71f4abfadef32';
const files=[{"file":"big_demon_idle_anim_f0.png","size":497},{"file":"big_demon_idle_anim_f1.png","size":510},{"file":"big_demon_idle_anim_f2.png","size":496},{"file":"big_demon_idle_anim_f3.png","size":481},{"file":"big_demon_run_anim_f0.png","size":478},{"file":"big_demon_run_anim_f1.png","size":515},{"file":"big_demon_run_anim_f2.png","size":531},{"file":"big_demon_run_anim_f3.png","size":499},{"file":"chest_full_open_anim_f0.png","size":374},{"file":"chest_full_open_anim_f1.png","size":430},{"file":"chest_full_open_anim_f2.png","size":445},{"file":"chort_idle_anim_f0.png","size":284},{"file":"chort_idle_anim_f1.png","size":242},{"file":"chort_idle_anim_f2.png","size":261},{"file":"chort_idle_anim_f3.png","size":308},{"file":"chort_run_anim_f0.png","size":298},{"file":"chort_run_anim_f1.png","size":300},{"file":"chort_run_anim_f2.png","size":310},{"file":"chort_run_anim_f3.png","size":285},{"file":"coin_anim_f0.png","size":132},{"file":"coin_anim_f1.png","size":111},{"file":"coin_anim_f2.png","size":98},{"file":"coin_anim_f3.png","size":121},{"file":"column.png","size":601},{"file":"column_wall.png","size":780},{"file":"crate.png","size":229},{"file":"doors_leaf_closed.png","size":858},{"file":"doors_leaf_open.png","size":651},{"file":"flask_blue.png","size":243},{"file":"flask_red.png","size":242},{"file":"floor_1.png","size":193},{"file":"floor_2.png","size":267},{"file":"floor_3.png","size":243},{"file":"floor_4.png","size":257},{"file":"floor_5.png","size":232},{"file":"floor_6.png","size":259},{"file":"floor_7.png","size":267},{"file":"floor_8.png","size":251},{"file":"floor_spikes_anim_f0.png","size":221},{"file":"floor_spikes_anim_f1.png","size":227},{"file":"floor_spikes_anim_f2.png","size":258},{"file":"floor_spikes_anim_f3.png","size":236},{"file":"floor_stairs.png","size":285},{"file":"goblin_idle_anim_f0.png","size":204},{"file":"goblin_idle_anim_f1.png","size":203},{"file":"goblin_idle_anim_f2.png","size":178},{"file":"goblin_idle_anim_f3.png","size":203},{"file":"goblin_run_anim_f0.png","size":215},{"file":"goblin_run_anim_f1.png","size":216},{"file":"goblin_run_anim_f2.png","size":237},{"file":"goblin_run_anim_f3.png","size":232},{"file":"imp_idle_anim_f0.png","size":234},{"file":"imp_idle_anim_f1.png","size":221},{"file":"imp_idle_anim_f2.png","size":196},{"file":"imp_idle_anim_f3.png","size":221},{"file":"imp_run_anim_f0.png","size":230},{"file":"imp_run_anim_f1.png","size":218},{"file":"imp_run_anim_f2.png","size":227},{"file":"imp_run_anim_f3.png","size":233},{"file":"knight_m_hit_anim_f0.png","size":336},{"file":"knight_m_idle_anim_f0.png","size":347},{"file":"knight_m_idle_anim_f1.png","size":325},{"file":"knight_m_idle_anim_f2.png","size":332},{"file":"knight_m_idle_anim_f3.png","size":341},{"file":"knight_m_run_anim_f0.png","size":348},{"file":"knight_m_run_anim_f1.png","size":351},{"file":"knight_m_run_anim_f2.png","size":347},{"file":"knight_m_run_anim_f3.png","size":348},{"file":"skelet_idle_anim_f0.png","size":235},{"file":"skelet_idle_anim_f1.png","size":214},{"file":"skelet_idle_anim_f2.png","size":200},{"file":"skelet_idle_anim_f3.png","size":215},{"file":"skelet_run_anim_f0.png","size":233},{"file":"skelet_run_anim_f1.png","size":231},{"file":"skelet_run_anim_f2.png","size":231},{"file":"skelet_run_anim_f3.png","size":216},{"file":"skull.png","size":180},{"file":"wall_banner_blue.png","size":385},{"file":"wall_banner_red.png","size":385},{"file":"wall_left.png","size":212},{"file":"wall_mid.png","size":208},{"file":"wall_right.png","size":207},{"file":"wall_top_left.png","size":154},{"file":"wall_top_mid.png","size":156},{"file":"wall_top_right.png","size":156},{"file":"weapon_bow.png","size":325},{"file":"weapon_hammer.png","size":181},{"file":"weapon_knight_sword.png","size":203},{"file":"weapon_regular_sword.png","size":204}];
let cursor=0;
async function download(asset){
 const target=join(process.cwd(),'assets','pixel',asset.file);
 try{if((await stat(target)).size===asset.size)return;}catch{}
 await mkdir(dirname(target),{recursive:true});
 const url='https://raw.githubusercontent.com/marceloferreira357/bun-crawler-client/'+pinned+'/public/sprites/0x72_DungeonTilesetII_v1.7/frames/'+asset.file;
 let failure;
 for(let attempt=0;attempt<4;attempt++){
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout(40000)});
   if(!response.ok)throw Error('HTTP '+response.status+' '+asset.file);
   const data=Buffer.from(await response.arrayBuffer());
   if(data.length!==asset.size)throw Error('Asset byte-length mismatch '+asset.file);
   if(data.subarray(1,4).toString('ascii')!=='PNG')throw Error('Not PNG: '+asset.file);
   await writeFile(target,data);return;
  }catch(error){failure=error;await new Promise(r=>setTimeout(r,(attempt+1)*400));}
 }
 throw failure;
}
await Promise.all(Array.from({length:10},async()=>{while(cursor<files.length){const current=files[cursor++];await download(current);}}));
console.log('FRACTURE PIXEL: verified '+files.length+' genuine 0x72 CC0 PNGs');
