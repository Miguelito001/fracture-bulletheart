// FRACTURE — BULLETHEART 1.2 PUBLIC BETA. Independent roguelite prototype.
// Player progress is saved locally. No third-party assets at runtime.
type XY = {x:number;y:number};
type RoomKind = 'start'|'battle'|'elite'|'treasure'|'shrine'|'forge'|'heal'|'boss'|'secret';
type MobKind = 'crawler'|'ranger'|'knight'|'bomber'|'wisp'|'elite'|'boss';
type Weapon = 'sword'|'hammer'|'bow'|'gun'|'shotgun'|'staff'|'chakram';
type ClassId = 'wanderer'|'bulwark'|'arcanist';
type Room = {id:number; gx:number;gy:number;cx:number;cy:number;kind:RoomKind;shape:number;seen:boolean;cleared:boolean;active:boolean; connections:number[];prop:XY[]; enemiesLeft:number; title:string; collected:boolean};
type Mob = XY & {id:number;kind:MobKind;hp:number;max:number;radius:number;speed:number;attack:number;cd:number;windup:number;ang:number;room:number;stun:number;phase:number;shield:number;anchors:XY[];dead:boolean;champion:boolean};
type Shot = XY & {vx:number;vy:number;r:number;damage:number;life:number;enemy:boolean;kind:string;pierce:number;hit:Set<number>;returning?:boolean};
type Loot = XY & {kind:'xp'|'coin'|'heart'|'chest'|'artifact'|'material';amount:number;label:string;room:number;materialId?:string};
type CargoItem={id:string;qty:number};
type Particle = XY & {vx:number;vy:number;life:number;max:number;size:number;color:string;kind:string};
type Run = {floor:number;level:number;xp:number;nextXp:number;hp:number;maxHp:number;coins:number;echoes:number;kills:number;rooms:number;bosses:number;potions:number;classId:ClassId;weapons:Weapon[];slot:number;damage:number;speed:number;attackRate:number;critical:number;armor:number;shotCount:number;lifesteal:number;piercing:number;bleed:number;bounce:number;explode:number;frost:number;lightning:number;orbit:number;rollCharge:number;resonance:number;sigils:number;relics:string[];cargo:CargoItem[];scrolls:number;runTime:number;maxFloor:number};
type Save = {echoes:number;bestFloor:number;bestKills:number;runs:number;wins:number;discovered:string[];unlocks:string[];legacy?:boolean;stash?:Record<string,number>;portalScrolls?:number;extractions?:number;shopPurchased?:number;preferredClass?:ClassId;preparedWeapon?:Weapon|null;preparedPotion?:number;capacity?:number};
const T=60,W=1280,H=720, el=(s:string)=>document.querySelector(s) as HTMLElement, canvas=el('#scene') as HTMLCanvasElement;
const g=canvas.getContext('2d')!;g.imageSmoothingEnabled=false;
const assets:Record<string,HTMLImageElement>={};
for (const id of ['wanderer','swift','bulwark','arcanist','crawler','ranger','knight','bomber','wisp','elite','boss','wall','pillar','chest','torch','altar','potion','menu-art',...Array.from({length:5},(_,i)=>`floor${i}`)]){
  const a=new Image();a.src=`./assets/${id}.png`;assets[id]=a;
}
const random=(a:number,b:number)=>a+Math.random()*(b-a),int=(a:number,b:number)=>Math.floor(random(a,b+1)),pick=<V>(items:V[]):V=>items[Math.floor(Math.random()*items.length)];
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v)),distance=(a:XY,b:XY)=>Math.hypot(a.x-b.x,a.y-b.y),angle=(a:XY,b:XY)=>Math.atan2(b.y-a.y,b.x-a.x);
const vec=(a:number,m=1)=>({x:Math.cos(a)*m,y:Math.sin(a)*m});
const KEY='fracture_bulletheart_v1'; // Preserve 1.3 saved player progression.
const SESSION_KEY='fracture_anchor_active_run_v1';
const MATERIALS:Record<string,{name:string;value:number;rare:boolean;color:string}>={scrap:{name:'Ferro da Cripta',value:7,rare:false,color:'#9eb2ba'},fang:{name:'Presa Estilhaçada',value:9,rare:false,color:'#ddd0ab'},cloth:{name:'Fio Espectral',value:11,rare:false,color:'#94bcdd'},ember:{name:'Brasa Antiga',value:48,rare:true,color:'#efa678'},rift:{name:'Fragmento da Fenda',value:65,rare:true,color:'#ae99ed'},core:{name:'Núcleo de Guardião',value:110,rare:true,color:'#e3c67a'}};
const BAG_SLOTS=12;
const escapeHtml=(x:string)=>x.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
function loadSave():Save{try{const o=JSON.parse(localStorage.getItem(KEY)||'null');if(o?.discovered && Array.isArray(o.discovered))return {echoes:0,bestFloor:1,bestKills:0,runs:0,wins:0,unlocks:[],...o};
 const old=JSON.parse(localStorage.getItem('fracture_reliquary_v2')||'null');if(old&&typeof old==='object'){
 const discovered=['sword','gun','wanderer'];const mapping:Record<string,string>={rust:'sword',colossus:'hammer',void:'bow',storm:'staff',echo:'chakram',shadow:'shotgun',assassin:'wanderer','colossus-class':'bulwark',arcanist:'arcanist'};
 if(Array.isArray(old.archive))for(const item of old.archive)if(mapping[item]&&!discovered.includes(mapping[item]))discovered.push(mapping[item]);
 return {echoes:clamp(Number(old.echoes)||0,0,500000),bestFloor:Math.max(1,Number(old.bestFloor)||1),bestKills:Math.max(0,Number(old.totalKills)||0),runs:Math.max(0,Number(old.runs)||0),wins:Math.max(0,Number(old.wins)||0),discovered,unlocks:[],legacy:true};
 }
 }catch{}return {echoes:0,bestFloor:1,bestKills:0,runs:0,wins:0,discovered:['sword','gun','wanderer'],unlocks:[]};}
let save=loadSave();save.stash ||= {};save.portalScrolls ||= 0;save.extractions ||= 0;save.preferredClass ||= 'wanderer';save.preparedPotion ||= 0;save.capacity ||= BAG_SLOTS;const writeSave=()=>{try{localStorage.setItem(KEY,JSON.stringify(save));}catch{}};
let run:Run;let rooms:Room[]=[];let world=new Set<string>();let blocked=new Set<string>();let mobs:Mob[]=[];let shots:Shot[]=[];let loot:Loot[]=[];let particles:Particle[]=[];let current:Room|null=null;
let mode:'menu'|'hub'|'playing'|'pause'|'choice'|'gameover'|'victory'|'archive'='menu';let px=0,py=0,aim={x:650,y:330},camera={x:0,y:0};
let nextMob=1,attackCD=0,dashCD=0,dashTime=0,dashDir={x:0,y:0},specialCD=0,hitInvuln=0,screenShake=0,screenFlash=0,globalTime=0,roomAlert=0;
let mouseDown=false,charging=0,chargeStarted=false,fireHeld=false;const audioCooldown:Record<string,number>={};let tuneTime=0;let tuneStep=0;let keys=new Set<string>();let mapVisible=true;let audioOn=true;let audioCtx:AudioContext|null=null;
let hubActive=false,returnCast=0,castStart:XY|null=null,hubStatus='';
 // Purely visual action animation: never modifies hitboxes, damage or cooldown.
 let weaponMotion:{kind:Weapon;time:number;duration:number}={kind:'sword',time:0,duration:.25};
 let lastMapPaint=-1;
const HUB={x:4140,y:3300};
const hubStations=[{id:'portal',label:'PORTAL DA FRATURA',x:HUB.x,y:HUB.y-205,color:'#9d8cf5'},{id:'forge',label:'FORJA',x:HUB.x-410,y:HUB.y-145,color:'#e6ab6c'},{id:'merchant',label:'MERCADOR',x:HUB.x+410,y:HUB.y-145,color:'#eac77f'},{id:'vault',label:'COFRE',x:HUB.x+410,y:HUB.y+145,color:'#84d7b9'},{id:'archive',label:'ARQUIVO',x:HUB.x-410,y:HUB.y+145,color:'#a6a6eb'},{id:'altar',label:'ALTAR DE PREPARAÇÃO',x:HUB.x,y:HUB.y+215,color:'#e6b4c2'}];
type FloorMemory={world:Set<string>;blocked:Set<string>;rooms:Room[];mobs:Mob[];loot:Loot[];sigils:number};
let floorMemory=new Map<number,FloorMemory>();
let locationLabel='',noticeTimer=0,locationTimer=0;let bossCurrent:Mob|null=null;let xpQueue=0;let lastStep=0;
const regionNames=['CRÍPTA DAS CINZAS','SALÕES DA BRUMA','JARDIM DAS OSSADAS','FORJA DO ABISMO','CORAÇÃO PARTIDO'];
const roomNames:Record<RoomKind,string>={start:'A Última Chama',battle:'Câmara dos Condenados',elite:'Salão do Carrasco',treasure:'Tesouro Esquecido',shrine:'Altar da Fenda',forge:'Forja Silenciosa',heal:'Fonte da Memória',boss:'Santuário do Guardião',secret:'Câmara Oculta'};
const kinds:Record<MobKind,{label:string;color:string;size:number}>={crawler:{label:'Rastejante',color:'#df667a',size:20},ranger:{label:'Arqueiro Espectral',color:'#8ed6a7',size:21},knight:{label:'Cavaleiro Oco',color:'#c5bdcf',size:24},bomber:{label:'Incendiário',color:'#efac6f',size:20},wisp:{label:'Ídolo da Névoa',color:'#aaa0ef',size:20},elite:{label:'Executor',color:'#edb85b',size:29},boss:{label:'GUARDIÃO DA FENDA',color:'#ff85ba',size:58}};
const weaponNames:Record<Weapon,string>={sword:'LÂMINA ERRANTE',hammer:'MARTELO DO JUÍZO',bow:'ARCO DA CAÇADA',gun:'REVÓLVER DE ECOS',shotgun:'TROVÃO CURTO',staff:'CETRO DAS FAÍSCAS',chakram:'DISCO DO CREPÚSCULO'};
const weaponIcon:Record<Weapon,string>={sword:'sword',hammer:'hammer',bow:'bow-arrow',gun:'crosshair',shotgun:'target',staff:'zap',chakram:'orbit'};
const weaponDesc:Record<Weapon,string>={sword:'CORTE EM ARCO',hammer:'GOLPE CARREGADO',bow:'FLECHA PRECISA',gun:'DISPAROS RÁPIDOS',shotgun:'ESPALHAMENTO',staff:'RAIOS EM CADEIA',chakram:'IDA E VOLTA'};
const classNames:Record<ClassId,string>={wanderer:'CAÇADOR',bulwark:'COLOSSO',arcanist:'ARCANISTA'};
const tileKey=(x:number,y:number)=>`${x},${y}`;const tile=(x:number,y:number)=>tileKey(Math.floor(x/T),Math.floor(y/T));
const floorAt=(x:number,y:number)=>world.has(tile(x,y))&&!blocked.has(tile(x,y));
function walkable(x:number,y:number,r=16){return floorAt(x-r,y-r)&&floorAt(x+r,y-r)&&floorAt(x-r,y+r)&&floorAt(x+r,y+r);}
// Move in short, safe steps. The previous small-radius fallback could leave the player inside a wall.
function moveWithCollision(obj:XY,dx:number,dy:number,r=17){
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/Math.max(5,r*.6)));
 const sx=dx/steps,sy=dy/steps;
 for(let i=0;i<steps;i++){
  if(walkable(obj.x+sx,obj.y,r))obj.x+=sx;
  if(walkable(obj.x,obj.y+sy,r))obj.y+=sy;
 }
}
// A battle begins only after entering the body of a room, not at the corridor threshold.
const battleTrigger=(room:Room,pos:XY)=>Math.abs(pos.x-room.cx)<=T*5.15&&Math.abs(pos.y-room.cy)<=T*3.55;
// The invisible combat gate closes the exits, never freezes the whole player's movement.
function clampCombatExit(room:Room,pos:XY){
 pos.x=clamp(pos.x,room.cx-T*6.35,room.cx+T*6.35);
 pos.y=clamp(pos.y,room.cy-T*4.35,room.cy+T*4.35);
}
// Geometrically, every point between the player and the outer slash arc can hit.
// Enemy body radius also counts, even when its center is slightly outside the wedge.
function slashHits(origin:XY,target:XY,targetRadius:number,direction:number,reach:number,arc:number){
 const dx=target.x-origin.x,dy=target.y-origin.y;
 const d=Math.hypot(dx,dy);
 if(d>reach+targetRadius)return false;
 if(d<=targetRadius)return true;
 const diff=Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-direction),Math.cos(Math.atan2(dy,dx)-direction)));
 const radiusAllowance=Math.asin(Math.min(1,targetRadius/d));
 return diff<=arc/2+radiusAllowance;
}
// Slower, progressively more expensive levels keep each new power meaningful.
function xpRequirementFor(level:number){return Math.round(65+level*30+level*level*7);}
// More enemy pressure after a successful build, without scaling bosses into huge HP sponges.
function commonHpScale(floor:number,level:number){return (1+(floor-1)*.29)*(1+Math.min(.8,Math.max(0,level-1)*.073));}
function commonCadenceScale(floor:number,level:number){return 1+Math.min(.36,(floor-1)*.055+Math.max(0,level-1)*.016);}
// Ground slam rewards accuracy: center is full damage, fringe is diminished.
function hammerFalloff(distanceToCenter:number,collisionRadius:number,range:number){
 const edge=Math.max(0,distanceToCenter-collisionRadius);
 if(edge>range)return 0;
 const normalized=edge/range;
 return normalized<=.43?1:1-(normalized-.43)/.57*.57;
}

