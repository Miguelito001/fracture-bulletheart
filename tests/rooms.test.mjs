import test from 'node:test';
import assert from 'node:assert/strict';
import {HUB,ROOMS,validateBlueprint,chooseExpedition,WIDTH,HEIGHT} from '../src3d/rooms.js';
test('hand-authored room signatures and all entrance sockets are physical',()=>{
 assert.equal(ROOMS.length,9);
 for(const room of [HUB,...ROOMS]){
  const state=validateBlueprint(room);assert.ok(state.floor>150,room.id);
  for(let z=5;z<=7;z++){assert.notEqual(room.rows[z][0],'#',room.id);assert.notEqual(room.rows[z][WIDTH-1],'#',room.id);}
 }
});
test('expeditions use distinct authored rooms and end with a boss',()=>{
 const seq=new Set();for(let i=0;i<30;i++){
  const rooms=chooseExpedition();const ids=rooms.map(r=>r.id);
  assert.equal(rooms.length,5);assert.equal(new Set(ids).size,5);
  assert.equal(rooms.at(-1).id,'warden');assert.equal(ids[0],'crypt');seq.add(ids.slice(1,3).join('-'));
 }
 assert.ok(seq.size>1,'Random selection must vary');
});
test('layouts are structurally distinct, not numeric remixes of one box',()=>{
 const shapes=new Set([HUB,...ROOMS].map(r=>r.rows.join('\n')));
 assert.equal(shapes.size,ROOMS.length+1);
});