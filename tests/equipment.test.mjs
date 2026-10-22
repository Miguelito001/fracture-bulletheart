import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEquipment,setHandEquipment,hideEmbeddedEquipment,findHandBones,GEAR} from '../src3d/equipment.js';
test('legacy saved weapon migrates into hand1 without automatic shield',()=>{
 assert.deepEqual(normalizeEquipment(undefined,'gun'),{hand1:'gun',hand2:null});
 assert.deepEqual(normalizeEquipment({hand1:'blade',hand2:'blade'}),{hand1:'blade',hand2:null});
 assert.deepEqual(normalizeEquipment({hand1:'blade',hand2:'gun'}),{hand1:'blade',hand2:'gun'});
});
test('equip is a single source of truth and prevents duplicate equipment',()=>{
 const slots=normalizeEquipment({hand1:'blade',hand2:'gun'});
 assert.equal(setHandEquipment(slots,'hand1','gun'),true);
 assert.deepEqual(slots,{hand1:'gun',hand2:null});
 assert.equal(setHandEquipment(slots,'hand2','blade'),true);
 assert.deepEqual(slots,{hand1:'gun',hand2:'blade'});
 assert.equal(setHandEquipment(slots,'hand2',null),true);
 assert.deepEqual(slots,{hand1:'gun',hand2:null});
 assert.equal(setHandEquipment(slots,'hand1',null),false);
 assert.equal(setHandEquipment(slots,'hand2','shield'),false);
 assert.equal('shield' in GEAR,false);
});
test('the source model hides original starter weapons, not the body',()=>{
 const body={isMesh:true,name:'Torso',visible:true,material:{name:'armor'}};
 const sword={isMesh:true,name:'Sword',visible:true,material:{name:'metal'}};
 const shield={isMesh:true,name:'Mesh_2',visible:true,material:{name:'shield_bronze'}};
 const hero={traverse(fn){[body,sword,shield].forEach(fn);}};
 const hidden=hideEmbeddedEquipment(hero);
 assert.deepEqual(hidden,['Sword','Mesh_2']);
 assert.equal(body.visible,true);assert.equal(sword.visible,false);assert.equal(shield.visible,false);
});
test('right and left KayKit hand bones can be selected independently',()=>{
 const left={name:'Hand.L',isBone:true},right={name:'Hand.R',isBone:true};
 const leftSocket={name:'handslot.l',isBone:false},rightSocket={name:'handslot.r',isBone:false};
 const rig={traverse(cb){[left,right,leftSocket,rightSocket,{name:'UpperArm.R',isBone:true}].forEach(cb);}};
 const result=findHandBones(rig);
 assert.equal(result.hand1,rightSocket);
 assert.equal(result.hand2,leftSocket);
});
