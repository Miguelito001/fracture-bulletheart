// Data-driven equipment slots. Adapted as an independent, lightweight design
// from the MIT licensed SoldierThirdPersonThreeJS EquipmentManager/WeaponSwitch
// patterns: one slot = one mounted visual; loadout is the source of truth.
// Source: https://github.com/achrefelouafi/SoldierThirdPersonThreeJS
export const GEAR = Object.freeze({
  blade:Object.freeze({id:'blade',label:'Lâmina Errante',model:'weapon-sword',handed:1}),
  gun:Object.freeze({id:'gun',label:'Revólver de Ecos',model:'blaster-g',handed:1})
});
const id=v=>typeof v==='string'&&Object.hasOwn(GEAR,v)?v:null;
export function normalizeEquipment(value,legacy='blade'){
  const hand1=id(value?.hand1)??id(legacy)??'blade';
  let hand2=id(value?.hand2);
  // Dual wield with the same item isn't implemented. Never duplicate a mesh
  // implicitly, and NEVER synthesize a shield the inventory doesn't contain.
  if(hand2===hand1)hand2=null;
  return {hand1,hand2};
}
export function setHandEquipment(loadout,hand,item){
  if(hand!=='hand1'&&hand!=='hand2')return false;
  const next=id(item);
  if(item!==null&&!next)return false;
  if(hand==='hand1'&&!next)return false;
  const other=hand==='hand1'?'hand2':'hand1';
  if(hand==='hand2'&&next&&loadout.hand1===next)return false;
  loadout[hand]=next;
  if(next&&loadout[other]===next)loadout[other]=null;
  return true;
}
const BUILT_IN=/(?:^|[._\\-])(shield|sword|blade|weapon|axe|mace|dagger|crossbow|bow|quiver|staff|hammer|scabbard)(?:$|[._\\-]|\\d)/i;
export function hideEmbeddedEquipment(root){
  const hidden=[];
  root.traverse(node=>{
    if(!node.isMesh&&!node.isSkinnedMesh)return;
    const materialNames=(Array.isArray(node.material)?node.material:[node.material]).filter(Boolean).map(m=>m.name||'');
    const ancestral=[];let p=node;
    for(let i=0;p&&p!==root&&i<4;i++,p=p.parent){
      if(p.isBone)break;
      ancestral.push(p.name||'');
    }
    const ownName=node.name||'';
    const names=[...ancestral,...materialNames].join(' ');
    if(BUILT_IN.test(names)&&!/(body|armour|armor|helmet|head|hand|leg|cape|torso|chestplate|glove)/i.test(ownName)){
      node.visible=false;node.userData.hiddenStarterGear=true;hidden.push(node.name||'(unnamed)');
    }
  });
  return hidden;
}
export function findHandBones(root){
  // KayKit ships named animated attachment sockets, e.g. "handslot.r".
  // Prefer them over a generic hand bone: their exported transform is
  // authored specifically for held items and avoids incorrect grip offsets.
  const candidates=[];
  root.traverse(node=>{if(node.isBone||/handslot|hand|wrist/i.test(node.name||''))candidates.push(node);});
  const rating=(node,side)=>{
   const name=(node.name||'').toLowerCase();
   const right=side==='hand1';
   const correct=right?/(?:[._-]r$|right$|right[_-])/i:/(?:[._-]l$|left$|left[_-])/i;
   const wrong=right?/(?:[._-]l$|left$|left[_-])/i:/(?:[._-]r$|right$|right[_-])/i;
   if(!/hand|wrist/.test(name)||wrong.test(name))return -1000;
   return (correct.test(name)?1000:0)+(/handslot/.test(name)?500:0)+(node.isBone?100:0);
  };
  const best=side=>[...candidates].sort((a,b)=>rating(b,side)-rating(a,side))[0]||null;
  const right=best('hand1'),left=best('hand2');
  return {hand1:right&&rating(right,'hand1')>0?right:null,
          hand2:left&&rating(left,'hand2')>0?left:null};
}