function showNotice(msg:string,duration=2.6){el('#notice').textContent=msg;noticeTimer=duration;el('#notice').style.opacity='1';}
function showLocation(msg:string){locationLabel=msg;locationTimer=2.2;el('#location-toast').textContent=msg;el('#location-toast').style.opacity='1';}
function sound(type:'attack'|'hit'|'shot'|'level'|'pick'|'hurt'|'dash'|'boss'|'room'|'win'){
 if(!audioOn)return;
 try{audioCtx ||=new AudioContext();if(audioCtx.state==='suspended')audioCtx.resume();const now=audioCtx.currentTime;if(now-(audioCooldown[type]||0)<(type==='pick'?.115:.045))return;audioCooldown[type]=now;const osc=audioCtx.createOscillator(), gain=audioCtx.createGain();osc.connect(gain);gain.connect(audioCtx.destination);osc.type=type==='hit'||type==='hurt'?'sawtooth':type==='pick'?'sine':'triangle';
 const presets:Record<string,[number,number,number,number]>={attack:[270,110,.09,.06],hit:[105,49,.12,.16],shot:[480,170,.09,.08],level:[510,920,.32,.12],pick:[650,940,.1,.07],hurt:[150,42,.22,.16],dash:[190,510,.11,.09],boss:[90,40,.5,.18],room:[160,320,.3,.07],win:[520,1060,.55,.14]};let [a,b,t,v]=presets[type];osc.frequency.setValueAtTime(a,now);osc.frequency.exponentialRampToValueAtTime(Math.max(1,b),now+t);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(v,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+t);osc.start(now);osc.stop(now+t+.01);}catch{}
}
function ambience(dt:number){if(!audioOn||!audioCtx||mode!=='playing')return;tuneTime-=dt;if(tuneTime>0)return;const urgent=!!current?.active;tuneTime=urgent?.42:.78;
 try{const a=audioCtx.currentTime;const roots=[110,116.5,98,123,92.5],root=roots[(run.floor-1)%5],notes=[0,3,7,10,12,15,19,10];const pitch=root*Math.pow(2,notes[tuneStep%notes.length]/12);tuneStep++;const o=audioCtx.createOscillator(),gain=audioCtx.createGain();o.type=urgent?'triangle':'sine';o.frequency.value=pitch*2;o.connect(gain);gain.connect(audioCtx.destination);gain.gain.setValueAtTime(.0001,a);gain.gain.linearRampToValueAtTime(urgent?.022:.012,a+.03);gain.gain.exponentialRampToValueAtTime(.0001,a+(urgent?.35:.65));o.start(a);o.stop(a+(urgent?.36:.66));}catch{}
}
function createRun(cls:ClassId):Run{return {floor:1,level:1,xp:0,nextXp:xpRequirementFor(1),hp:cls==='bulwark'?170:cls==='wanderer'?125:105,maxHp:cls==='bulwark'?170:cls==='wanderer'?125:105,coins:0,echoes:0,kills:0,rooms:0,bosses:0,potions:2+(save.unlocks.includes('flask')?1:0),classId:cls,weapons:cls==='bulwark'?['hammer','bow']:cls==='arcanist'?['staff','shotgun']:['sword','gun'],slot:0,damage:1,speed:cls==='wanderer'?250:cls==='bulwark'?202:224,attackRate:1,critical:.08,armor:cls==='bulwark'?.14:0,shotCount:0,lifesteal:0,piercing:0,bleed:0,bounce:0,explode:0,frost:0,lightning:0,orbit:0,rollCharge:0,resonance:0,sigils:0,relics:[],cargo:[],scrolls:0,runTime:0,maxFloor:5};}
function persistEnd(won=false){if(!run)return;save.runs++;save.bestFloor=Math.max(save.bestFloor,run.floor);save.bestKills=Math.max(save.bestKills,run.kills);save.echoes+=run.echoes;if(won)save.wins++;writeSave();}
function discover(id:string){if(!save.discovered.includes(id)){save.discovered.push(id);writeSave();showNotice('✦ NOVA DESCOBERTA: '+(weaponNames[id as Weapon]||id.toUpperCase()));sound('level');}}
function begin(cls:ClassId){hubActive=false;floorMemory.clear();returnCast=0;run=createRun(cls);run.scrolls=Math.min(1,save.portalScrolls||0);save.portalScrolls=Math.max(0,(save.portalScrolls||0)-run.scrolls);run.potions=Math.min(5,run.potions+(save.preparedPotion||0));save.preparedPotion=0;if(save.preparedWeapon){run.weapons[0]=save.preparedWeapon;save.preparedWeapon=null;}writeSave();if(save.unlocks.includes('heart')){run.maxHp+=20;run.hp+=20;}if(save.unlocks.includes('forge')){run.damage*=1.10;}discover(cls);mode='playing';el('#overlay').innerHTML='';el('#hud').classList.remove('hidden'); el('#pause-button').classList.remove('hidden'); el('#hub-status').classList.add('hidden');el('#footer-hint').textContent='EXPEDIÇÃO · E NO NÓ ZERO PARA EXTRAIR · R TELEPORTE (4s) · I MOCHILA · WASD · ESPAÇO · Q';globalTime=0;dashCD=0;attackCD=0;specialCD=0;hitInvuln=0;fireHeld=false;mouseDown=false;generateFloor();}
// The dungeon is a non-overlapping random connected graph of tile rooms.
function generateFloor(){world=new Set();blocked=new Set();rooms=[];mobs=[];shots=[];loot=[];particles=[];bossCurrent=null;run.sigils=0;current=null;if(run.floor>1&&run.floor%2===1)run.potions=Math.min(3,run.potions+1);
 const nodes=[{x:3,y:3}];const occupied=new Set(['3,3']);const edges:[number,number][]=[];
 const count=Math.min(19,11+run.floor*2);
 for(let attempt=0;nodes.length<count&&attempt<500;attempt++){
  const parent=int(0,nodes.length-1),a=nodes[parent];const dir=pick([[1,0],[-1,0],[0,1],[0,-1]]);const gx=a.x+dir[0],gy=a.y+dir[1];if(gx<0||gx>6||gy<0||gy>6||occupied.has(`${gx},${gy}`))continue;
  occupied.add(`${gx},${gy}`);nodes.push({x:gx,y:gy});edges.push([parent,nodes.length-1]);
 }
 if(nodes.length<7){for(let i=nodes.length;i<7;i++){nodes.push({x:i,y:3});edges.push([i-1,i]);}}
 const adj=nodes.map(()=>[] as number[]);edges.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a);});
 nodes.forEach((n,i)=>nodes.forEach((v,j)=>{if(i<j&&Math.abs(n.x-v.x)+Math.abs(n.y-v.y)===1&&!adj[i].includes(j)&&Math.random()<.14){adj[i].push(j);adj[j].push(i);edges.push([i,j]);}}));
 const d=nodes.map(()=>999);d[0]=0;let q=[0];while(q.length){const a=q.shift()!;adj[a].forEach(b=>{if(d[b]===999){d[b]=d[a]+1;q.push(b);}});}
 const bossIdx=d.indexOf(Math.max(...d));const rKinds:RoomKind[]=['start'];for(let i=1;i<nodes.length;i++)rKinds.push('battle');rKinds[bossIdx]='boss';
 const candidates=nodes.map((_,i)=>i).filter(i=>i!==0&&i!==bossIdx);
 for(let i=candidates.length-1;i>0;i--){const j=int(0,i);[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
 let slot=0;
 const place=(kind:RoomKind)=>{if(slot<candidates.length)rKinds[candidates[slot++]]=kind;};
 // Two elite fights guarantee the two sigils required for the boss.
 place('elite');place('elite');
 // Treasure and smithy are genuine rare discoveries, not fixed stops on every floor.
 if(Math.random()<.26)place('treasure');
 if(Math.random()<.12)place('forge');
 if(Math.random()<.22)place('shrine');
 if(Math.random()<.15)place('heal');
 if(Math.random()<.12)place('secret');
 rooms=nodes.map((p,i)=>({id:i,gx:p.x,gy:p.y,cx:(p.x*19+12)*T,cy:(p.y*15+10)*T,kind:rKinds[i],shape:int(0,5),seen:false,cleared:i===0,active:false,connections:adj[i],prop:[],enemiesLeft:0,title:roomNames[rKinds[i]],collected:false}));
 const carve=(x:number,y:number)=>world.add(tileKey(x,y));
 for(const room of rooms){const cx=Math.floor(room.cx/T),cy=Math.floor(room.cy/T);
  for(let dx=-7;dx<=7;dx++)for(let dy=-5;dy<=5;dy++){
   let yes=true;
   if(room.shape===0)yes=Math.abs(dx)<6||Math.abs(dy)<4;
   if(room.shape===1)yes=(Math.abs(dx)<5||Math.abs(dy)<3);
   if(room.shape===2)yes=Math.abs(dx)+Math.abs(dy)*1.22<12;
   if(room.shape===3)yes=!(dx<-3&&dy<-1);
   if(room.shape===4)yes=!(dx>3&&dy>1);
   if(room.shape===5)yes=!(dx<-4&&dy>2)&&!(dx>4&&dy<-2);
   if(yes)carve(cx+dx,cy+dy);
  }
 }
 for(const [ai,bi] of edges){const a=rooms[ai],b=rooms[bi],x1=Math.floor(a.cx/T),x2=Math.floor(b.cx/T),y1=Math.floor(a.cy/T),y2=Math.floor(b.cy/T);
  if(y1===y2){for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)for(let t=-2;t<=2;t++)carve(x,y1+t);}
  else{for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++)for(let t=-2;t<=2;t++)carve(x1+t,y);}
 }
 for(const room of rooms){const cx=Math.floor(room.cx/T),cy=Math.floor(room.cy/T);if(room.kind==='boss'||room.kind==='start')continue;
  for(let i=0;i<8;i++){
   const dx=int(-5,5),dy=int(-3,3),x=cx+dx,y=cy+dy;
   if(Math.abs(dx)<2||Math.abs(dy)<2||!world.has(tileKey(x,y)))continue;
   if(Math.random()<.48){blocked.add(tileKey(x,y));room.prop.push({x:x*T+T/2,y:y*T+T/2});}
  }
 }
 const start=rooms[0];px=start.cx;py=start.cy;visitRoom(start); camera.x=px-W/2;camera.y=py-H/2;showLocation(regionNames[(run.floor-1)%5]);sound('room');}
function roomAt(x:number,y:number){let found:Room|null=null,best=999999;for(const r of rooms){const dx=Math.abs(x-r.cx),dy=Math.abs(y-r.cy),metric=dx/8+dy/6;if(dx<T*7.5&&dy<T*5.5&&metric<best){best=metric;found=r;}}return found;}
function nearMobKind(floor:number):MobKind{const types:MobKind[]=['crawler','crawler','crawler','ranger','knight','wisp'];if(floor>=2)types.push('bomber','ranger','knight');if(floor>=3)types.push('wisp','bomber','elite');return pick(types);}
function spawnMob(kind:MobKind,room:Room,x:number,y:number){
 const k=kinds[kind],isBoss=kind==='boss';
 const champion=!isBoss&&kind!=='elite'&&Math.random()<Math.min(.21,.04+run.floor*.022+run.level*.004);
 const baseHp=isBoss?1050+run.floor*550:kind==='elite'?250:kind==='knight'?175:kind==='ranger'?85:kind==='bomber'?125:kind==='wisp'?115:95;
 const hp=baseHp*(isBoss?(1+(run.floor-1)*.29):commonHpScale(run.floor,run.level))*(champion?1.75:1);
 const baseSpeed=isBoss?76:kind==='knight'?90:kind==='wisp'?125:kind==='crawler'?150:110;
 const m:Mob={id:nextMob++,x,y,kind,hp,max:hp,radius:k.size,speed:baseSpeed*(champion?1.12:1),attack:(kind==='bomber'?22:kind==='knight'?21:14)*(champion?1.2:1),cd:random(.25,1.6),windup:0,ang:0,room:room.id,stun:0,phase:0,shield:isBoss?2:0,anchors:[],dead:false,champion};
 if(isBoss){m.anchors=[{x:x-145,y:y+55},{x:x+145,y:y+55}];bossCurrent=m;showNotice('⚔ GUARDIÃO — DESTRUA OS CRISTAIS DE PROTEÇÃO!',4);sound('boss');}
 mobs.push(m);return m;
}
function visitRoom(r:Room){if(r.seen&&(r.kind!=='boss'||r.cleared||r.active||run.sigils<2))return;r.seen=true;current=r;run.rooms++;showLocation(r.title);
 if(r.kind==='start'){showNotice('Explore a masmorra e descubra novos caminhos.');return;}
 if(r.kind==='boss'&&run.sigils<2){showNotice(`PORTAL SELADO — ENCONTRE MAIS ${2-run.sigils} MARCAS DA FENDA`,4);return;}
 if(['treasure','forge','heal','shrine','secret'].includes(r.kind)){r.cleared=true;const kind=r.kind==='heal'?'heart':r.kind==='treasure'||r.kind==='secret'?'chest':'artifact';loot.push({x:r.cx,y:r.cy,kind,amount:kind==='heart'?45:1,label:r.title,room:r.id});showNotice(`✦ ${r.title} — APROXIME-SE E PRESSIONE E`,3);if(r.kind==='secret')discover('Câmara sem Nome');return;}
 r.active=true;r.enemiesLeft=0;const amount=r.kind==='boss'?1:r.kind==='elite'?5+run.floor:4+run.floor*2+int(0,2);
 for(let i=0;i<amount;i++){let x=r.cx+random(-210,210),y=r.cy+random(-130,130);if(!walkable(x,y,24)) {x=r.cx+random(-120,120);y=r.cy+random(-80,80);}const kind=r.kind==='boss'?'boss':r.kind==='elite'&&i===0?'elite':nearMobKind(run.floor);spawnMob(kind,r,x,y);r.enemiesLeft++;}
 if(r.kind==='elite')showNotice('ELITE — CUIDADO COM O EXECUTOR!',2.8);
 if(r.kind==='boss')sound('boss');}
