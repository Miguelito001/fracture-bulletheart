import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const dir=path.resolve(import.meta.dirname,'..');const script=fs.readFileSync(path.join(dir,'src/main.ts'),'utf8');
test('project has self-contained game entrypoint and images',()=>{for(const f of ['index.html','style.css','dist/game.js','assets/wanderer.png','assets/bulwark.png']){assert.ok(fs.existsSync(path.join(dir,f))||f==='assets/bulwark.png'&&fs.existsSync(path.join(dir,'assets/bulwark.png')));}});
test('connected dungeon generation is present',()=>{assert.match(script,/function generateFloor\(/);assert.match(script,/const edges:/);assert.match(script,/connections:/);});
test('distinct melee and ranged weapon paths are present',()=>{for(const x of ["w==='sword'","w==='hammer'","w==='bow'","w==='gun'","w==='shotgun'","w==='staff'","w==='chakram'"])assert.ok(script.includes(x),x);});
test('persistent progress and upgrade selection are implemented',()=>{assert.match(script,/localStorage\.setItem\(KEY/);assert.match(script,/function openLevelUp/);assert.match(script,/function showVault/);});
test('boss has shield and multi-phase thresholds',()=>{assert.match(script,/const at=\[\.70,\.35\]/);assert.match(script,/function damageAnchor/);});
test('multiple room interactions exist',()=>{for(const x of ['shrine','forge','treasure','heal','secret','elite','boss'])assert.ok(script.includes(x),x);});
