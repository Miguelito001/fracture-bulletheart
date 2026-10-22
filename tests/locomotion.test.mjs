import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {screenRelativeInput,moveVelocity,wrapRotation,canStandAt} from '../src3d/locomotion.js';

test('isometric WASD is camera relative with symmetric diagonals',()=>{
 const camera=new THREE.Vector3(14,18.4,16);
 const w=screenRelativeInput(0,-1,camera);
 const s=screenRelativeInput(0,1,camera);
 const d=screenRelativeInput(1,0,camera);
 const a=screenRelativeInput(-1,0,camera);
 assert.ok(w.x<0&&w.z<0,'W should travel toward upper-screen world axis');
 assert.ok(Math.abs(w.dot(d))<1e-9,'W/D must be orthogonal');
 assert.ok(w.distanceTo(s.clone().negate())<1e-9);
 assert.ok(d.distanceTo(a.clone().negate())<1e-9);
 assert.ok(Math.abs(screenRelativeInput(1,-1,camera).length()-1)<1e-9,'diagonal cannot be faster');
});
test('damped locomotion responds fast, brakes completely and is timestep stable',()=>{
 const desired=new THREE.Vector3(4,0,-3);
 const direct=new THREE.Vector3(),fast=new THREE.Vector3();
 for(let i=0;i<30;i++)moveVelocity(direct,desired,1/60);
 for(let i=0;i<60;i++)moveVelocity(fast,desired,1/120);
 assert.ok(direct.distanceTo(fast)<.03);
 assert.ok(direct.length()>4.97,'movement must reach intended speed');
 for(let i=0;i<16;i++)moveVelocity(direct,new THREE.Vector3(),1/60);
 assert.ok(direct.length()<.02,'braking must be fast rather than floaty');
});
test('turning crosses the +/-180 degree boundary by shortest route',()=>{
 const before=Math.PI-.02;
 const after=wrapRotation(before,-Math.PI+.02,18,1/60);
 assert.ok(after>before&&after<before+.04,'should rotate only a few degrees, not the long way');
});
test('floor mask keeps player on authored floors and on only valid corridor sockets',()=>{
 const rows=Array.from({length:13},()=>'.'.repeat(19));
 const rooms=[{index:0,layout:{rows}},{index:1,layout:{rows}}];
 const t=2.35;
 assert.equal(canStandAt(rooms,8*t,7*t,t),true);
 assert.equal(canStandAt(rooms,30*t,6*t,t),true);
 assert.equal(canStandAt(rooms,21*t,6*t,t),true);
 assert.equal(canStandAt(rooms,21*t,1*t,t),false);
 assert.equal(canStandAt(rooms,-5*t,7*t,t),false);
});