function clearRoom(r:Room){if(r.cleared)return;r.cleared=true;r.active=false;run.coins+=int(8,16);run.echoes+=int(3,8);sound('room');
 if(r.kind==='elite'){run.sigils++;run.echoes+=14;showNotice(`✦ MARCA DA FENDA ${run.sigils}/2 OBTIDA!`,3);}
 else if(r.kind==='battle'&&run.sigils<2&&r.id%4===0){run.sigils++;showNotice(`✦ MARCA DA FENDA ${run.sigils}/2 OBTIDA!`,3);}
 if(r.kind==='boss'){run.bosses++;run.echoes+=65+run.floor*25;discover(`guardiao-${run.floor}`);openReward(true);return;}
 if(Math.random()<(r.kind==='elite'?.12:.035))loot.push({x:r.cx+75,y:r.cy+10,kind:'chest',amount:1,label:'ESPÓLIOS',room:r.id});
 showNotice('SALA PURIFICADA · RECOLHA OS ECOS',2);
}
function livingEnemies(room:number){return mobs.some(m=>!m.dead&&m.room===room);}
const upgradeDefs:{id:string;name:string;detail:string;rarity:string;apply:()=>void}[]=[
{id:'fury',name:'LÂMINA VORAZ',detail:'+22% dano com todas as armas',rarity:'COMUM',apply:()=>run.damage=Math.min(3.7,run.damage*1.22)},
{id:'tempo',name:'PULSO ACELERADO',detail:'+18% velocidade dos ataques',rarity:'COMUM',apply:()=>run.attackRate=Math.min(2.8,run.attackRate*1.18)},
{id:'stride',name:'PASSOS DO VENTO',detail:'+22 velocidade de movimento',rarity:'COMUM',apply:()=>run.speed+=22},
{id:'iron',name:'FERRO VIVO',detail:'+25 de vida máxima e +25 cura',rarity:'COMUM',apply:()=>{run.maxHp+=25;run.hp=Math.min(run.maxHp,run.hp+25);}},
{id:'critical',name:'PONTO FRACO',detail:'+12% chance crítica',rarity:'INCOMUM',apply:()=>run.critical=Math.min(.6,run.critical+.12)},
{id:'armor',name:'PELE DE PEDRA',detail:'Reduz em 9% o dano sofrido',rarity:'COMUM',apply:()=>run.armor=Math.min(.6,run.armor+.09)},
{id:'pierce',name:'ATRAVESSAR',detail:'Projéteis atravessam mais um inimigo',rarity:'RARO',apply:()=>run.piercing++},
{id:'shotcount',name:'MÚLTIPLOS DESTINOS',detail:'+1 projétil em ataques de distância',rarity:'ÉPICO',apply:()=>run.shotCount=Math.min(3,run.shotCount+1)},
{id:'blood',name:'PACTO SANGUÍNEO',detail:'Roubo de vida em ataques críticos',rarity:'RARO',apply:()=>run.lifesteal=Math.min(.13,run.lifesteal+.045)},
{id:'chain',name:'CONDUTOR',detail:'Chance de raios em cadeia nos acertos',rarity:'RARO',apply:()=>run.lightning++},
{id:'explosion',name:'PÓLVORA VIVA',detail:'Abates criam explosões de fogo',rarity:'ÉPICO',apply:()=>run.explode++},
{id:'cold',name:'INVERNO ETERNO',detail:'Golpes podem congelar inimigos',rarity:'RARO',apply:()=>run.frost++},
{id:'orbital',name:'ANEL DO VAZIO',detail:'Uma lâmina orbital te protege',rarity:'ÉPICO',apply:()=>run.orbit=Math.min(4,run.orbit+1)},
{id:'bounce',name:'ECO BALÍSTICO',detail:'Balas ricocheteiam para outros inimigos',rarity:'RARO',apply:()=>run.bounce++},
{id:'poison',name:'FERIDA ABERTA',detail:'Ataques aplicam sangramento',rarity:'INCOMUM',apply:()=>run.bleed++},
{id:'dash',name:'ESQUIVA DUPLA',detail:'Reduz tempo para próxima esquiva',rarity:'RARO',apply:()=>run.rollCharge=Math.min(3,run.rollCharge+1)},
{id:'resonance',name:'ALMA DE ARSENAL',detail:'Trocar de arma aumenta o próximo golpe',rarity:'INCOMUM',apply:()=>run.resonance=Math.min(4,run.resonance+1)},
{id:'surge',name:'SOBRECARREGAR',detail:'+30% dano, perde 12 vida máxima',rarity:'ÉPICO',apply:()=>{run.damage=Math.min(4,run.damage*1.3);run.maxHp=Math.max(40,run.maxHp-12);run.hp=Math.min(run.hp,run.maxHp);}},
{id:'potion',name:'FONTE INTERIOR',detail:'+2 poções e recupera 30 vida',rarity:'COMUM',apply:()=>{run.potions=Math.min(7,run.potions+2);run.hp=Math.min(run.maxHp,run.hp+30);}},
{id:'money',name:'VISÃO DO TESOURO',detail:'Ganhe 65 moedas para futuras lojas',rarity:'INCOMUM',apply:()=>run.coins+=65},
{id:'gunner',name:'CALIBRE INFINITO',detail:'+20% poder de tiro e crítico',rarity:'RARO',apply:()=>{run.damage*=1.10;run.critical+=.09;}}
];
let rewardChoice:(()=>void)|null=null;
function choicesOf<T>(pool:T[],count:number):T[]{return [...pool].sort(()=>Math.random()-.5).slice(0,count);}
function showOverlay(html:string){el('#overlay').innerHTML=html;}
function dismiss(){el('#overlay').innerHTML='';mode=hubActive?'hub':'playing';mouseDown=false;}
const card=(title:string,desc:string,tag:string,emoji:string,idx:number)=>`<button class="card" data-choice="${idx}"><div class="tag">${tag}</div><div class="emoji">${emoji}</div><h3>${title}</h3><p>${desc}</p></button>`;
function openLevelUp(){if(!run||mode==='gameover')return;mode='choice';const list=choicesOf(upgradeDefs,3);showOverlay(`<div class="modal"><header>✦ &nbsp; ASCENSÃO · NÍVEL ${run.level}</header><h2>O poder cobra sua forma.</h2><p class="lead">Escolha o que sua próxima versão será. Essas melhorias permanecem até o fim da expedição.</p><div class="cards">${list.map((x,i)=>card(x.name,x.detail,x.rarity,['⚔','✧','✺'][i],i)).join('')}</div><p class="muted">EXPEDIÇÃO EM PAUSA · Escolha um dos três destinos</p></div>`);
 el('#overlay').querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{const u=list[Number((b as HTMLElement).dataset.choice)];u.apply();discover(`up-${u.id}`);sound('level');dismiss();xpQueue--;if(xpQueue>0)setTimeout(openLevelUp,50);}));}
function gainXP(amount:number){run.xp+=amount;while(run.xp>=run.nextXp){run.xp-=run.nextXp;run.level++;run.nextXp=xpRequirementFor(run.level);xpQueue++;}if(xpQueue&&mode==='playing')openLevelUp();}
function rewardLoot(room:Room){if(room.collected)return;room.collected=true;mode='choice';if(room.kind==='forge'){const options=['Reforjar uma arma (+20% dano)','Temperar armadura (+35 vida)','Afilar arsenal (+15% ataques)'];showOverlay(`<div class="modal"><header>⚒ &nbsp; A FORJA DESPERTA</header><h2>O ferro lembra.</h2><p class="lead">Escolha um aprimoramento gratuito para esta expedição.</p><div class="cards">${options.map((s,i)=>card(s,['Forja runas letais na arma ativa.','Reforça o corpo para os próximos guardiões.','Refina o ritmo de seus golpes.'][i],'OFICINA','⚒',i)).join('')}</div></div>`);bindChoice([()=>run.damage*=1.20,()=>{run.maxHp+=35;run.hp+=35;},()=>run.attackRate=Math.min(3,run.attackRate*1.15)]);return;}
 if(room.kind==='shrine'||room.kind==='secret'){const opts=['Sangue por poder','Abraçar o desconhecido','Purificar a alma'];showOverlay(`<div class="modal"><header>✧ &nbsp; SANTUÁRIO ESQUECIDO</header><h2>Uma voz entre as pedras.</h2><p class="lead">Toda bênção pode deixar uma cicatriz.</p><div class="cards">${opts.map((s,i)=>card(s,['Perde 25 vida máxima, recebe +45% dano.','Ganha duas melhorias aleatórias, perde uma poção.','Recupera toda a vida, recebe uma poção.'][i],'PACTO',['🩸','◈','♥'][i],i)).join('')}</div></div>`);bindChoice([()=>{run.maxHp=Math.max(45,run.maxHp-25);run.hp=Math.min(run.hp,run.maxHp);run.damage*=1.45;},()=>{run.potions=Math.max(0,run.potions-1);choicesOf(upgradeDefs,2).forEach(a=>a.apply());},()=>{run.hp=run.maxHp;run.potions++;}]);return;}
 openReward(false);
}
function bindChoice(callbacks:(()=>void)[]){el('#overlay').querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{const i=Number((b as HTMLElement).dataset.choice);callbacks[i]();if(mode==='choice')dismiss();sound('pick');}));}
function openReward(fromBoss:boolean){mode='choice';mouseDown=false;
 const all:Weapon[]=['sword','hammer','bow','gun','shotgun','staff','chakram'];const options=choicesOf(all.filter(x=>!run.weapons.includes(x)),2);while(options.length<2)options.push(pick(all));
 const titles=options.map(x=>weaponNames[x]);showOverlay(`<div class="modal"><header>✦ &nbsp; ${fromBoss?'DESPOJOS DO GUARDIÃO':'TESOURO ANTIGO'}</header><h2>Escolha o que levar.</h2><p class="lead">Armas diferentes, formas diferentes de lutar. Cada descoberta entra no Arquivo para futuras expedições.</p><div class="cards">${options.map((x,i)=>card(weaponNames[x],weaponDesc[x],'NOVA ARMA',x==='hammer'?'🔨':x==='bow'?'🏹':x==='staff'?'✧':x==='shotgun'?'⚡':'⚔',i)).join('')}${card('RELIQUIÁRIO','Duas evoluções aleatórias. Mantém seu arsenal.','ARTEFATO','✦',2)}</div></div>`);
 bindChoice([()=>{run.weapons[run.slot]=options[0];discover(options[0]);},()=>{run.weapons[run.slot]=options[1];discover(options[1]);},()=>{choicesOf(upgradeDefs,2).forEach(u=>{u.apply();discover(`up-${u.id}`);});}].map(fn=>()=>{fn();if(fromBoss)advanceFloor();}));}
function rememberFloor(){floorMemory.set(run.floor,{world,blocked,rooms,mobs,loot,sigils:run.sigils});}
function restoreFloor(which:number,nearBoss=false){const snap=floorMemory.get(which);if(!snap)return false;world=snap.world;blocked=snap.blocked;rooms=snap.rooms;mobs=snap.mobs;loot=snap.loot;shots=[];particles=[];run.floor=which;run.sigils=snap.sigils;bossCurrent=mobs.find(m=>m.kind==='boss'&&!m.dead)||null;current=nearBoss?rooms.find(r=>r.kind==='boss')||rooms[0]:rooms[0];px=current.cx;py=current.cy;camera.x=px-W/2;camera.y=py-H/2;showLocation(regionNames[(which-1)%5]);return true;}
function advanceFloor(){if(run.floor>=run.maxFloor){win();return;}rememberFloor();persistSession();run.floor++;run.hp=Math.min(run.maxHp,run.hp+Math.round(run.maxHp*.26));if(!restoreFloor(run.floor))generateFloor();}
function retreatFloor(){if(run.floor<=1)return;rememberFloor();persistSession();if(restoreFloor(run.floor-1,true))showNotice('A ESCADARIA RETORNA AO ANDAR ANTERIOR',3);}
function settleExpedition(kind:'death'|'extraction'|'victory'){clearSession();
 const surviving=kind!=='death';const gained:CargoItem[]=[];
 for(const item of run.cargo){const def=MATERIALS[item.id];if(!def)continue;const qty=surviving?item.qty:def.rare?0:Math.floor(item.qty*.25);if(qty){save.stash![item.id]=(save.stash![item.id]||0)+qty;gained.push({id:item.id,qty});}}
 if(surviving){save.extractions=(save.extractions||0)+1;save.portalScrolls=(save.portalScrolls||0)+run.scrolls;}
 persistEnd(kind==='victory');(save as Save & {shopPurchased?:number}).shopPurchased=0;const previous=run;run.cargo=[];run.scrolls=0;writeSave();
 enterHub();const details=gained.map(v=>`<span class="loot-pill">${escapeHtml(MATERIALS[v.id].name)} ×${v.qty}</span>`).join('')||'<span class="muted">Nenhum material recuperado</span>';
 mode='choice';showOverlay(`<div class="modal"><header>${kind==='death'?'☠ A FRATURA TE DEVOLVEU':kind==='victory'?'✦ OS GUARDIÕES CAÍRAM':'✦ EXTRAÇÃO CONCLUÍDA'}</header><h2>${kind==='death'?'O espólio tem um preço.':'Você voltou para casa.'}</h2><p class="lead">${kind==='death'?'Equipamentos e materiais raros não extraídos foram perdidos. Apenas 25% dos materiais comuns retornaram.':'Todo o espólio foi armazenado no Cofre. Uma nova masmorra nascerá quando atravessar o portal.'}</p><div class="stat-row"><div class="stat"><b>${previous.kills}</b><small>CRIATURAS</small></div><div class="stat"><b>${previous.level}</b><small>NÍVEL</small></div><div class="stat"><b>${previous.floor}</b><small>REGIÃO</small></div><div class="stat"><b>${previous.echoes}</b><small>ECOS</small></div></div><h3>ESPÓLIO RECUPERADO</h3><div class="loot-row">${details}</div><div class="actions"><button class="btn" id="home-close">RETORNAR À CÂMARA ÂNCORA</button></div></div>`);el('#home-close').onclick=dismiss;sound(kind==='death'?'hurt':'win');
}
function win(){settleExpedition('victory');}
function gameOver(){settleExpedition('death');}
function showEnd(won:boolean){el('#hud').classList.add('hidden');showOverlay(`<div class="modal"><header>${won?'✦ O ABISMO FOI VENCIDO':'☠ A FENDA COBROU SEU PREÇO'}</header><h1>${won?'UMA LENDA NASCEU.':'A MEMÓRIA FICA.'}</h1><p class="lead">${won?'Você derrotou os guardiões, mas outros segredos ainda esperam.':'Sua build acabou, mas cada descoberta e Eco permanece no Arquivo.'}</p><div class="stat-row"><div class="stat"><b>${run.kills}</b><small>CRIATURAS</small></div><div class="stat"><b>${run.level}</b><small>NÍVEL</small></div><div class="stat"><b>${Math.floor(run.runTime/60)}m ${Math.floor(run.runTime%60)}s</b><small>TEMPO</small></div><div class="stat"><b>${run.rooms}</b><small>SALAS</small></div><div class="stat"><b>${run.echoes}</b><small>ECOS GANHOS</small></div><div class="stat"><b>${run.floor}</b><small>ANDAR</small></div></div><div class="actions"><button id="again" class="btn">✦ NOVA EXPEDIÇÃO</button><button id="to-menu" class="btn alt">MENU PRINCIPAL</button></div></div>`);
 el('#again').onclick=()=>{mode='menu';menuSelect();};el('#to-menu').onclick=()=>menu();}
