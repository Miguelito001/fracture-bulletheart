import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');
const src=fs.readFileSync(path.join(root,'src/main.ts'),'utf8');
const js=fs.readFileSync(path.join(root,'dist/game.js'),'utf8');
const start=js.indexOf('function xpRequirementFor(');
const end=js.indexOf('function showNotice(',start);
assert.ok(start>=0 && end>start);
const rules=vm.runInNewContext(js.slice(start,end)+';({commonHpScale,commonCadenceScale,hammerFalloff})');
test('hammer slam has full-damage sweet spot but tapering damage and finite reach',()=>{
  assert.equal(rules.hammerFalloff(0,20,94),1);
  assert.equal(rules.hammerFalloff(40,20,94),1);
  const edge=rules.hammerFalloff(95,10,94);
  assert.ok(edge>.4 && edge<1);
  assert.equal(rules.hammerFalloff(150,10,94),0);
  assert.match(src,/attackCD=1\.07\/run\.attackRate/);
  assert.doesNotMatch(src,/67\*power,'hammer'/);
});
test('normal enemies scale gradually with character level and regions, capped for fairness',()=>{
 const early=rules.commonHpScale(1,1),mid=rules.commonHpScale(2,7),late=rules.commonHpScale(5,25);
 assert.equal(early,1);assert.ok(mid>early);assert.ok(late>mid);
 assert.ok(rules.commonHpScale(5,200)<=1.8*(1+4*.29)+.00001);
 assert.ok(rules.commonCadenceScale(5,100)<=1.36+1e-9);
});
test('harder champions appear visually, while the existing boss phases remain intact',()=>{
  assert.match(src,/champion=!isBoss/);
  assert.match(src,/if\(m\.champion\)/);
  assert.match(src,/m\.kind==='boss'&&m\.shield>0/);
  assert.match(src,/m\.phase\+\+/);
});
test('real Lucide asset icons and the license notice are in the source and compiled build',()=>{
 const ids=['sword','hammer','bow-arrow','crosshair','target','zap','orbit'];
 for(const id of ids){
  for(const base of ['assets','dist/assets']){
   const f=path.join(root,base,'oss-icons',id+'.svg');
   const svg=fs.readFileSync(f,'utf8');
   assert.match(svg,/<svg/);
  }
 }
 const notice=fs.readFileSync(path.join(root,'THIRD_PARTY_LICENSES.md'),'utf8');
 assert.match(notice,/Lucide Icons and Contributors/);
 assert.match(notice,/Cole Bemis/);
});
