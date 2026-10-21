import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const built=fs.readFileSync(path.join(root,'dist/game.js'),'utf8');
const begin=built.indexOf('const battleTrigger =');
const end=built.indexOf('function showNotice(',begin);
assert.ok(begin>=0 && end>begin,'Pure collision and progression functions compiled');
const rules=vm.runInNewContext(`const T=60; const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)); ${built.slice(begin,end)};({battleTrigger,clampCombatExit,slashHits,xpRequirementFor})`);

const room={cx:1000,cy:1000};
test('combat starts only inside the room, not at the corridor opening',()=>{
 assert.equal(rules.battleTrigger(room,{x:1000-6.4*60,y:1000}),false);
 assert.equal(rules.battleTrigger(room,{x:1000-4.5*60,y:1000}),true);
});
test('battle exit gate clamps only outgoing coordinates, leaving lateral movement free',()=>{
 const p={x:room.cx+450,y:room.cy+40}; rules.clampCombatExit(room,p);
 assert.equal(p.x,room.cx+6.35*60);assert.equal(p.y,room.cy+40);
 const q={x:room.cx+80,y:room.cy-500}; rules.clampCombatExit(room,q);
 assert.equal(q.x,room.cx+80);assert.equal(q.y,room.cy-4.35*60);
});
test('sword swing fills the entire sector, not only its maximum-distance arc',()=>{
 const origin={x:0,y:0},facing=0,range=112,arc=Math.PI*.76;
 for(const d of [0,12,40,90,111])assert.equal(rules.slashHits(origin,{x:d,y:0},12,facing,range,arc),true,`target at ${d}`);
 assert.equal(rules.slashHits(origin,{x:-70,y:0},12,facing,range,arc),false,'target behind player');
 assert.equal(rules.slashHits(origin,{x:150,y:0},12,facing,range,arc),false,'target out of range');
 assert.equal(rules.slashHits(origin,{x:85,y:92},24,facing,range,arc),true,'enemy body overlaps edge of cone');
});
test('xp requirements increase faster than level and begin above 100 xp',()=>{
 const a=[1,2,3,4,5,10].map(rules.xpRequirementFor);
 assert.ok(a[0]>=100);for(let i=1;i<a.length;i++)assert.ok(a[i]>a[i-1]);
 assert.ok(a.at(-1)>a[0]*9,'late-game upgrade costs are materially higher');
});
test('loot rarity is no longer fixed and post-room chests are scarce',()=>{
 const source=fs.readFileSync(path.join(root,'src/main.ts'),'utf8');
 assert.match(source,/Math\.random\(\)<\.26\)place\('treasure'\)/);
 assert.match(source,/Math\.random\(\)<\.12\)place\('forge'\)/);
 assert.match(source,/r\.kind==='elite'\?\.12:\.035/);
 assert.doesNotMatch(source,/\['treasure','elite','shrine','forge'/);
});