function menu(){mode='menu';mouseDown=false;el('#hud').classList.add('hidden');el('#hub-status').classList.add('hidden');el('#pause-button').classList.add('hidden');showOverlay(`<div class="modal"><header>✦ &nbsp; FRACTURE · BULLETHEART</header><h1>FRACTURE</h1><div class="tag">BULLETHEART · PUBLIC BETA 1.2</div><p class="lead">Desça uma masmorra viva. Aprenda a esquivar. Encontre armas impossíveis. Transforme cada derrota em novas possibilidades.</p><div class="stat-row"><div class="stat"><b>${save.echoes}</b><small>ECOS PERMANENTES</small></div><div class="stat"><b>${save.discovered.length}</b><small>DESCOBERTAS</small></div><div class="stat"><b>${save.bestFloor}</b><small>MAIOR ANDAR</small></div><div class="stat"><b>${save.wins}</b><small>VITÓRIAS</small></div></div><div class="actions"><button class="btn" id="start">COMEÇAR EXPEDIÇÃO →</button><button class="btn alt" id="archive">O ARQUIVO</button><button class="btn alt" id="vault">RELICÁRIO</button><button class="btn alt" id="audio">SOM ${audioOn?'LIGADO':'DESLIGADO'}</button></div><div class="help"><span><kbd>WASD</kbd> Mover</span><span><kbd>CLICK</kbd> Atacar / carregar</span><span><kbd>1/2</kbd> Trocar arma</span><span><kbd>ESPAÇO</kbd> Esquivar</span><span><kbd>Q</kbd> Especial</span><span><kbd>E</kbd> Interagir</span></div></div>`);
 el('#start').onclick=()=>menuSelect();el('#archive').onclick=()=>showArchive();el('#vault').onclick=()=>showVault();el('#audio').onclick=()=>{audioOn=!audioOn;menu();};}

function showVault(){mode='archive';const upgrades=[{id:'flask',cost:80,icon:'♥',name:'Bolsa do Viajante',desc:'Uma poção adicional no início das próximas expedições.'},{id:'heart',cost:180,icon:'✚',name:'Coração Inquebrável',desc:'+20 vida máxima em todas as partidas futuras.'},{id:'forge',cost:300,icon:'⚒',name:'Herança da Forja',desc:'+10% dano inicial. O restante da build continua temporário.'}];
 showOverlay(`<div class="modal"><header>✦ &nbsp; RELICÁRIO DOS ESQUECIDOS</header><h2>Mesmo a morte deixa heranças.</h2><p class="lead">Gaste os Ecos acumulados nas expedições. Essas compras são permanentes; armas e mutações continuam sendo descobertas durante cada partida.</p><div class="stat-row"><div class="stat"><b>${save.echoes}</b><small>ECOS DISPONÍVEIS</small></div></div><div class="cards">${upgrades.map((u,i)=>card(u.name,u.desc,(save.unlocks.includes(u.id)?'ADQUIRIDO':u.cost+' ECOS'),u.icon,i)).join('')}</div><div class="actions"><button class="btn alt" id="vault-back">← VOLTAR AO MENU</button></div></div>`);
 el('#vault-back').onclick=()=>{if(hubActive)closeHubModal();else menu();};el('#overlay').querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{const u=upgrades[Number((b as HTMLElement).dataset.choice)];if(save.unlocks.includes(u.id)){alert('Esta melhoria já foi comprada.');return;}if(save.echoes<u.cost){alert('Ecos insuficientes.');return;}save.echoes-=u.cost;save.unlocks.push(u.id);writeSave();showVault();sound('level');}));}

function menuSelect(){mode='menu';showOverlay(`<div class="modal"><header>✦ &nbsp; A ÚLTIMA PORTA SE ABRE</header><h2>Quem atravessará a fenda?</h2><p class="lead">Cada caminho começa com duas armas, uma habilidade própria e um ritmo diferente. Durante a expedição, qualquer build pode se transformar.</p><div class="classes"><button class="card" data-class="wanderer"><div class="tag">MOBILIDADE / PRECISÃO</div><div class="emoji">⚔</div><h3>Caçador</h3><p>Espada e revólver. Corre veloz, esquiva duas vezes e recebe bônus ao alternar armas.</p></button><button class="card" data-class="bulwark"><div class="tag">FORÇA / IMPACTO</div><div class="emoji">🔨</div><h3>Colosso</h3><p>Martelo e arco. Resiste a golpes, controla multidões e executa esmagamentos pesados.</p></button><button class="card" data-class="arcanist"><div class="tag">MAGIA / ÁREA</div><div class="emoji">✧</div><h3>Arcanista</h3><p>Cetro e escopeta. Encadeia raios e conjura uma singularidade que puxa os inimigos.</p></button></div><div class="actions"><button class="btn alt" id="back">← VOLTAR</button></div></div>`);el('#back').onclick=menu;el('#overlay').querySelectorAll('[data-class]').forEach(e=>e.addEventListener('click',()=>begin((e as HTMLElement).dataset.class as ClassId)));}
function showArchive(){mode='archive';const weapons=['sword','hammer','bow','gun','shotgun','staff','chakram'];const entries=[...weapons,...['wanderer','bulwark','arcanist'],...upgradeDefs.map(x=>`up-${x.id}`),...Array.from({length:5},(_,i)=>`guardiao-${i+1}`)];showOverlay(`<div class="modal"><header>✦ &nbsp; CÓDICE DA FENDA</header><h2>O Arquivo</h2><p class="lead">Descobertas verdadeiras. Novas armas surgem durante expedições; algumas só são encontradas explorando salas especiais.</p><div class="stat-row"><div class="stat"><b>${save.discovered.length} / ${entries.length}</b><small>REGISTROS</small></div><div class="stat"><b>${save.echoes}</b><small>ECOS</small></div><div class="stat"><b>${save.runs}</b><small>EXPEDIÇÕES</small></div></div><div class="archive">${entries.map(n=>`<div class="card ${save.discovered.includes(n)?'':'lock'}"><div class="tag">${save.discovered.includes(n)?'DESCOBERTO':'DESCONHECIDO'}</div><b>${save.discovered.includes(n)?(weaponNames[n as Weapon]||upgradeDefs.find(a=>'up-'+a.id===n)?.name||classNames[n as ClassId]||'Guardião Derrotado'):'???'}</b><small>${save.discovered.includes(n)?'Registro preservado no Arquivo.':'Explore, experimente e descubra.'}</small></div>`).join('')}</div><div class="actions"><button id="arch-back" class="btn alt">← VOLTAR</button><button id="export" class="btn alt">EXPORTAR SAVE</button><button id="import" class="btn alt">IMPORTAR SAVE</button></div></div>`);el('#arch-back').onclick=()=>{if(hubActive)closeHubModal();else menu();};el('#export').onclick=()=>{const blob=new Blob([JSON.stringify(save,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='fracture-save.json';a.click();URL.revokeObjectURL(a.href);};el('#import').onclick=()=>{const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=async()=>{try{const o=JSON.parse(await i.files![0].text());if(!Array.isArray(o.discovered)&&!Array.isArray(o.archive))throw Error();if(Array.isArray(o.archive)&&!Array.isArray(o.discovered)){const oldMap:Record<string,string>={rust:'sword',colossus:'hammer',void:'bow',storm:'staff',echo:'chakram',shadow:'shotgun',assassin:'wanderer','colossus-class':'bulwark',arcanist:'arcanist'};const imported=[...new Set(['sword','gun','wanderer',...o.archive.map((x:string)=>oldMap[x]).filter(Boolean)])];save={...save,echoes:clamp(Number(o.echoes)||0,0,500000),bestFloor:Math.max(1,Number(o.bestFloor)||1),discovered:imported,legacy:true};}else save={...save,...o};writeSave();showArchive();}catch{alert('Arquivo de progresso inválido.');}};i.click();};}
function pause(){if(mode==='hub'){mode='pause';showOverlay('<div class="modal"><header>CÂMARA ÂNCORA</header><h2>Pausa</h2><p>A Fratura espera por você.</p><div class="actions"><button id="resume-hub" class="btn">VOLTAR À BASE</button></div></div>');el('#resume-hub').onclick=closeHubModal;return;}if(mode==='playing'){mode='pause';showOverlay(`<div class="modal"><header>✦ &nbsp; A REALIDADE AGUARDA</header><h2>Expedição em pausa</h2><p>Andar ${run.floor}, nível ${run.level}. ${run.kills} criaturas derrotadas. Nenhum segundo de progresso será perdido.</p><div class="actions"><button class="btn" id="resume">CONTINUAR</button><button class="btn alt" id="restart">NOVA PARTIDA</button><button class="btn alt" id="quit">ENCERRAR EXPEDIÇÃO</button></div></div>`);el('#resume').onclick=dismiss;el('#restart').onclick=()=>settleExpedition('death');el('#quit').onclick=()=>settleExpedition('death');}else if(mode==='pause')dismiss();}
function burst(x:number,y:number,color:string,n=10,power=125){for(let i=0;i<n;i++){const a=random(0,Math.PI*2),v=random(power*.2,power);particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:random(.18,.65),max:.65,size:random(2,6),color,kind:'spark'});}if(particles.length>450)particles.splice(0,particles.length-450);}
function damagePlayer(amount:number){if(mode!=='playing')return;if(returnCast>0){returnCast=0;castStart=null;showNotice('RITUAL INTERROMPIDO — VOCÊ FOI ATINGIDO!',2.2);}if(hitInvuln>0||dashTime>0||mode!=='playing')return;run.hp-=Math.max(1,Math.round(amount*(1-run.armor)));hitInvuln=.6;screenShake=12;screenFlash=.18;sound('hurt');burst(px,py,'#f47687',12);if(run.hp<=0){run.hp=0;gameOver();}}
function hurt(m:Mob,n:number,from?:string){if(m.dead||n<=0)return;const crit=Math.random()<run.critical;let damage=n*run.damage*(crit?1.7:1);if(from==='special')damage*=1.35;
 if(m.kind==='boss'&&m.shield>0){particles.push({x:m.x,y:m.y-35,vx:0,vy:-28,life:.6,max:.6,size:16,color:'#9dd8ff',kind:'shield'});return;}
 if(m.kind==='boss'){const at=[.70,.35];const threshold=at[m.phase];if(threshold!==undefined&&m.hp-damage<m.max*threshold){m.hp=m.max*threshold;m.phase++;m.shield=2;m.anchors=[{x:m.x-155,y:m.y+60},{x:m.x+155,y:m.y+60}];screenShake=18;showNotice(`FASE ${m.phase+1} — OS CRISTAIS RENASCERAM!`,3);sound('boss');return;}}
 m.hp-=damage;m.stun=Math.max(m.stun,from==='hammer'?.27:.08);
  burst(m.x,m.y,crit?'#ffdc7a':'#f3818e',crit?9:4,100);
  // Every real hit must be identifiable, not a 35% chance of feedback.
  particles.push({x:m.x,y:m.y,vx:0,vy:0,life:.18,max:.18,size:m.radius+12,color:crit?'#ffdc7a':'#f7a0aa',kind:'ring'});
  fxText(m.x,m.y-38,Math.round(damage)+(crit?'!':''),crit?'#ffe3a0':'#ffd4ad');
  sound('hit');
 if(run.frost&&Math.random()<Math.min(.4,run.frost*.12))m.stun=Math.max(m.stun,.65);
 if(run.lightning&&Math.random()<Math.min(.5,run.lightning*.15)){const targets=mobs.filter(o=>!o.dead&&o!==m&&distance(o,m)<180).slice(0,2);targets.forEach(o=>{linkBolt(m,o,'#87f1fb');o.hp-=damage*.28;});}
 if(run.lifesteal&&crit)run.hp=Math.min(run.maxHp,run.hp+Math.min(9,damage*run.lifesteal));
 if(m.hp<=0)kill(m);}
function fxText(x:number,y:number,text:string,color:string){particles.push({x,y,vx:0,vy:-34,life:.65,max:.65,size:14,color,kind:text});}
function linkBolt(a:XY,b:XY,color:string){for(let i=0;i<9;i++){const t=i/9;particles.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t+random(-8,8),vx:0,vy:0,life:.15,max:.15,size:5,color,kind:'spark'});}}
function kill(m:Mob){if(m.dead)return;m.dead=true;run.kills++;run.echoes+=m.kind==='boss'?0:m.kind==='elite'?8:1;const r=rooms[m.room];r.enemiesLeft=Math.max(0,r.enemiesLeft-1);burst(m.x,m.y,kinds[m.kind].color,m.kind==='boss'?48:18,220);sound('hit');
 if((m.kind==='boss'&&Math.random()<.35)||(m.kind==='elite'&&Math.random()<.045)){run.scrolls++;showNotice('✦ PERGAMINHO DE RETORNO ENCONTRADO!',3);}
 const gems=m.kind==='boss'?8:m.kind==='elite'?4:(Math.random()<.20?2:1);
 const xp=m.kind==='boss'?14:m.kind==='elite'?11:5;
 for(let i=0;i<gems;i++)loot.push({x:m.x+random(-24,24),y:m.y+random(-24,24),kind:'xp',amount:xp,label:'',room:r.id});
 if(Math.random()<(m.kind==='elite'?.65:m.kind==='boss'?1:.23)){
  const id=m.kind==='boss'?'core':m.kind==='elite'&&Math.random()<.45?'rift':m.kind==='elite'?'ember':pick(['scrap','scrap','fang','cloth']);
  loot.push({x:m.x+random(-25,25),y:m.y+random(-25,25),kind:'material',amount:m.kind==='boss'?2:1,label:MATERIALS[id].name,materialId:id,room:r.id});
 }
 if(Math.random()<.13)loot.push({x:m.x,y:m.y,kind:'coin',amount:int(3,8),label:'',room:r.id});
 if(Math.random()<.018)loot.push({x:m.x,y:m.y,kind:'heart',amount:12,label:'',room:r.id});
 if(run.explode){for(const o of mobs)if(!o.dead&&o!==m&&distance(o,m)<86+run.explode*24)hurt(o,35*run.explode,'explosion');burst(m.x,m.y,'#ed964e',32,200);}
 if(!livingEnemies(m.room))clearRoom(r);}
