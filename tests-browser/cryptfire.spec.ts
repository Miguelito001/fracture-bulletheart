import {test,expect} from '@playwright/test';
import {PNG} from 'pngjs';
test('real open-source dungeon: startup, authored scene, enemies, frame rendering and input',async({page})=>{
 test.setTimeout(210000);
 const errors:string[]=[];page.on('pageerror',err=>errors.push(err.message));
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>Boolean((window as any).__torchlineQa?.state()?.player),{timeout:80000});
 await expect(page.locator('#game-canvas')).toBeVisible();
 await expect(page.locator('#hud')).toBeVisible();
 const before=await page.evaluate(()=>{const qa=(window as any).__torchlineQa;return {state:qa.state(),metrics:qa.metrics()};});
 expect(before.state.player.hp).toBeGreaterThan(0);
 expect(before.state.monsters).toBeGreaterThan(0);
 expect(before.state.sceneId).toContain('floor-one');
 await page.waitForTimeout(1600);
 const metrics=await page.evaluate(()=>(window as any).__torchlineQa.metrics());
 expect(metrics.drawCalls).toBeGreaterThan(0);
 // Desktop is a combat HUD, not two permanently open menus.
 const hud = await page.evaluate(() => ({
   pack: getComputedStyle(document.querySelector('#pack-panel')!).display,
   toggle: getComputedStyle(document.querySelector('#btn-pack')!).display,
   statsWidth: document.querySelector('.panel-stats')!.getBoundingClientRect().width,
   health: document.getElementById('hp-text')?.textContent
 }));
 expect(hud.pack).toBe('none');
 expect(hud.toggle).not.toBe('none');
 expect(hud.statsWidth).toBeLessThan(265);
 await page.evaluate(() => document.getElementById('btn-pack')?.click());
 await expect(page.locator('#pack-panel')).toBeVisible();
 await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown',{key:'i',bubbles:true})));
 await expect(page.locator('#pack-panel')).toBeHidden();
 // Verify held movement goes through the keyboard handler and does not throw.
 const start=await page.evaluate(()=>(window as any).__torchlineQa.state().player);
 let actualTravel=0;
 const movementSamples: unknown[]=[];
 for(const key of ['w','d','s','a']){
   await page.keyboard.down(key);
   const position=await page.evaluate(()=>{
     const qa=(window as any).__torchlineQa;
     qa.advance(450);
     return qa.state().player;
   });
   await page.keyboard.up(key);
   const travel=Math.hypot(position.x-start.x,position.y-start.y);
   actualTravel=Math.max(actualTravel,travel);
   movementSamples.push({key,position,travel});
   if(actualTravel>0.1)break;
 }
 expect(actualTravel).toBeGreaterThan(0.1);
 console.log('MOVEMENT_HUD_QA',JSON.stringify({hud,start,movementSamples,actualTravel}));
 // The upgraded action controls execute in a REAL Chromium tab, not just in
 // synthetic game tests. W aims the dodge; the contact direction is collision checked.
 await page.keyboard.down('w');
 const dodgeBefore=await page.evaluate(()=>(window as any).__torchlineQa.state().player);
 await page.keyboard.press('Space');
 const dodgeAfter=await page.evaluate(()=>(window as any).__torchlineQa.state().player);
 await page.keyboard.up('w');
 const dodgeDistance=Math.hypot(dodgeAfter.x-dodgeBefore.x,dodgeAfter.y-dodgeBefore.y);
 expect(dodgeDistance).toBeGreaterThan(.12);
 expect(dodgeDistance).toBeLessThan(1.72);
 console.log('LIVE_DODGE_BROWSER_QA',JSON.stringify({dodgeBefore,dodgeAfter,dodgeDistance}));

 await page.screenshot({path:'qa/cryptfire-gameplay.png',fullPage:true});
 // Simulate a late-game screenful of critical hits, deaths, loot and shrine FX.
 // The game MUST remain readable even when the simulation generates 720 events.
 const fx=await page.evaluate(()=>(window as any).__torchlineQa.fxStress(180));
 expect(fx.active).toBeLessThanOrEqual(24);
 const screenshot=await page.screenshot({path:'qa/cryptfire-combat-stress.png',fullPage:true});
 const png=PNG.sync.read(screenshot);
 let white=0,visible=0;
 // Ignore tiny bright HUD labels and count actual saturated screen pixels.
 for(let y=0;y<png.height;y+=3)for(let x=0;x<png.width;x+=3){
   const i=(y*png.width+x)*4,r=png.data[i],g=png.data[i+1],b=png.data[i+2];
   if(r>246&&g>242&&b>232)white++;
   visible++;
 }
 const whiteFraction=white/visible;
 console.log('COMBAT_VISUAL_STRESS_QA',JSON.stringify({fx,whiteFraction,pixels:visible}));
 expect(whiteFraction).toBeLessThan(.12);
 expect(errors).toEqual([]);
 console.log('CRYPTFIRE_QA',JSON.stringify({before:before.state,metrics}));
});
