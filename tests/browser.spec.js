import {test,expect} from '@playwright/test';
import fs from 'node:fs';

test('real Rapier 3D action dungeon: hub, passage collision, combat and extraction',async({page})=>{
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__FRACTURE3D__?.gameStarted===true,{timeout:65000});
 const initial=await page.evaluate(()=>{
  const g=window.__FRACTURE3D__;
  return {mode:g.mode,assets:g.assets.size,physics:!!g.physics,renderer:!!g.renderer.isWebGLRenderer,rooms:g.rooms.length,
    knightClips:g.animationClips.get('kay-knight')?.length||0,skeletonClips:g.animationClips.get('kay-skeleton')?.length||0,heroMixer:!!g.heroMixer};
 });
 expect(initial.mode).toBe('hub');expect(initial.assets).toBeGreaterThanOrEqual(50);expect(initial.renderer).toBe(true);
 expect(initial.heroMixer).toBe(true);expect(initial.knightClips).toBeGreaterThan(2);expect(initial.skeletonClips).toBeGreaterThan(2);
 await page.waitForTimeout(1100);
 await page.screenshot({path:'qa/rebuild/hub-real.png'});
 const origin=await page.evaluate(()=>{
  const a=window.__FRACTURE3D__;return a.playerBody.translation();
 });
 // Physically collide with the wall at the top, not an abstract tile-only check.
 await page.evaluate(()=>{
   const a=window.__FRACTURE3D__;a.playerBody.setNextKinematicTranslation({x:9*2.35,y:1.05,z:2.9});
 });
 await page.keyboard.down('w');await page.waitForTimeout(700);await page.keyboard.up('w');
 const collision=await page.evaluate(()=>window.__FRACTURE3D__.playerBody.translation());
 expect(collision.z).toBeGreaterThan(0.3);
 // Return to the portal with real player input, then interact using E.
 await page.evaluate(()=>{
  const a=window.__FRACTURE3D__;a.playerBody.setNextKinematicTranslation({x:9*2.35-1.6,y:1.05,z:6*2.35+1.6});
 });
 await page.waitForTimeout(100);
 await page.keyboard.press('e');
 await page.waitForTimeout(1250);
 const transition=await page.evaluate(()=>{
   const a=window.__FRACTURE3D__,p=a.playerBody.translation();
   return {mode:a.mode,worldType:a.worldType,point:{x:p.x,z:p.z},
     station:a.nearestStation?.(),errors:a.errors,
     notice:document.getElementById('notice')?.textContent,
     portal:{x:9*2.35,z:6*2.35}};
 });
 console.log('PORTAL_TRANSITION',JSON.stringify(transition),'JS_ERRORS',JSON.stringify(errors));
 expect(transition.mode).toBe('playing');
 const entered=await page.evaluate(()=>{
  const g=window.__FRACTURE3D__;return {type:g.worldType,count:g.rooms.length,physics:!!g.playerCollider,gates:g.gates.length,visited:g.rooms.map(r=>r.layout.id)};
 });
 expect(entered.type).toBe('dungeon');expect(entered.count).toBe(5);
 expect(new Set(entered.visited).size).toBe(5);
 await page.screenshot({path:'qa/rebuild/dungeon-real.png'});
 // Actual combat: create an authentic opponent near the player and fire via mouse.
 const target=await page.evaluate(()=>{
  const game=window.__FRACTURE3D__,p=game.playerBody.translation();
  const room=game.rooms[0];game.spawnEnemy(room,10,7,'orc');
  const enemy=game.enemyUnits.at(-1);enemy.body.setNextKinematicTranslation({x:p.x+2.3,y:1.03,z:p.z});game.physics.step();
  game.aim.set(1,0,0);game.attackCooldown=0;
  return {hp:enemy.hp};
 });
 await page.mouse.click(1400,700);
 await page.waitForTimeout(160);
 const after=await page.evaluate(()=>window.__FRACTURE3D__.enemyUnits.at(-1)?.hp);
 expect(after).toBeLessThan(target.hp);
 await page.screenshot({path:'qa/rebuild/combat-real.png'});
 // Keep combat damage and extraction: pickup persists to safe hub.
 const extracted=await page.evaluate(()=>{
  const app=window.__FRACTURE3D__;app.materials.iron=4;app.materials.embers=2;app.extract();
  return {world:app.worldType,iron:app.progress.inventory.iron,embers:app.progress.inventory.embers,extractions:app.progress.extractions};
 });
 expect(extracted.world).toBe('hub');expect(extracted.iron).toBeGreaterThanOrEqual(4);
 expect(extracted.embers).toBeGreaterThanOrEqual(2);
 expect(errors).toEqual([]);
 console.log('3D_ENGINE_QA',JSON.stringify({initial,origin,collision,entered,target,after,extracted}));
});