function addCargo(id:string,qty=1){const v=run.cargo.find(x=>x.id===id);if(v){v.qty+=qty;return true;}if(run.cargo.length>=BAG_SLOTS){showNotice('MOCHILA CHEIA — 12 ESPAÇOS',1.8);return false;}run.cargo.push({id,qty});return true;}
function collect(l:Loot){if(l.kind==='material'){if(!l.materialId||!addCargo(l.materialId,l.amount))return;const idx=loot.indexOf(l);if(idx>=0)loot.splice(idx,1);sound('pick');fxText(px,py-40,'ESPÓLIO +'+l.amount,MATERIALS[l.materialId].color);return;}
 const i=loot.indexOf(l);if(i>=0)loot.splice(i,1);
 if(l.kind==='xp')gainXP(l.amount);else if(l.kind==='coin')run.coins+=l.amount;else if(l.kind==='heart'){run.hp=Math.min(run.maxHp,run.hp+l.amount);fxText(px,py-45,'+'+l.amount,'#89e6a9');}else{const r=rooms[l.room];rewardLoot(r);}if(l.kind==='xp'||l.kind==='coin')sound('pick');}
function interact(){if(mode==='hub'){interactHub();return;}if(mode!=='playing')return;const start=rooms[0];if(start&&distance({x:px,y:py},{x:start.cx,y:start.cy})<115&&!current?.active){if(run.floor===1){settleExpedition('extraction');}else retreatFloor();return;}if(current?.kind==='boss'&&current.cleared&&distance({x:px,y:py},{x:current.cx,y:current.cy})<175){advanceFloor();return;}const l=loot.find(o=>['chest','artifact','heart'].includes(o.kind)&&distance(o,{x:px,y:py})<100);if(l)collect(l);}
function makeShot(x:number,y:number,a:number,speed:number,damage:number,enemy:boolean,kind:string,life=1.6,pierce=0,r=8){const v=vec(a,speed);shots.push({x,y,vx:v.x,vy:v.y,damage,life,enemy,kind,pierce,hit:new Set(),r});}
function hammerImpact(x:number,y:number,power:number){
 const radius=Math.min(104,65+power*12),base=45*power;
 burst(x,y,'#f5ca85',20,165);screenShake=Math.max(screenShake,11);
 for(const m of mobs){if(m.dead)continue;
  const falloff=hammerFalloff(distance(m,{x,y}),m.radius,radius);
  if(falloff>0)hurt(m,base*falloff*(m.kind==='boss'?.82:1),'hammer');
 }
 damageAnchor(x,y,radius,base);
 particles.push({x,y,vx:0,vy:0,life:.25,max:.25,size:radius,color:'#f8cf88',kind:'ring'});
}
function explosion(x:number,y:number,rad:number,dmg:number,source='hammer'){burst(x,y,source==='hammer'?'#f5ca85':'#ef8c61',26,200);screenShake=Math.max(screenShake,source==='hammer'?14:8);for(const m of mobs){if(!m.dead&&distance(m,{x,y})<rad+m.radius)hurt(m,dmg,source);}damageAnchor(x,y,rad,dmg);}
function damageAnchor(x:number,y:number,rad:number,dmg:number){for(const m of mobs){if(m.dead||m.kind!=='boss'||!m.shield)continue;for(let i=m.anchors.length-1;i>=0;i--){if(distance(m.anchors[i],{x,y})<rad+21){const anchor=m.anchors.splice(i,1)[0];m.shield--;burst(anchor.x,anchor.y,'#92e9ff',35,260);screenShake=14;sound('hit');if(m.shield===0)showNotice('PROTEÇÃO QUEBRADA — ATAQUE O GUARDIÃO!',2.3);return;}}}}
function swing(a:number,rad:number,arc:number,dmg:number){
 const origin={x:px,y:py};let hitCount=0;
 for(const m of mobs){if(!m.dead&&slashHits(origin,m,m.radius,a,rad,arc)){hurt(m,dmg,'sword');hitCount++;}}
 for(const m of mobs){
  if(m.dead||m.kind!=='boss'||!m.shield)continue;
  for(const an of [...m.anchors])if(slashHits(origin,an,23,a,rad,arc))damageAnchor(an.x,an.y,16,dmg);
 }
 particles.push({x:px,y:py,vx:a,vy:arc,life:.21,max:.21,size:rad,color:'#f7dfa5',kind:'slash'});
 if(hitCount)screenShake=Math.max(4,screenShake);
}
function shootWeapon(w:Weapon,a:number,power=1){if(mode!=='playing'||attackCD>0)return;
  const multi=Math.min(3,run.shotCount);
  weaponMotion={kind:w,time:w==='hammer'?.44:w==='sword'?.30:w==='bow'?.35:.20,duration:w==='hammer'?.44:w==='sword'?.30:w==='bow'?.35:.20};
  sound(w==='sword'||w==='hammer'?'attack':'shot');
 if(w==='sword'){attackCD=.30/run.attackRate;swing(a,112,Math.PI*.76,29*power);}
 else if(w==='hammer'){attackCD=1.07/run.attackRate;const reach=vec(a,94);hammerImpact(px+reach.x,py+reach.y,Math.min(1.73,1+(power-1)*.40));}
 else if(w==='bow'){attackCD=.36/run.attackRate;for(let i=0;i<=multi;i++)makeShot(px,py,a+(i-multi/2)*.10,710,33*power,false,'arrow',1.35,2+run.piercing,7);}
 else if(w==='gun'){attackCD=.19/run.attackRate;for(let i=0;i<=multi;i++)makeShot(px,py,a+random(-.045,.045)+(i-multi/2)*.09,830,19*power,false,'bullet',1.0,run.piercing,6);}
 else if(w==='shotgun'){attackCD=.72/run.attackRate;for(let i=0;i<7+multi*2;i++)makeShot(px,py,a+(i-(6+multi*2)/2)*.115+random(-.03,.03),630,15*power,false,'pellet',.47,0,6);screenShake=7;}
 else if(w==='staff'){attackCD=.44/run.attackRate;const sorted=mobs.filter(o=>!o.dead&&distance(o,{x:px,y:py})<440).sort((o,p)=>{const q=vec(a),dot1=(o.x-px)*q.x+(o.y-py)*q.y,dot2=(p.x-px)*q.x+(p.y-py)*q.y;return dot2-dot1;});const target=sorted.find(o=>Math.abs(Math.atan2(Math.sin(angle({x:px,y:py},o)-a),Math.cos(angle({x:px,y:py},o)-a)))<.8);if(target){let before={x:px,y:py};[target,...sorted.filter(x=>x!==target).slice(0,2+multi)].forEach((m,i)=>{linkBolt(before,m,'#a6e9ff');hurt(m,35*(i===0?1:.58)*power,'staff');before=m;});}else makeShot(px,py,a,560,30*power,false,'arcane',.7,run.piercing,11);}
 else if(w==='chakram'){attackCD=.58/run.attackRate;makeShot(px,py,a,560,39*power,false,'chakram',1.2,15,17);}
 if(run.resonance){run.resonance=Math.max(0,run.resonance-.04);} }
function attackInputStart(){if(mode!=='playing')return;const w=run.weapons[run.slot];if(w==='hammer'||w==='bow'){charging=0;chargeStarted=true;}else shootWeapon(w,aimAngle());}
function attackInputEnd(){if(mode!=='playing'){chargeStarted=false;return;}if(chargeStarted){const w=run.weapons[run.slot];shootWeapon(w,aimAngle(),1+Math.min(1.7,charging*1.15));chargeStarted=false;charging=0;}}
function aimAngle(){return Math.atan2((aim.y+camera.y)-py,(aim.x+camera.x)-px);}
function swap(slot:number){if(mode!=='playing'||slot===run.slot)return;run.slot=slot;weaponMotion.time=0;attackCD=.12;chargeStarted=false;run.resonance=Math.max(run.resonance,1);sound('pick');}
function dash(){if(mode!=='playing'||dashCD>0)return;let mx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),my=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));if(mx===0&&my===0){const a=aimAngle();mx=Math.cos(a);my=Math.sin(a);}const l=Math.hypot(mx,my)||1;dashDir={x:mx/l,y:my/l};dashTime=.18;dashCD=Math.max(.53,1.15-run.rollCharge*.18);hitInvuln=Math.max(hitInvuln,.23);sound('dash');burst(px,py,'#8de4ef',15,100);}
function special(){if(mode!=='playing'||specialCD>0)return;const c=run.classId;specialCD=c==='bulwark'?10:c==='arcanist'?9:7;sound('level');
 if(c==='bulwark'){explosion(px,py,205,125,'hammer');hitInvuln=.35;}
 else if(c==='arcanist'){for(let k=0;k<13;k++)makeShot(px,py,k*Math.PI*2/13,550,24,false,'arcane',1,2,11);for(const m of mobs)if(distance(m,{x:px,y:py})<250)m.stun=1.5;}
 else{dashCD=0;hitInvuln=.9;run.speed+=60;setTimeout(()=>{if(run)run.speed-=60;},950);for(let k=0;k<12;k++)makeShot(px,py,k*Math.PI*2/12,480,18,false,'arcane',.6,0,8);}}
function keyHandler(e:KeyboardEvent){const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' ','tab'].includes(k))e.preventDefault();keys.add(k);
 if(e.repeat)return;
 if(k==='escape'||k==='p'){pause();return;}
 if(mode==='hub'){if(k==='e')interactHub();if(k==='i')openBag(true);if(k==='m')audioOn=!audioOn;return;}
 if(mode!=='playing')return;
 if(k==='i'){openBag(false);return;}if(k==='r'){if(run.scrolls<1){showNotice('SEM PERGAMINHOS DE RETORNO',2);return;}if(returnCast<=0){returnCast=4;castStart={x:px,y:py};showNotice('RITUAL DE RETORNO — 4 SEGUNDOS',4);}return;}
 if(k==='1')swap(0);if(k==='2')swap(1);if(k===' ')dash();if(k==='q')special();if(k==='h'&&run.potions>0&&run.hp<run.maxHp){run.potions--;run.hp=Math.min(run.maxHp,run.hp+Math.round(run.maxHp*.35));sound('pick');}if(k==='e')interact();if(k==='tab')mapVisible=!mapVisible;if(k==='m')audioOn=!audioOn;}
window.addEventListener('keydown',keyHandler);window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();mouseDown=false;});
canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();aim.x=(e.clientX-r.left)/r.width*W;aim.y=(e.clientY-r.top)/r.height*H;});
canvas.addEventListener('mousedown',e=>{if(e.button!==0)return;mouseDown=true;attackInputStart();});window.addEventListener('mouseup',e=>{if(e.button!==0)return;mouseDown=false;attackInputEnd();});canvas.addEventListener('contextmenu',e=>e.preventDefault());
el('#pause-button').onclick=pause;
function enemyFire(m:Mob){const a=angle(m,{x:px,y:py});const kind=m.kind;
 if(kind==='crawler'||kind==='knight'||kind==='elite'){if(distance(m,{x:px,y:py})<m.radius+35)damagePlayer(m.attack+run.floor*2);if(kind==='elite')for(let i=-1;i<=1;i++)makeShot(m.x,m.y,a+i*.28,310,15+run.floor*2,true,'enemy',2,0,8);}
 else if(kind==='ranger'){makeShot(m.x,m.y,a,370+run.floor*12,13+run.floor*2,true,'enemy',2,0,8);}
 else if(kind==='bomber'){for(let i=-2;i<=2;i++)makeShot(m.x,m.y,a+i*.18,280,12+run.floor*2,true,'enemy',2.8,0,10);}
 else if(kind==='wisp'){for(let i=0;i<7;i++)makeShot(m.x,m.y,i*Math.PI*2/7+globalTime*.5,235+run.floor*10,11+run.floor,true,'enemy',3,0,8);}
 else if(kind==='boss'){
  const number=10+run.floor*2+m.phase*3;const pattern=Math.floor(globalTime/3)%3;
  if(pattern===0){for(let i=0;i<number;i++)makeShot(m.x,m.y,a+(i-number/2)*.15,305+m.phase*34,13+run.floor*3,true,'enemy',3.3,0,9);}
  else if(pattern===1){for(let i=0;i<number;i++)makeShot(m.x,m.y,i*Math.PI*2/number+globalTime*.4,240+m.phase*40,12+run.floor*2,true,'enemy',3.4,0,9);}
  else{for(let i=-2;i<=2;i++){const ai=a+i*.24;makeShot(m.x,m.y,ai,440+m.phase*35,15+run.floor*3,true,'enemy',2,0,9);}}
 }
}
function updateEnemies(dt:number){for(const m of mobs){if(m.dead)continue;m.cd-=dt;m.stun=Math.max(0,m.stun-dt);if(m.stun>0)continue;
 const dist=distance(m,{x:px,y:py}),a=angle(m,{x:px,y:py});m.ang=a;
 if(m.kind==='boss'&&m.shield>0){m.cd-=dt*.5;}
 if(m.windup>0){m.windup-=dt;if(m.windup<=0){enemyFire(m);const base=m.kind==='boss'?Math.max(.55,1.9-m.phase*.33-run.floor*.08):m.kind==='wisp'?2.8:m.kind==='bomber'?2.3:m.kind==='ranger'?2:m.kind==='elite'?1.5:1.0;m.cd=m.kind==='boss'?base:base/commonCadenceScale(run.floor,run.level)/(m.champion?1.12:1);}continue;}
 if(m.cd<=0&&dist<(m.kind==='boss'?650:m.kind==='ranger'?540:m.kind==='wisp'?440:m.kind==='bomber'?530:90)){m.windup=m.kind==='boss'?.75:m.kind==='ranger'?.55:m.kind==='bomber'?.7:m.kind==='wisp'?.7:.43;continue;}
 const canMove=dist<(m.kind==='boss'?600:650)&&dist>(m.kind==='ranger'?210:m.kind==='bomber'?195:m.kind==='wisp'?140:55);
 if(canMove){const v=vec(a,m.speed*dt*(m.kind==='boss'?.7:1));moveWithCollision(m,v.x,v.y,m.radius*.65);if(['ranger','wisp','bomber'].includes(m.kind)&&dist<450){const strafe=Math.sin(globalTime*1.5+m.id*2.2)*m.speed*dt*.33;const side=vec(a+Math.PI/2,strafe);moveWithCollision(m,side.x,side.y,m.radius*.65);}}
 else if(['ranger','bomber','wisp'].includes(m.kind)&&dist<120){const v=vec(a,m.speed*dt*.6);moveWithCollision(m,-v.x,-v.y,m.radius*.65);}
 }
}
function updateShots(dt:number){for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.life-=dt;if(s.life<=0){shots.splice(i,1);continue;}s.x+=s.vx*dt;s.y+=s.vy*dt;
 if(!floorAt(s.x,s.y)){shots.splice(i,1);burst(s.x,s.y,s.enemy?'#e48ea9':'#f4d695',3,70);continue;}
 if(s.enemy){if(distance(s,{x:px,y:py})<s.r+15){damagePlayer(s.damage);shots.splice(i,1);}continue;}
 for(const m of mobs){if(m.dead||s.hit.has(m.id)||distance(s,m)>s.r+m.radius)continue;s.hit.add(m.id);hurt(m,s.damage,s.kind);s.pierce--;burst(s.x,s.y,'#f5d38a',4,90);if(s.pierce<0){shots.splice(i,1);break;}if(run.bounce&&!m.dead){const o=mobs.find(o=>!o.dead&&o!==m&&distance(o,m)<200);if(o){const v=vec(angle(s,o),Math.hypot(s.vx,s.vy));s.vx=v.x;s.vy=v.y;}}}
 for(const m of mobs){if(s.enemy||s.pierce<0||!m.shield||m.kind!=='boss')continue;for(const an of [...m.anchors]){if(distance(s,an)<s.r+24){damageAnchor(an.x,an.y,18,s.damage);s.pierce--;break;}}}
 }}
