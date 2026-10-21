import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8');
const fn=(name,next)=>{const start=src.indexOf('function '+name+'('),end=src.indexOf('function '+next+'(',start);assert.ok(start>=0&&end>start,`Missing ${name}`);return src.slice(start,end);};
test('collected materials stack and a full bag refuses a new material',()=>{
 const ctx={run:{cargo:[]},BAG_SLOTS:12,showNotice:()=>{}};
 vm.createContext(ctx);vm.runInContext(fn('addCargo','collect'),ctx);
 assert.equal(ctx.addCargo('scrap',2),true);
 assert.equal(ctx.addCargo('scrap',3),true);
 assert.equal(ctx.run.cargo[0].qty,5);
 for(let i=1;i<12;i++) assert.equal(ctx.addCargo('m'+i,1),true);
 assert.equal(ctx.addCargo('new',1),false);
 assert.equal(ctx.run.cargo.length,12);
});
test('forge checks requirements atomically and never overdraws stash',()=>{
 const ctx={save:{echoes:50,stash:{scrap:4,ember:1}},writeSave:()=>{}};
 vm.createContext(ctx);vm.runInContext(fn('craftNeed','openForge'),ctx);
 assert.equal(ctx.spendCraft({scrap:2,ember:1},30),true);
 assert.equal(ctx.save.echoes,20);
 assert.equal(ctx.save.stash.scrap,2);
 assert.equal(ctx.spendCraft({scrap:2,ember:1},0),false);
 assert.equal(ctx.save.stash.scrap,2);
});
test('successful extraction recovers all cargo, death recovers only 25 percent common',()=>{
 for(const kind of ['extraction','death']){
  const ctx={run:{cargo:[{id:'scrap',qty:8},{id:'rift',qty:3}],scrolls:1,kills:12,level:3,floor:1,echoes:70},save:{stash:{},extractions:0,portalScrolls:0,shopPurchased:1},MATERIALS:{scrap:{name:'Ferro',rare:false},rift:{name:'Fenda',rare:true}},persistEnd:()=>{},writeSave:()=>{},enterHub:()=>{},mode:'playing',showOverlay:()=>{},el:()=>({onclick:null}),sound:()=>{},dismiss:()=>{},escapeHtml:x=>x,clearSession:()=>{}};
  vm.createContext(ctx);vm.runInContext(fn('settleExpedition','win'),ctx);ctx.settleExpedition(kind);
  assert.equal(ctx.save.stash.scrap,kind==='death'?2:8);
  assert.equal(ctx.save.stash.rift??0,kind==='death'?0:3);
  assert.equal(ctx.save.portalScrolls,kind==='death'?0:1);
  assert.equal(ctx.save.extractions,kind==='death'?0:1);
 }
});
