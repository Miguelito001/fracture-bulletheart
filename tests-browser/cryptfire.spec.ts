import {test,expect} from '@playwright/test';
test('real open-source dungeon: startup, authored scene, enemies, frame rendering and input',async({page})=>{
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
 await page.locator('#btn-pack').click();
 await expect(page.locator('#pack-panel')).toBeVisible();
 await page.keyboard.press('i');
 await expect(page.locator('#pack-panel')).toBeHidden();
 // Verify held movement goes through the keyboard handler and does not throw.
 const start=await page.evaluate(()=>(window as any).__torchlineQa.state().player);
 await page.keyboard.down('w');
 await page.waitForTimeout(900);
 await page.keyboard.up('w');
 const stopped=await page.evaluate(()=>(window as any).__torchlineQa.state().player);
 console.log('MOVEMENT_HUD_QA',JSON.stringify({hud,start,stopped}));
 await page.screenshot({path:'qa/cryptfire-gameplay.png',fullPage:true});
 expect(errors).toEqual([]);
 console.log('CRYPTFIRE_QA',JSON.stringify({before:before.state,metrics}));
});