function updatePlayer(dt:number){weaponMotion.time=Math.max(0,weaponMotion.time-dt);attackCD=Math.max(0,attackCD-dt);dashCD=Math.max(0,dashCD-dt);specialCD=Math.max(0,specialCD-dt);hitInvuln=Math.max(0,hitInvuln-dt);
 let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),dy=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));const len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;
 if(dashTime>0){dashTime-=dt;moveWithCollision({get x(){return px;},set x(v:number){px=v;},get y(){return py;},set y(v:number){py=v;}},dashDir.x*710*dt,dashDir.y*710*dt,14);if(Math.random()<.7)burst(px,py,'#76f4fa',1,25);}
 else{moveWithCollision({get x(){return px;},set x(v:number){px=v;},get y(){return py;},set y(v:number){py=v;}},dx*run.speed*dt,dy*run.speed*dt,15);}
 if(current?.active){
  const obj={x:px,y:py};clampCombatExit(current,obj);px=obj.x;py=obj.y;
}
 if(returnCast>0&&castStart&&distance(castStart,{x:px,y:py})>25){returnCast=0;castStart=null;showNotice('RITUAL CANCELADO AO SE MOVER',1.8);}
 if(chargeStarted){charging=Math.min(1.6,charging+dt);}
 else if(mouseDown&&['sword','gun','shotgun','staff','chakram'].includes(run.weapons[run.slot])){if(attackCD<=0)shootWeapon(run.weapons[run.slot],aimAngle(),run.resonance?1+run.resonance*.12:1);}
 for(const l of [...loot]){const dist=distance(l,{x:px,y:py});if(['xp','coin','material'].includes(l.kind)&&dist<135){l.x+=(px-l.x)/Math.max(1,dist)*500*dt;l.y+=(py-l.y)/Math.max(1,dist)*500*dt;}if(dist<28&&['xp','coin','material'].includes(l.kind))collect(l);}
 const r=roomAt(px,py);
 // Reaching the boundary of a room is not yet entering a fight.
 if(r&&battleTrigger(r,{x:px,y:py})&&(!r.seen||(r.kind==='boss'&&!r.active&&!r.cleared&&run.sigils>=2)))visitRoom(r);
 if(r&&(!current?.active||r===current))current=r;
 if(run.orbit){for(let k=0;k<run.orbit;k++){const a=globalTime*2.8+k*Math.PI*2/run.orbit;const pos={x:px+Math.cos(a)*88,y:py+Math.sin(a)*88};for(const m of mobs)if(!m.dead&&distance(pos,m)<m.radius+13&&Math.random()<dt*3)hurt(m,22,'orbit');}}
 camera.x+=(px-W/2-camera.x)*Math.min(1,dt*7);camera.y+=(py-H/2-camera.y)*Math.min(1,dt*7);
}
function tick(dt:number){globalTime+=dt;run.runTime+=dt;sessionTimer+=dt;if(sessionTimer>=5){sessionTimer=0;persistSession();}if(returnCast>0){returnCast-=dt;if(returnCast<=0){returnCast=0;if(run.scrolls>0){run.scrolls--;settleExpedition('extraction');}return;}el('#notice').textContent='✦ RETORNO À CÂMARA ÂNCORA EM '+returnCast.toFixed(1)+'s — NÃO SE MOVA';el('#notice').style.opacity='1';noticeTimer=.2;}noticeTimer-=dt;locationTimer-=dt;screenShake=Math.max(0,screenShake-dt*35);screenFlash=Math.max(0,screenFlash-dt);
 if(noticeTimer<=0)el('#notice').style.opacity='0';if(locationTimer<=0)el('#location-toast').style.opacity='0';
 updatePlayer(dt);if(mode!=='playing')return;updateEnemies(dt);if(mode!=='playing')return;updateShots(dt);ambience(dt);
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.life<=0)particles.splice(i,1);}
 mobs=mobs.filter(m=>!m.dead||m.kind==='boss'&&m.hp>0);
 updateHud();}
function updateHud(){el('#hp-text').textContent=`${Math.ceil(run.hp)} / ${run.maxHp}`;el('#hp-bar').style.width=`${clamp(run.hp/run.maxHp*100,0,100)}%`;el('#xp-text').textContent=`NÍVEL ${run.level} · XP ${Math.round(run.xp)}/${run.nextXp}`;el('#xp-bar').style.width=`${run.xp/run.nextXp*100}%`;el('#floor-text').textContent=`REGIÃO ${run.floor}/5`;el('#coin-text').textContent=String(run.coins);el('#weapon-name1').textContent=weaponNames[run.weapons[0]];el('#weapon-name2').textContent=weaponNames[run.weapons[1]];el('#weapon-desc1').textContent=weaponDesc[run.weapons[0]];el('#weapon-desc2').textContent=weaponDesc[run.weapons[1]];(el('#weapon-icon1') as HTMLImageElement).src=`./assets/oss-icons/${weaponIcon[run.weapons[0]]}.svg`;(el('#weapon-icon2') as HTMLImageElement).src=`./assets/oss-icons/${weaponIcon[run.weapons[1]]}.svg`;el('#weapon1').classList.toggle('selected',run.slot===0);el('#weapon2').classList.toggle('selected',run.slot===1);el('#potions').textContent=String(run.potions);el('#dash-cool').style.width=`${(1-clamp(dashCD/(1.15-run.rollCharge*.18),0,1))*100}%`;el('#special-cool').style.width=`${(1-clamp(specialCD/10,0,1))*100}%`;
 const boss=mobs.find(m=>m.kind==='boss'&&!m.dead);el('#boss-ui').classList.toggle('hidden',!boss);if(boss){el('#boss-name').textContent=`GUARDIÃO · ${boss.shield?'ESCUDO ATIVO':'VULNERÁVEL'}`;el('#boss-bar').style.width=`${boss.hp/boss.max*100}%`;}
 drawMap();}
function drawMap(){const target=el('#map');target.classList.toggle('hidden',!mapVisible);if(!mapVisible)return;
  // Rebuilding a map canvas on every render frame wastes CPU. A short
  // throttle has no gameplay effect and resets safely across expeditions.
  if(globalTime>=lastMapPaint&&globalTime-lastMapPaint<.18)return;
  lastMapPaint=globalTime;let cv=target.querySelector('canvas') as HTMLCanvasElement|null;if(!cv){cv=document.createElement('canvas');cv.width=150;cv.height=130;target.append(cv);}const m=cv.getContext('2d')!;m.clearRect(0,0,150,130);const gx=rooms.map(x=>x.gx),gy=rooms.map(x=>x.gy),mnx=Math.min(...gx),mxx=Math.max(...gx),mny=Math.min(...gy),mxy=Math.max(...gy),step=Math.min(21,125/(mxx-mnx+1),104/(mxy-mny+1)),ox=(150-(mxx-mnx+1)*step)/2,oy=(130-(mxy-mny+1)*step)/2;
 for(const room of rooms){if(!room.seen)continue;for(const n of room.connections){const r=rooms[n];if(!r.seen)continue;m.strokeStyle='#546b7a';m.lineWidth=3;m.beginPath();m.moveTo(ox+(room.gx-mnx+.5)*step,oy+(room.gy-mny+.5)*step);m.lineTo(ox+(r.gx-mnx+.5)*step,oy+(r.gy-mny+.5)*step);m.stroke();}}
 for(const room of rooms){if(!room.seen)continue;m.fillStyle=room===current?'#f4d48e':room.kind==='boss'?'#db7096':room.cleared?'#668a93':'#c0a3de';m.fillRect(ox+(room.gx-mnx)*step+2,oy+(room.gy-mny)*step+2,Math.max(3,step-5),Math.max(3,step-5));}}
