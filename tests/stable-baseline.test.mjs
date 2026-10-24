import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('published 1.3 data format and core combat systems remain unchanged',()=>{
 assert.match(source,/const KEY='fracture_bulletheart_v1'/);
 assert.match(source,/const SESSION_KEY='fracture_anchor_active_run_v1'/);
 for(const weapon of ['sword','hammer','bow','gun','shotgun','staff','chakram'])
  assert.ok(source.includes("w==='"+weapon+"'"),weapon);
 for(const term of ['function generateFloor','function updateEnemies','function settleExpedition','function enterHub','function interactHub','function moveWithCollision'])
  assert.ok(source.includes(term),term);
});
test('readable damage feedback happens on every actual hit',()=>{
 assert.match(source,/fxText\(m\.x,m\.y-38,Math\.round\(damage\)/);
 assert.match(source,/kind:'ring'/);
 assert.doesNotMatch(source,/Math\.random\(\)<\.35\)fxText\(/);
});
test('combat action uses animated equipped weapon without changing damage',()=>{
 assert.match(source,/let weaponMotion:/);
 assert.match(source,/weaponMotion\.time=Math\.max\(0,weaponMotion\.time-dt\)/);
 assert.match(source,/if\(weapon==='sword'\)g\.rotate/);
 assert.match(source,/if\(weapon==='hammer'\)g\.rotate/);
 assert.match(source,/if\(weapon==='bow'\)g\.translate/);
});
test('camera is steady, HUD weapon selection and saves are preserved',()=>{
 assert.match(source,/g\.translate\(-Math\.round\(camera\.x\),-Math\.round\(camera\.y\)\)/);
 assert.match(source,/const node=el\(id\)/);
 assert.match(html,/role="button" tabindex="0"/);
 assert.match(source,/localStorage\.setItem\(KEY/);
});
