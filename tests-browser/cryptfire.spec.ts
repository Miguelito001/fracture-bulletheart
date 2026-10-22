import {test,expect} from '@playwright/test';
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
 await page.screenshot({path:'qa/cryptfire-gameplay.png',fullPage:true});
 expect(errors).toEqual([]);
 console.log('CRYPTFIRE_QA',JSON.stringify({before:before.state,metrics}));
});