function image(id:string,x:number,y:number,w:number,h:number,opacity=1){const im=assets[id];if(!im?.complete||!im.naturalWidth)return;g.globalAlpha=opacity;g.drawImage(im,x-w/2,y-h/2,w,h);g.globalAlpha=1;}
function glow(x:number,y:number,r:number,color:string,strength=.2){const gg=g.createRadialGradient(x,y,0,x,y,r);gg.addColorStop(0,color.replace('ALPHA',String(strength)));gg.addColorStop(1,color.replace('ALPHA','0'));g.fillStyle=gg;g.fillRect(x-r,y-r,r*2,r*2);}
function drawWorld(){g.save();
  // The world stays fixed under the cursor even when taking damage.
  // Combat impact feedback now lives on enemies, not in camera shake.
  g.translate(-Math.round(camera.x),-Math.round(camera.y));
 const x0=Math.floor(camera.x/T)-1,y0=Math.floor(camera.y/T)-1,x1=x0+Math.ceil(W/T)+3,y1=y0+Math.ceil(H/T)+3;let floorType=Math.min(4,Math.max(0,run.floor-1));
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(!world.has(tileKey(x,y)))continue;const wx=x*T,wy=y*T;
  image(`floor${floorType}`,wx+T/2,wy+T/2,T,T);const hash=(x*73856093^y*19349663)>>>0;
  if(hash%21===0){g.strokeStyle='#a3a7b31c';g.lineWidth=1;g.beginPath();g.moveTo(wx+12,wy+9);g.lineTo(wx+18,wy+20);g.lineTo(wx+27,wy+23);g.stroke();}
  if(!world.has(tileKey(x,y-1))){image('wall',wx+T/2,wy+T/2-20,T,50);g.fillStyle='#99b6ca32';g.fillRect(wx,wy-19,T,3);}
  if(!world.has(tileKey(x,y+1))){g.fillStyle='#09121d';g.fillRect(wx,wy+T-9,T,9);g.fillStyle='#4b5267';g.fillRect(wx,wy+T-12,T,3);}
  if(!world.has(tileKey(x-1,y))){g.fillStyle='#1c2937';g.fillRect(wx,wy,10,T);g.fillStyle='#61758b';g.fillRect(wx+8,wy,3,T);}
  if(!world.has(tileKey(x+1,y))){g.fillStyle='#1c2937';g.fillRect(wx+T-9,wy,9,T);g.fillStyle='#64748a';g.fillRect(wx+T-12,wy,3,T);}
  if(blocked.has(tileKey(x,y)))image('pillar',wx+T/2,wy+T/2-11,55,74);
 }
 if(hubActive)drawHubStations();
 for(const r of rooms){if(!r.seen)continue;
  // Distinct floor motifs identify the room before text or loot is read.
  g.save();g.translate(r.cx,r.cy);g.globalAlpha=.35;
  if(r.kind==='battle'||r.kind==='elite'){g.strokeStyle=r.kind==='elite'?'#eea66a':'#859cb2';g.lineWidth=r.kind==='elite'?6:3;g.beginPath();g.ellipse(0,0,200,115,0,0,Math.PI*2);g.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4;g.fillStyle='#e4c68a';g.fillRect(Math.cos(a)*180-3,Math.sin(a)*103-3,6,6);}}
  if(r.kind==='forge'){g.fillStyle='#8c533e';g.fillRect(-145,-96,290,192);g.fillStyle='#b18b55';for(let i=-2;i<=2;i++)g.fillRect(i*45-7,-92,14,184);}
  if(r.kind==='treasure'){g.fillStyle='#69522a';g.fillRect(-135,-85,270,170);g.strokeStyle='#dfad62';g.lineWidth=7;g.strokeRect(-133,-83,266,166);}
  if(r.kind==='heal'){g.fillStyle='#2d8391';g.beginPath();g.arc(0,0,106,0,Math.PI*2);g.fill();g.strokeStyle='#9deafa';g.lineWidth=9;g.stroke();}
  if(r.kind==='secret'){g.strokeStyle='#b3a0f3';g.lineWidth=7;for(let i=0;i<3;i++){g.beginPath();g.arc(0,0,75+i*40,0,Math.PI*2);g.stroke();}}
  if(r.kind==='boss'){g.fillStyle='#7e293d';g.beginPath();g.arc(0,0,175,0,Math.PI*2);g.fill();g.strokeStyle='#ed9478';g.lineWidth=8;g.stroke();for(let i=0;i<6;i++){const a=i*Math.PI/3;g.fillStyle='#dcb3a0';g.fillRect(Math.cos(a)*140-9,Math.sin(a)*140-9,18,18);}}
  g.restore();
  if((r.kind==='boss'&&!r.active)||r.kind==='shrine'||r.kind==='secret'){image('altar',r.cx,r.cy,78,94,.95);glow(r.cx,r.cy,115,'rgba(146,99,255,ALPHA)',.20);}
  if(r.kind==='start'||r.kind==='forge'){image('torch',r.cx-160,r.cy-116,53,64);image('torch',r.cx+160,r.cy-116,53,64);glow(r.cx-160,r.cy-116,150,'rgba(251,145,68,ALPHA)',.18);glow(r.cx+160,r.cy-116,150,'rgba(251,145,68,ALPHA)',.18);}
  if(r.kind==='elite'){g.strokeStyle='#bb698a60';g.lineWidth=6;g.beginPath();g.arc(r.cx,r.cy,116,0,Math.PI*2);g.stroke();}
  if(r.active){g.fillStyle='#c94e6966';for(const n of r.connections){const o=rooms[n];const direction=Math.atan2(o.cy-r.cy,o.cx-r.cx);const v=vec(direction,T*7.3);const tx=r.cx+v.x,ty=r.cy+v.y;g.save();g.translate(tx,ty);g.rotate(direction+Math.PI/2);g.fillRect(-66,-8,132,16);g.strokeStyle='#ed6b80';g.strokeRect(-66,-8,132,16);g.restore();}}
 }
 for(const l of loot){const y=l.y+Math.sin(globalTime*3+l.x)*7;
  if(l.kind==='xp'){g.fillStyle='#71ede2';g.shadowColor='#7be8d9';g.shadowBlur=13;g.save();g.translate(l.x,y);g.rotate(Math.PI/4);g.fillRect(-5,-5,10,10);g.restore();g.shadowBlur=0;}
  else if(l.kind==='coin'){g.fillStyle='#efc377';g.shadowColor='#ffcd73';g.shadowBlur=12;g.beginPath();g.arc(l.x,y,7,0,Math.PI*2);g.fill();g.shadowBlur=0;}
  else if(l.kind==='material'){g.shadowColor=MATERIALS[l.materialId||'scrap'].color;g.shadowBlur=16;g.fillStyle=MATERIALS[l.materialId||'scrap'].color;g.save();g.translate(l.x,y);g.rotate(Math.PI/4);g.fillRect(-10,-10,20,20);g.restore();g.shadowBlur=0;}
  else if(l.kind==='heart')image('potion',l.x,y,40,49);
  else image(l.kind==='chest'?'chest':'altar',l.x,y,67,70);
  if(['chest','artifact'].includes(l.kind)&&distance(l,{x:px,y:py})<110){g.fillStyle='#f0deb7';g.font='bold 15px sans-serif';g.textAlign='center';g.fillText('[ E ] ABRIR',l.x,l.y-48);}
 }
 // Danger telegraphs: ring and cone before each attack.
 for(const m of mobs){if(m.dead)continue;if(m.windup>0){g.strokeStyle=m.kind==='boss'?'#f77d9ecc':'#f9b86b99';g.lineWidth=2;g.setLineDash([8,5]);g.beginPath();if(m.kind==='boss'){g.arc(m.x,m.y,130+Math.sin(globalTime*9)*5,0,Math.PI*2);}else{g.arc(m.x,m.y,m.kind==='ranger'?35:Math.max(33,m.radius+18),m.ang-.5,m.ang+.5);}g.stroke();g.setLineDash([]);}
  g.fillStyle='#0507137f';g.beginPath();g.ellipse(m.x,m.y+22,m.radius*1.1,10,0,0,Math.PI*2);g.fill();
  if(m.champion){g.strokeStyle='#eec674';g.lineWidth=3;g.beginPath();g.arc(m.x,m.y+6,m.radius+12,0,Math.PI*2);g.stroke();g.fillStyle='#f3cf87';g.font='bold 12px sans-serif';g.textAlign='center';g.fillText('✦',m.x,m.y-55);}
  const h=m.kind==='boss'?118:65,w=m.kind==='boss'?122:60;
  image(m.kind,m.x,m.y-11+Math.sin(globalTime*6+m.id)*2,w,h, m.stun>0?.65:1);
  if(m.kind==='boss'&&m.shield>0){g.strokeStyle='#8ce8ff';g.lineWidth=3;g.beginPath();g.arc(m.x,m.y,83+Math.sin(globalTime*4)*8,0,Math.PI*2);g.stroke();for(const a of m.anchors){image('altar',a.x,a.y,49,61);glow(a.x,a.y,110,'rgba(103,204,249,ALPHA)',.30);g.strokeStyle='#7accfe88';g.beginPath();g.moveTo(a.x,a.y);g.lineTo(m.x,m.y);g.stroke();}}
  if(m.kind!=='boss'){g.fillStyle='#101526';g.fillRect(m.x-24,m.y-48,48,6);g.fillStyle=m.champion?'#efc872':m.kind==='elite'?'#e2b462':'#eb788e';g.fillRect(m.x-23,m.y-47,46*clamp(m.hp/m.max,0,1),4);}
 }
 // Projectiles clearly distinguish player arrows, bullets, discs and enemy attacks.
 for(const s of shots){g.save();g.translate(s.x,s.y);const a=Math.atan2(s.vy,s.vx);g.rotate(a);if(s.enemy){g.shadowColor='#fa6691';g.shadowBlur=13;g.fillStyle='#f36a8d';g.beginPath();g.arc(0,0,s.r,0,Math.PI*2);g.fill();g.fillStyle='#ffc3d4';g.fillRect(-2,-2,4,4);}
  else if(s.kind==='arrow'){g.fillStyle='#eacb8c';g.fillRect(-24,-2,37,4);g.fillStyle='#fff2c0';g.beginPath();g.moveTo(24,0);g.lineTo(11,-7);g.lineTo(11,7);g.fill();g.fillStyle='#9ad1d0';g.fillRect(-23,-6,8,12);}
  else if(s.kind==='chakram'){g.rotate(globalTime*16);g.strokeStyle='#ceafff';g.lineWidth=6;g.beginPath();g.arc(0,0,16,0,Math.PI*2);g.stroke();g.fillStyle='#fff';g.fillRect(-2,-2,4,4);}
  else{g.shadowColor=s.kind==='arcane'?'#78cafa':'#f1bf67';g.shadowBlur=12;g.fillStyle=s.kind==='arcane'?'#91e9fd':s.kind==='pellet'?'#f3aa60':'#ffdf8b';g.beginPath();g.ellipse(0,0,s.kind==='arcane'?12:8,s.kind==='arcane'?6:4,0,0,Math.PI*2);g.fill();}
  g.restore();g.shadowBlur=0;
 }
 // Draw player, weapon direction and charged attack warning.
 if(hitInvuln>0&&Math.floor(globalTime*21)%2)g.globalAlpha=.62;
 g.fillStyle='#02050b99';g.beginPath();g.ellipse(px,py+23,25,10,0,0,Math.PI*2);g.fill();
 image(run.classId==='wanderer'?'wanderer':run.classId==='bulwark'?'bulwark':'arcanist',px,py-9,62,76);
 const a=aimAngle();g.save();g.translate(px,py-2);g.rotate(a);g.lineCap='round';
  const weapon=run.weapons[run.slot];
  const action=weaponMotion.kind===weapon&&weaponMotion.time>0
    ?1-weaponMotion.time/weaponMotion.duration:0;
  if(action>0){
    if(weapon==='sword')g.rotate((action-.5)*1.35);
    else if(weapon==='hammer')g.rotate((action-.45)*1.0);
    else if(weapon==='bow')g.translate(-Math.sin(action*Math.PI)*11,0);
    else g.translate(-Math.sin(action*Math.PI)*9,0);
  }
 if(weapon==='hammer'){g.strokeStyle='#b58d64';g.lineWidth=8;g.beginPath();g.moveTo(10,-2);g.lineTo(54,-2);g.stroke();g.fillStyle='#c6ad79';g.fillRect(47,-21,22,38);g.fillStyle='#efdd9d';g.fillRect(47,-21,22,5);}
 else if(weapon==='sword'){g.strokeStyle='#edd5aa';g.lineWidth=5;g.beginPath();g.moveTo(10,0);g.lineTo(65,0);g.stroke();g.strokeStyle='#91deed';g.lineWidth=3;g.beginPath();g.moveTo(31,-1);g.lineTo(63,-1);g.stroke();g.strokeStyle='#caa372';g.lineWidth=8;g.beginPath();g.moveTo(19,-11);g.lineTo(19,11);g.stroke();}
 else if(weapon==='bow'){g.strokeStyle='#dcab76';g.lineWidth=5;g.beginPath();g.arc(33,0,27,-1.2,1.2);g.stroke();g.strokeStyle='#ecf2df';g.lineWidth=2;g.beginPath();g.moveTo(43,-25);g.lineTo(15,0);g.lineTo(43,25);g.stroke();}
 else if(weapon==='shotgun'||weapon==='gun'){g.fillStyle='#a7adba';g.fillRect(15,-6,weapon==='shotgun'?53:41,12);g.fillStyle='#e5be76';g.fillRect(17,5,13,17);g.fillStyle='#465c6f';g.fillRect(35,-8,20,4);}
 else if(weapon==='staff'){g.strokeStyle='#8c6ca5';g.lineWidth=8;g.beginPath();g.moveTo(10,0);g.lineTo(65,0);g.stroke();g.fillStyle='#90e1ed';g.beginPath();g.moveTo(68,0);g.lineTo(58,-13);g.lineTo(50,0);g.lineTo(58,13);g.fill();}
 else{g.strokeStyle='#d3aaf3';g.lineWidth=7;g.beginPath();g.moveTo(15,0);g.lineTo(52,0);g.stroke();g.strokeStyle='#9fe6f4';g.beginPath();g.arc(58,0,14,0,Math.PI*2);g.stroke();}
 if(chargeStarted){g.strokeStyle='#e9cf8c';g.lineWidth=4;g.beginPath();g.arc(0,0,52,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp(charging/1.5,0,1));g.stroke();}
 g.restore();g.globalAlpha=1;
 if(dashTime>0)glow(px,py,110,'rgba(135,225,248,ALPHA)',.25);
 if(run.orbit)for(let i=0;i<run.orbit;i++){const a=globalTime*2.8+i*Math.PI*2/run.orbit;const x=px+Math.cos(a)*88,y=py+Math.sin(a)*88;g.fillStyle='#e9bffe';g.save();g.translate(x,y);g.rotate(a);g.fillRect(-9,-9,18,18);g.restore();}
 if(!hubActive&&run.floor>=1){const entrance=rooms[0];if(entrance&&distance({x:px,y:py},{x:entrance.cx,y:entrance.cy})<600){g.fillStyle='#b1a0fb';g.font='bold 17px sans-serif';g.textAlign='center';g.fillText(run.floor===1?'PORTAL DE EXTRAÇÃO · [E]':'ESCADA DE RETORNO · [E]',entrance.cx,entrance.cy-130);g.strokeStyle='#9e85fb';g.lineWidth=5;g.beginPath();g.arc(entrance.cx,entrance.cy,68,0,Math.PI*2);g.stroke();}}
 for(const p of particles){const o=clamp(p.life/p.max,0,1);g.globalAlpha=o;if(p.kind==='slash'){
   // The shaded sector is the damage zone; the bright curve marks MAXIMUM reach.
   g.save();g.translate(p.x,p.y);
   g.fillStyle=`rgba(255,211,135,${(.15*o).toFixed(3)})`;
   g.beginPath();g.moveTo(0,0);g.arc(0,0,p.size,p.vx-p.vy/2,p.vx+p.vy/2);g.closePath();g.fill();
   g.strokeStyle=p.color;g.lineWidth=9*o;
   g.beginPath();g.arc(0,0,p.size,p.vx-p.vy/2,p.vx+p.vy/2);g.stroke();
   g.restore();
  }
  else if(p.kind==='ring'){g.strokeStyle=p.color;g.lineWidth=8*o;g.beginPath();g.arc(p.x,p.y,p.size*(1.5-o*.5),0,Math.PI*2);g.stroke();}
  else if(p.kind==='spark'){g.fillStyle=p.color;g.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);}
  else {g.font=`bold ${Math.ceil(p.size*(1.3-o*.3))}px monospace`;g.textAlign='center';g.fillStyle=p.color;g.fillText(p.kind==='shield'?'IMUNE':p.kind,p.x,p.y);}}
 g.globalAlpha=1;
 // Faux torchlight / world warmth without obscuring gameplay.
 for(const r of rooms){if(!r.seen)continue;if(r.kind==='start'||r.kind==='forge'){glow(r.cx-160,r.cy-116,165,'rgba(255,148,71,ALPHA)',.18);glow(r.cx+160,r.cy-116,165,'rgba(255,148,71,ALPHA)',.18);}}
 g.restore();}

type StoredFloor={world:string[];blocked:string[];rooms:Room[];mobs:Mob[];loot:Loot[];sigils:number};
let sessionTimer=0;
const packFloor=(value:FloorMemory):StoredFloor=>({world:[...value.world],blocked:[...value.blocked],rooms:value.rooms,mobs:value.mobs,loot:value.loot,sigils:value.sigils});
const unpackFloor=(value:StoredFloor):FloorMemory=>({world:new Set(value.world),blocked:new Set(value.blocked),rooms:value.rooms,mobs:value.mobs,loot:value.loot,sigils:value.sigils});
function clearSession(){try{localStorage.removeItem(SESSION_KEY);}catch{}}
function persistSession(){if(hubActive||!run||run.hp<=0)return;try{const memory=[...floorMemory].map(([id,f])=>[id,packFloor(f)]);const raw={version:1,run,world:[...world],blocked:[...blocked],rooms,mobs,loot,px,py,currentId:current?.id??0,memory,nextMob};localStorage.setItem(SESSION_KEY,JSON.stringify(raw));}catch{}}
function restoreSession():boolean{try{const data=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');if(!data||data.version!==1||!data.run||!Array.isArray(data.rooms)||!Array.isArray(data.world)||!Array.isArray(data.mobs)||!Array.isArray(data.loot)||data.world.length>15000||data.mobs.length>1500||data.run.hp<=0||!['wanderer','bulwark','arcanist'].includes(data.run.classId))return false;
 run=data.run;run.cargo||=[];run.scrolls||=0;rooms=data.rooms;world=new Set(data.world);blocked=new Set(data.blocked);mobs=data.mobs;loot=data.loot;shots=[];particles=[];floorMemory=new Map((data.memory||[]).map(([id,f]:[number,StoredFloor])=>[id,unpackFloor(f)]));px=data.px;py=data.py;nextMob=data.nextMob||1;current=rooms.find(q=>q.id===data.currentId)||rooms[0]||null;camera.x=px-W/2;camera.y=py-H/2;hubActive=false;mode='playing';el('#hud').classList.remove('hidden');el('#hub-status').classList.add('hidden');el('#pause-button').classList.remove('hidden');el('#footer-hint').textContent='EXPEDIÇÃO · I MOCHILA · R RETORNO (4s) · E NÓ ZERO · WASD · ESPAÇO · Q';showNotice('EXPEDIÇÃO RECUPERADA. A MASMORRA NÃO MUDOU.',3.5);return true;
 }catch{return false;}}
window.addEventListener('pagehide',()=>{if(!hubActive&&run?.hp>0)persistSession();});

