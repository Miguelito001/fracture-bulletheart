import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const bundle=fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8');

for(const [label,text] of [['source',source],['production bundle',bundle]]){
 test(label+': death result returns to hub using dedicated handler',()=>{
  assert.match(text,/home-close[\s\S]{0,160}closeHubModal\(\)/);
  assert.match(text,/function dismiss\(\)[\s\S]{0,180}hubActive[\s\S]{0,100}closeHubModal\(\)/);
 });
 test(label+': main loop is rescheduled even when rendering throws',()=>{
  assert.match(text,/function frame\(t(?::number)?\)[\s\S]*?finally\s*\{\s*requestAnimationFrame\(frame\)/);
  assert.match(text,/FRACTURE: erro no loop principal/);
 });
}
