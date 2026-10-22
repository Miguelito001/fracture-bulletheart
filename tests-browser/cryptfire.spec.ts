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
 await page.screenshot({path:'qa/cryptfire-gameplay.png',fullPage:true});
 expect(errors).toEqual([]);
 console.log('CRYPTFIRE_QA',JSON.stringify({before:before.state,metrics}));
});
