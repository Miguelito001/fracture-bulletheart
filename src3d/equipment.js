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
  loadout[hand]=next;
  const other=hand==='hand1'?'hand2':'hand1';
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
  const bones=[];
  root.traverse(node=>{if(node.isBone||/hand[._-]?(r|l)|hand[._-]?(right|left)/i.test(node.name||''))bones.push(node);});
  const rank=(n,side)=>{
    const str=(n.name||'').toLowerCase();
    if(!/hand|wrist/.test(str))return -100;
    const right=side==='hand1',match=right?/(hand.*(?:right|[._-]r$)|(?:right|[._-]r).*hand)/:/(hand.*(?:left|[._-]l$)|(?:left|[._-]l).*hand)/;
    const mismatch=right?/(left|[._-]l$)/:/(right|[._-]r$)/;
    return (match.test(str)?100:0)-(mismatch.test(str)?120:0)+(n.isBone?30:0)-(str.includes('index')||str.includes('thumb')?15:0);
  };
  const select=side=>[...bones].sort((a,b)=>rank(b,side)-rank(a,side))[0]||null;
  const a=select('hand1'),b=select('hand2');
  return {hand1:a&&rank(a,'hand1')>0?a:null,hand2:b&&rank(b,'hand2')>0?b:null};
}