// The Anchor Chamber is a permanent, walkable place. It is NEVER procedurally regenerated.
function enterHub(){clearSession();hubActive=true;returnCast=0;castStart=null;run=createRun(save.preferredClass||'wanderer');world=new Set();blocked=new Set();rooms=[];mobs=[];shots=[];loot=[];particles=[];current=null;for(let x=-12;x<=12;x++)for(let y=-8;y<=8;y++)world.add(tileKey(HUB.x/T+x,HUB.y/T+y));px=HUB.x;py=HUB.y+35;camera.x=px-W/2;camera.y=py-H/2;mode='hub';el('#overlay').innerHTML='';el('#hud').classList.add('hidden');el('#hub-status').classList.remove('hidden');updateHubLabel();el('#pause-button').classList.remove('hidden');el('#footer-hint').textContent='CÂMARA ÂNCORA · WASD MOVER · E INTERAGIR · I MOCHILA · ESC PAUSAR';showLocation('CÂMARA ÂNCORA');}
function updateHub(dt:number){globalTime+=dt;noticeTimer-=dt;locationTimer-=dt;let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),dy=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));const len=Math.hypot(dx,dy)||1;moveWithCollision({get x(){return px;},set x(v:number){px=v;},get y(){return py;},set y(v:number){py=v;}},dx/len*240*dt,dy/len*240*dt,15);camera.x+=(px-W/2-camera.x)*Math.min(1,dt*8);camera.y+=(py-H/2-camera.y)*Math.min(1,dt*8);if(noticeTimer<=0)el('#notice').style.opacity='0';if(locationTimer<=0)el('#location-toast').style.opacity='0';}
function updateHubLabel(){el('#hub-echoes').textContent=String(save.echoes);el('#hub-scrolls').textContent=String(save.portalScrolls||0);el('#hub-extractions').textContent=String(save.extractions||0);}
function drawHubStations(){
 for(const station of hubStations){const near=distance(station,{x:px,y:py})<135;g.save();g.translate(station.x,station.y);
 g.shadowColor=station.color;g.shadowBlur=near?35:17;g.fillStyle='#1b2438';g.strokeStyle=station.color;g.lineWidth=near?7:4;g.beginPath();g.roundRect(-75,-49,150,98,15);g.fill();g.stroke();g.shadowBlur=0;
 if(station.id==='portal'){g.strokeStyle='#bd9eff';g.lineWidth=7;g.beginPath();g.ellipse(0,0,42,44,0,0,Math.PI*2);g.stroke();glow(0,0,65,'rgba(157,115,250,ALPHA)',.27);}else if(station.id==='forge'){image('altar',0,-7,70,71);g.fillStyle='#e4a570';g.fillRect(-37,29,74,12);}else if(station.id==='merchant'){image('chest',0,0,76,69);}else if(station.id==='vault'){image('chest',0,0,77,72);}else if(station.id==='altar'){image('altar',0,-8,69,77);}else {g.fillStyle='#c9b9f0';g.font='bold 45px Georgia';g.textAlign='center';g.fillText('✧',0,11);}
 g.textAlign='center';g.font='bold 13px sans-serif';g.fillStyle='#f7e9c9';g.fillText(station.label,0,-67);if(near){g.fillStyle='#ffe1a4';g.font='bold 15px sans-serif';g.fillText('[ E ] INTERAGIR',0,84);}g.restore();
 }
 g.font='bold 17px Georgia';g.fillStyle='#dfcba6';g.textAlign='center';g.fillText('CÂMARA ÂNCORA',HUB.x,HUB.y-385);g.font='13px sans-serif';g.fillText('FORA DESTAS PAREDES, TUDO SE REFAZ',HUB.x,HUB.y-356);
}
function interactHub(){if(mode!=='hub')return;const st=hubStations.find(q=>distance(q,{x:px,y:py})<145);if(!st){showNotice('APROXIME-SE DE UMA ESTRUTURA PARA INTERAGIR',2);return;}if(st.id==='portal'){begin(save.preferredClass||'wanderer');showNotice('UMA NOVA MASMORRA SE FORMOU · RETORNE VIVO COM SEU ESPÓLIO',4);return;}if(st.id==='forge')openForge();if(st.id==='merchant')openMerchant();if(st.id==='vault')openStash();if(st.id==='altar')openAltar();if(st.id==='archive')showArchive();}
function backHome(){enterHub();}
function closeHubModal(){el('#overlay').innerHTML='';mode='hub';updateHubLabel();}
function openBag(fromHub:boolean){const cargo=fromHub?Object.entries(save.stash||{}).filter(([,q])=>q>0).map(([id,qty])=>({id,qty})):run.cargo;
 mode='choice';showOverlay(`<div class="modal"><header>✦ ${fromHub?'ARMAZÉM':'MOCHILA DO VIAJANTE'}</header><h2>${fromHub?'Espólio assegurado':'Espólio em risco'}</h2><p class="lead">${fromHub?'Os materiais no Cofre não desaparecem quando você morre.':'Extraia pelo portal do primeiro nó ou use um Pergaminho de Retorno. Ao morrer, apenas 25% dos materiais comuns são recuperados.'}</p><div class="stat-row"><div class="stat"><b>${cargo.length} / ${BAG_SLOTS}</b><small>TIPOS DE MATERIAL</small></div><div class="stat"><b>${fromHub?(save.portalScrolls||0):run.scrolls}</b><small>PERGAMINHOS</small></div></div><div class="cargo-grid">${cargo.length?cargo.map(v=>`<div class="cargo-entry ${MATERIALS[v.id]?.rare?'rare':''}"><strong>${escapeHtml(MATERIALS[v.id]?.name||v.id)}</strong><span>×${v.qty}</span><small>${MATERIALS[v.id]?.rare?'RARO':'COMUM'}</small></div>`).join(''):'<div class="muted">Ainda não há materiais.</div>'}</div><div class="actions"><button id="close-bag" class="btn">FECHAR · VOLTAR AO JOGO</button></div></div>`);el('#close-bag').onclick=()=>{if(fromHub)closeHubModal();else dismiss();};}
function openStash(){mode='choice';const stash=save.stash||{};showOverlay(`<div class="modal"><header>◈ CÂMARA ÂNCORA</header><h2>O Cofre</h2><p class="lead">Todo material recuperado em extração é transferido automaticamente para cá. A morte nunca esvazia o Cofre.</p><div class="cargo-grid">${Object.entries(MATERIALS).map(([id,m])=>`<div class="cargo-entry ${m.rare?'rare':''}"><strong>${m.name}</strong><span>×${stash[id]||0}</span><small>${m.rare?'RARO':'COMUM'}</small></div>`).join('')}</div><div class="stat-row"><div class="stat"><b>${save.portalScrolls||0}</b><small>PERGAMINHOS SEGUROS</small></div><div class="stat"><b>${save.extractions||0}</b><small>EXTRAÇÕES VIVAS</small></div></div><div class="actions"><button class="btn" id="close-stash">VOLTAR À BASE</button></div></div>`);el('#close-stash').onclick=closeHubModal;}
function openMerchant(){mode='choice';const list=Object.entries(save.stash||{}).filter(([k,q])=>q>0&&MATERIALS[k]);const options=list.map(([id,q],i)=>card(MATERIALS[id].name,'Vender '+q+' unidades por '+q*MATERIALS[id].value+' Ecos.','ESPÓLIO · '+q+'x','◆',i)).join('');showOverlay(`<div class="modal"><header>✦ MERCADOR DA ÂNCORA</header><h2>Mercadorias recuperadas</h2><p class="lead">Venda materiais armazenados ou compre um Pergaminho de Retorno. A loja possui apenas uma unidade entre duas extrações.</p><div class="stat-row"><div class="stat"><b>${save.echoes}</b><small>ECOS</small></div><div class="stat"><b>${Math.max(0,1-(save as Save & {shopPurchased?:number}).shopPurchased!)||0}</b><small>PERGAMINHO DISPONÍVEL</small></div></div><div class="cards">${options||'<p>Volte de uma expedição com espólio.</p>'}</div><div class="actions"><button class="btn" id="buy-scroll">COMPRAR PERGAMINHO · 90 ECOS</button><button class="btn alt" id="close-merchant">VOLTAR À BASE</button></div></div>`);
 el('#close-merchant').onclick=closeHubModal;el('#buy-scroll').onclick=()=>{const sv=save as Save & {shopPurchased?:number};if((sv.shopPurchased||0)>=1){showNotice('MERCADOR SEM PERGAMINHOS — VOLTE APÓS UMA EXPEDIÇÃO',3);return;}if(save.echoes<90){showNotice('ECOS INSUFICIENTES',2);return;}save.echoes-=90;sv.shopPurchased=1;save.portalScrolls=(save.portalScrolls||0)+1;writeSave();openMerchant();};el('#overlay').querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{const row=list[Number((b as HTMLElement).dataset.choice)];if(!row)return;const [id,q]=row;save.echoes+=q*MATERIALS[id].value;save.stash![id]=0;writeSave();openMerchant();sound('pick');}));}
function craftNeed(need:Record<string,number>,echoes=0){return save.echoes>=echoes&&Object.entries(need).every(([id,q])=>(save.stash?.[id]||0)>=q);}
function spendCraft(need:Record<string,number>,echoes=0){if(!craftNeed(need,echoes))return false;for(const [id,q] of Object.entries(need))save.stash![id]-=q;save.echoes-=echoes;writeSave();return true;}
function openForge(){mode='choice';const recipes:{name:string;detail:string;need:Record<string,number>;echo:number;do:()=>void}[]=[
 {name:'Pergaminho de Retorno',detail:'2 Ferro da Cripta + 1 Brasa Antiga. Teleporte seguro de 4 segundos.',need:{scrap:2,ember:1},echo:0,do:()=>save.portalScrolls=(save.portalScrolls||0)+1},
 {name:'Estoque de Poções',detail:'3 Presas + 1 Fio Espectral. +1 poção na próxima expedição.',need:{fang:3,cloth:1},echo:0,do:()=>save.preparedPotion=Math.min(2,(save.preparedPotion||0)+1)},
 {name:'Martelo da Próxima Jornada',detail:'3 Ferro + 2 Brasa Antiga. Inicia a próxima expedição com um martelo.',need:{scrap:3,ember:2},echo:30,do:()=>save.preparedWeapon='hammer' as Weapon},
 {name:'Cetro da Próxima Jornada',detail:'3 Fio Espectral + 2 Fragmentos da Fenda. Inicia a próxima expedição com cetro.',need:{cloth:3,rift:2},echo:30,do:()=>save.preparedWeapon='staff' as Weapon},
 {name:'Trovão Curto',detail:'2 Núcleos de Guardião + 3 Ferro. Inicia a próxima expedição com escopeta.',need:{core:2,scrap:3},echo:50,do:()=>save.preparedWeapon='shotgun' as Weapon}];
 showOverlay(`<div class="modal"><header>⚒ FORJA DA CÂMARA ÂNCORA</header><h2>Todo poder tem um preço.</h2><p class="lead">Cada criação consome materiais extraídos. Armas fabricadas são preparadas para a próxima expedição, não aumentam dano permanentemente.</p><div class="stat-row"><div class="stat"><b>${save.echoes}</b><small>ECOS</small></div><div class="stat"><b>${save.preparedWeapon?weaponNames[save.preparedWeapon]:'NENHUMA'}</b><small>ARMA PREPARADA</small></div></div><div class="cards">${recipes.map((r,i)=>card(r.name,r.detail,craftNeed(r.need,r.echo)?'PRONTO PARA CRIAR':'FALTAM MATERIAIS','⚒',i)).join('')}</div><div class="actions"><button class="btn alt" id="close-forge">VOLTAR À BASE</button></div></div>`);el('#close-forge').onclick=closeHubModal;el('#overlay').querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{const r=recipes[Number((b as HTMLElement).dataset.choice)];if(!r||!spendCraft(r.need,r.echo)){showNotice('MATERIAIS OU ECOS INSUFICIENTES',2.8);return;}r.do();writeSave();sound('level');openForge();}));}
function openAltar(){mode='choice';showOverlay(`<div class="modal"><header>✦ ALTAR DA PREPARAÇÃO</header><h2>Escolha quem enfrenta a Fratura.</h2><p class="lead">Sua escolha fica pronta para a próxima travessia. Classes têm armas e movimentos únicos; o nível reinicia a cada expedição.</p><div class="cards">${(['wanderer','bulwark','arcanist'] as ClassId[]).map((cls,i)=>card(classNames[cls],cls==='bulwark'?'Martelo + arco · Força e sobrevivência':cls==='arcanist'?'Cetro + escopeta · Magia e controle':'Espada + revólver · Precisão e esquiva',save.preferredClass===cls?'SELECIONADO':'ESCOLHER',['⚔','⚒','✧'][i],i)).join('')}</div><div class="actions"><button class="btn" id="altar-legacy">MELHORIAS PERMANENTES</button><button class="btn alt" id="altar-back">VOLTAR À BASE</button></div></div>`);el('#altar-back').onclick=closeHubModal;el('#altar-legacy').onclick=showVault;el('#overlay').querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{save.preferredClass=(['wanderer','bulwark','arcanist'] as ClassId[])[Number((b as HTMLElement).dataset.choice)];writeSave();run.classId=save.preferredClass;openAltar();sound('pick');}));}

function drawBackdrop(){g.fillStyle='#070c15';g.fillRect(0,0,W,H);if((mode==='menu'||mode==='archive')&&assets['menu-art']?.naturalWidth){g.globalAlpha=.65;g.drawImage(assets['menu-art'],0,0,W,H);g.globalAlpha=1;}
 const grad=g.createRadialGradient(W/2,H/2,50,W/2,H/2,750);grad.addColorStop(0,'#192534');grad.addColorStop(1,'#080a13');g.fillStyle=grad;g.fillRect(0,0,W,H);
 for(let i=0;i<90;i++){const x=(i*233+Math.sin(globalTime*.16+i)*9)%W,y=(i*167)%H;g.fillStyle='#7088a012';g.fillRect(x,y,2,2);}}
function render(){g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;drawBackdrop();if(run&&(hubActive||mode!=='menu'&&mode!=='archive'))drawWorld();
 if(screenFlash>0){g.fillStyle=`rgba(250,75,105,${screenFlash*.5})`;g.fillRect(0,0,W,H);}
 // Crisp cinematic vignette on the canvas.
 const vg=g.createRadialGradient(W/2,H/2,170,W/2,H/2,820);vg.addColorStop(0,'#00000000');vg.addColorStop(1,'#02040aa8');g.fillStyle=vg;g.fillRect(0,0,W,H);
 if(mode==='menu'||mode==='archive'){// Still render animated title ambience behind menu.
  for(let i=0;i<32;i++){const x=W/2+Math.sin(globalTime*.3+i*18)*360,y=H/2+Math.cos(globalTime*.23+i*13)*180;g.fillStyle=`rgba(242,192,103,${.1+.1*Math.sin(globalTime+i)})`;g.fillRect(x,y,3,3);}
 }}
let previous=0;function frame(t:number){const dt=Math.min(.033,(t-previous)/1000||.016);previous=t;if(mode==='playing'&&run)tick(dt);else if(mode==='hub'&&run)updateHub(dt);render();requestAnimationFrame(frame);}if(!restoreSession())enterHub();requestAnimationFrame(frame);
