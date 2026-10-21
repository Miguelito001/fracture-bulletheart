import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import RAPIER from '@dimforge/rapier3d-compat';
import EasyStar from 'easystarjs';
import { AudioBus } from './audio.js';
import { HUB, ROOMS, WIDTH, HEIGHT, TILE, chooseExpedition, validateBlueprint, worldX, worldZ } from './rooms.js';

const $=(id)=>document.getElementById(id);
const DEFAULT={echoes:0,level:1,kills:0,runs:0,extractions:0,inventory:{iron:0,embers:0},unlocks:[],weapon:'blade'};
const SAVE_KEY='fracture_bulletheart_3d_v1',LEGACY_KEY='fracture_bulletheart_v1';
const CLAMP=(n,l,h)=>Math.max(l,Math.min(h,n));
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.78,metalness:.16,...extra});
const PALETTE={
  sanctuary:{floor:0x687b83,wall:0x3d4b5d,fog:0x0e1624,glow:0x64bfdf,accent:0x9de6d0},
  crypt:{floor:0x71777a,wall:0x434c59,fog:0x131d25,glow:0xefb16a,accent:0xc9d7c6},
  chapel:{floor:0x7a7585,wall:0x4b455b,fog:0x1b1428,glow:0xd39bff,accent:0xe5bfc7},
  guard:{floor:0x6b757c,wall:0x394655,fog:0x121d28,glow:0xe7b474,accent:0xaed1e6},
  archive:{floor:0x64697a,wall:0x383c56,fog:0x121325,glow:0x9e90ec,accent:0xc5a8df},
  cistern:{floor:0x597b82,wall:0x36525d,fog:0x0e2831,glow:0x6dcbd6,accent:0xa7e0dd},
  forge:{floor:0x806b66,wall:0x563a39,fog:0x291820,glow:0xff9960,accent:0xf4bb7b},
  ossuary:{floor:0x706778,wall:0x484456,fog:0x161526,glow:0x8fb7d9,accent:0xd0cbe0},
  treasure:{floor:0x7f7561,wall:0x56483c,fog:0x241b16,glow:0xe9c46d,accent:0xf8dda1},
  boss:{floor:0x77546c,wall:0x3c283e,fog:0x1b101f,glow:0xff6589,accent:0xffbecd}
};
const MODELS=['banner','barrel','chair','character-human','character-orc','chest','coin',
 'column','dirt','floor','floor-detail','gate','key','pot','potion','rocks',
 'shield-rectangle','stairs','stones','table','trap','wall','wall-half',
 'wall-narrow','wall-opening','weapon-sword','blaster-g','wood-structure','wood-support',
 'grave-altar-stone','grave-candle-multiple','grave-character-skeleton','grave-character-ghost',
 'grave-coffin','grave-column-large','grave-crypt-door','grave-fire-basket',
 'grave-gravestone-round','grave-lightpost-single','grave-urn-round',
 'grave-debris','grave-stone-wall-damaged','grave-pillar-square','grave-detail-chalice',
 'castle-flag-banner-long','castle-wall-pillar','castle-metal-gate','castle-rocks-small',
 'kay-knight','kay-rogue','kay-skeleton',
 'kd-floor','kd-floor-broken','kd-floor-decor','kd-wall','kd-wall-broken','kd-wall-cracked','kd-pillar','kd-crates','kd-barrel','kd-torch','kd-banner','kd-chest','kd-table','kd-arch'];
const KEY_TO_SAVE='fracture_bulletheart_3d_v1';
function loadProgress(){
 try { const state=JSON.parse(localStorage.getItem(SAVE_KEY));if(state&&typeof state==='object')return {...DEFAULT,...state,inventory:{...DEFAULT.inventory,...state.inventory}}; }catch{}
 try { const old=JSON.parse(localStorage.getItem(LEGACY_KEY));if(old&&typeof old==='object'){
   return {...DEFAULT,echoes:Math.max(0,Number(old.echoes)||0),runs:Math.max(0,Number(old.runs)||0),extractions:Math.max(0,Number(old.extractions)||0),unlocks:Array.isArray(old.unlocks)?old.unlocks:[]};
 } }catch{}
 return structuredClone(DEFAULT);
}
class Fracture {
 constructor(){
  this.renderer=new THREE.WebGLRenderer({canvas:$('scene'),antialias:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));this.renderer.setSize(innerWidth,innerHeight);
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.92;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#0d1422');this.scene.fog=new THREE.FogExp2(0x101a28,.009);
  this.camera=new THREE.OrthographicCamera(-16,16,9,-9,.1,360);
  this.camera.position.set(16,23,22);this.camera.lookAt(0,0,0);
  this.clock=new THREE.Clock();this.loader=new GLTFLoader();this.assets=new Map();this.assetBoxes=new Map();this.animationClips=new Map();this.heroMixer=null;this.heroAnimations={};
  this.worldGroup=null;this.actorGroup=new THREE.Group();this.scene.add(this.actorGroup);
  this.scene.add(new THREE.HemisphereLight(0xb8d8ff,0x222536,1.02));
  this.sun=new THREE.DirectionalLight(0xffe2b9,1.9);this.sun.position.set(-15,28,18);
  this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);
  this.sun.shadow.camera.left=-75;this.sun.shadow.camera.right=75;this.sun.shadow.camera.top=75;this.sun.shadow.camera.bottom=-75;
  this.sun.shadow.bias=-.00035;this.scene.add(this.sun);this.lights=[];
  this.raycaster=new THREE.Raycaster();this.plane=new THREE.Plane(new THREE.Vector3(0,1,0),-.05);
  this.pointer=new THREE.Vector2(0,0);this.aim=new THREE.Vector3(1,0,0);
  this.keys=new Set();this.mode='loading';this.progress=loadProgress();this.hp=100;this.maxHp=100;
  this.weapon='blade';this.audio=new AudioBus();this.lastAttack='blade';this.potions=2;this.xp=0;this.level=1;this.materials={iron:0,embers:0};
  this.rooms=[];this.roomIndex=0;this.enemyUnits=[];this.drops=[];this.gates=[];this.statueActors=[];
  this.elapsed=0;this.hitCooldown=0;this.attackCooldown=0;this.dashCooldown=0;this.dashTime=0;this.invuln=0;
  this.cast=0;this.castOrigin=null;this.isMoving=false;this.killCount=0;this.fx=[];
  this.solidBodies=[];this.lastFrame=0;this.lastInteraction='';this.cameraTarget=new THREE.Vector3();this.cameraOffset=new THREE.Vector3(14,18.4,16);this.cameraDeadZone=3.0;this.cameraFrozen=false;this.wallSegments=[];this.weaponKick=0;this.weaponRig=null;this.heroGun=null;this.stepTimer=0;
  this.errors=[];this.gameStarted=false;this.testMarker={engine:'Three.js',physics:'Rapier',rendering:'3D',assets:0,roomCount:0};
  this.lightGeometry=new THREE.SphereGeometry(.15,9,8);
  this.renderer.domElement.addEventListener('pointermove',e=>this.movePointer(e));
  this.renderer.domElement.addEventListener('pointerdown',e=>{this.audio.unlock();this.pointerDown(e);});
  this.renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('keydown',e=>{this.audio.unlock();this.keyDown(e);});
  window.addEventListener('keyup',e=>this.keys.delete(e.code));
  window.addEventListener('blur',()=>this.keys.clear());
  window.addEventListener('resize',()=>this.resize());
  document.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>{this.audio.unlock();this.action(el.dataset.action);}));
  window.addEventListener('pagehide',()=>this.persistRun());
  window.__FRACTURE3D__=this;
 }
 async init(){
  try{
   $('loading').textContent='Preparando modelos CC0, física e mundo 3D…';
   await RAPIER.init();this.RAPIER=RAPIER;
   const failures=[];
   await Promise.all(MODELS.map(async name=>{
    try{let gltf=await this.loader.loadAsync(`/models/${name}.glb`);this.assets.set(name,gltf.scene);this.animationClips.set(name,gltf.animations||[]);
     gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;
       if(o.material){o.material=o.material.clone();
        if(!name.includes('character-')&&!name.startsWith('kay-')&&o.material.color)o.material.color.multiplyScalar(.84);
        o.material.roughness=.95;
       }
      }});
    }catch(e){failures.push(name);console.error('Asset',name,e);}
   }));
   const essential=['floor','wall','kay-knight','kay-skeleton','chest','column','barrel','gate'];
   if(essential.some(n=>!this.assets.has(n)))throw Error('Recursos 3D essenciais não carregaram: '+failures.join(', '));
   this.testMarker.assets=this.assets.size;
   this.gameStarted=true;
   $('loading').classList.add('hidden');$('menu').classList.remove('hidden');
   this.renderMenu();this.openHub();this.setMode('hub');
   requestAnimationFrame(()=>this.frame());
   this.notice('Câmara Âncora · Converse com os serviços usando E');
  }catch(error){this.errors.push(String(error));$('loading').textContent='Erro ao carregar: '+error.message;console.error(error);}
 }
 resize(){
  this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));this.renderer.setSize(innerWidth,innerHeight);
  const halfH=8.0,halfW=halfH*innerWidth/Math.max(1,innerHeight);
  this.camera.left=-halfW;this.camera.right=halfW;this.camera.top=halfH;this.camera.bottom=-halfH;
  this.camera.updateProjectionMatrix();
 }
 setMode(mode){this.mode=mode;$('hud').classList.toggle('hidden',mode==='loading'||mode==='menu');
  $('menu').classList.toggle('hidden',mode!=='menu');this.updateHUD();}
 renderMenu(){const b=$('menu');b.innerHTML=`<div class="panel"><span class="eyebrow">FRACTURE: BULLETHEART</span><h1>THE FRACTURED CITADEL</h1><p>O mundo entre ecos. Entre, lute, volte vivo.</p><button data-new-game="true">EXPLORAR A CÂMARA ÂNCORA</button><small>Projeto 3D: Three.js · Rapier · Kenney CC0</small></div>`;
  b.querySelector('button').addEventListener('click',()=>this.setMode('hub'));
 }
 addLight(x,z,color,intensity=4){const point=new THREE.PointLight(color,intensity,18,2);point.position.set(x,3.7,z);this.worldGroup.add(point);this.lights.push(point);
  const flame=new THREE.Mesh(this.lightGeometry,mat(color,{emissive:color,emissiveIntensity:3}));flame.position.set(x,2.75,z);this.worldGroup.add(flame);
 }
 // Every solid scene object and its Rapier collider share the same authored x/z.
 solid(x,y,z,hx,hy,hz){const body=this.physics.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z));
  this.physics.createCollider(RAPIER.ColliderDesc.cuboid(hx,hy,hz).setFriction(.85),body);this.solidBodies.push(body);return body;
 }
 meshModel(name,x,z,span=2.0,{height=0,physical=false,colliderScale=.82,rotation=0,group=this.worldGroup}={}){
  const source=this.assets.get(name);if(!source)return null;
  const clone=name.startsWith('kay-')?cloneSkinned(source):source.clone(true);clone.rotation.y=rotation;clone.updateMatrixWorld(true);
  let bbox=new THREE.Box3().setFromObject(clone),size=bbox.getSize(new THREE.Vector3());
  const factor=span/Math.max(.001,name.includes('character-')?size.y:Math.max(size.x,size.z));clone.scale.multiplyScalar(factor);clone.updateMatrixWorld(true);
  bbox=new THREE.Box3().setFromObject(clone);size=bbox.getSize(new THREE.Vector3());
  const center=bbox.getCenter(new THREE.Vector3());
  clone.position.x=x-center.x;clone.position.y=height-bbox.min.y;clone.position.z=z-center.z;
  clone.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});if(name.startsWith('wall')||name.startsWith('kd-wall')||name.includes('crypt-door')||name.includes('metal-gate')){clone.userData.isWall=true;clone.userData.baseX=x;clone.userData.baseZ=z;}group.add(clone);
  if(physical){this.solid(x,Math.max(.2,clone.position.y+size.y/2),z,Math.max(.22,size.x/2*colliderScale),Math.max(.40,size.y/2),Math.max(.22,size.z/2*colliderScale));}
  return clone;
 }
 makeTerrain(worldRooms){
  const floorMaterial=mat(0x636e7b,{roughness:.93});
  // Shared instanced flagstone seams make room geometry readable without adding
  // invisible physics or more mesh draw calls per tile.
  const seamMat=new THREE.MeshStandardMaterial({color:0x28313d,roughness:1,metalness:0,transparent:true,opacity:.58,depthWrite:false});
  const seamGeometry=new THREE.BoxGeometry(TILE*.97,.014,.022);
  const allSeams=new THREE.InstancedMesh(seamGeometry,seamMat,worldRooms.length*WIDTH*HEIGHT*2);
  allSeams.count=0;allSeams.frustumCulled=false;
  const mtx=new THREE.Matrix4();
  const writeSeam=(x,z,vertical)=>{
    mtx.makeRotationY(vertical?Math.PI/2:0);
    mtx.setPosition(x,.033,z);
    allSeams.setMatrixAt(allSeams.count++,mtx);
  };
  this.worldGroup.add(allSeams);
  for(const room of worldRooms){
   const {layout,index}=room,theme=PALETTE[layout.theme]||PALETTE.crypt;
   const ox=index*(WIDTH+5)*TILE;
   const pool=[];let roomFloor=0;
   for(let z=0;z<HEIGHT;z++)for(let x=0;x<WIDTH;x++){
    const ch=layout.rows[z][x],wx=ox+x*TILE,wz=z*TILE;
    if(ch!=='#'){
     roomFloor++;
     // Kenney's real stone GLB floors, not a painted Canvas diamond.
     const floorName=(x+z+index)%17===0?'kd-floor-broken':(x*3+z*7+index)%12===0?'kd-floor-decor':'kd-floor';
     const tile=this.meshModel(floorName,wx,wz,TILE*1.02);
     if(tile){tile.traverse(o=>{if(o.isMesh)o.receiveShadow=true;});}
     this.solid(wx,-.58,wz,TILE*.51,.49,TILE*.51);
     if((x+z)%3!==0){writeSeam(wx,wz+TILE*.48,false);writeSeam(wx+TILE*.48,wz,true);}
     if((x*11+z*7+index)%17===0){this.meshModel('stones',wx+.28,wz-.38,TILE*.31,{height:.05});}
     if(ch==='b'){this.meshModel(layout.theme==='treasure'?'kd-chest':layout.theme==='ossuary'?'grave-coffin':'kd-barrel',wx,wz,TILE*.77,{physical:true,colliderScale:.96});}
     if(ch==='c'){this.meshModel('kd-pillar',wx,wz,TILE*.79,{physical:true,colliderScale:.92});}
     if(ch==='t'){this.meshModel(layout.theme==='chapel'?'grave-altar-stone':'kd-table',wx,wz,TILE*.85,{physical:true,colliderScale:.95});}
     if(ch==='f'){this.meshModel('kd-table',wx,wz,TILE*.96,{physical:true});this.addLight(wx,wz,0xffaa61,5);}
     if(ch==='m'){this.meshModel('kd-table',wx,wz,TILE*1.05,{physical:true});}
     if(ch==='a'){this.meshModel('grave-altar-stone',wx,wz,TILE*1.05,{physical:true});this.addLight(wx,wz,0xae84ea,4);}
     if(ch==='s'){this.meshModel('grave-altar-stone',wx,wz,TILE*.9,{physical:true});this.addLight(wx,wz,0xf5ce8e,3.2);}
     if(ch==='P'){this.meshModel('grave-crypt-door',wx,wz,TILE*1.26,{height:0});this.addLight(wx,wz,theme.glow,7);}
     if(ch==='B'){this.meshModel('castle-metal-gate',wx,wz,TILE*1.44,{height:0});this.addLight(wx,wz,theme.glow,7);}
     if(ch==='A'){this.addLight(wx,wz,theme.glow,4.2);this.meshModel('kd-torch',wx+.5,wz-1.0,TILE*.43,{height:1.3});}
    }else{
     // Stone cells have NO standalone wall cube. Only borders of traversable
     // spaces receive modular wall façades and exactly matching Rapier bodies.
     for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const xx=x+dx,zz=z+dz;
      if(xx<0||xx>=WIDTH||zz<0||zz>=HEIGHT||layout.rows[zz][xx]==='#')continue;
      const ex=wx+dx*TILE*.5,ez=wz+dz*TILE*.5;
      const vertical=dx!==0;
      const modelName=(x*3+z*7+index)%13===0?'kd-wall-cracked':(x*7+z*5+index)%23===0?'kd-wall-broken':'kd-wall';
      const wall=this.meshModel(modelName,ex,ez,TILE*1.035,{rotation:vertical?Math.PI/2:0});
      if(wall){
       wall.userData.isWall=true;wall.userData.baseX=ex;wall.userData.baseZ=ez;
       this.wallSegments.push(wall);
      }
      this.solid(ex,1.10,ez,vertical?.20:TILE*.51,1.10,vertical?TILE*.51:.20);
     }
    }
   }
   if(roomFloor<110)throw Error('A sala '+layout.id+' é pequena demais');
   // Wall-mounted architecture: torches, banners, stone sculptures (CC0).
   for(const [x,z,name] of [[2,1,'banner'],[WIDTH-3,1,'banner'],[3,HEIGHT-2,'rocks'],[WIDTH-4,HEIGHT-2,'rocks']]){
    if(layout.rows[z][x]==='#')this.meshModel(name==='banner'?'kd-banner':'grave-debris',ox+x*TILE,z*TILE,TILE*.57,{height:name==='banner'?1.2:0});
   }
   if(index%2===0)this.addLight(ox+3*TILE,3*TILE,theme.glow,3.5);
   this.addLight(ox+(WIDTH-4)*TILE,9*TILE,theme.glow,2.8);
  }
  allSeams.instanceMatrix.needsUpdate=true;
  if(worldRooms.length>1)for(let i=0;i<worldRooms.length-1;i++){
   const x0=worldX(i,WIDTH-1),x1=worldX(i+1,0);
   for(let x=x0+TILE;x<x1-.1;x+=TILE)for(let z=5;z<=7;z++){
    this.meshModel('floor',x,z*TILE,TILE*1.02);
    this.solid(x,-.58,z*TILE,TILE*.51,.49,TILE*.51);
   }
   for(const z of [4,8])for(let x=x0+TILE;x<x1-.1;x+=TILE){this.meshModel('wall-half',x,z*TILE,TILE,{physical:true});}
  }
 }
 setupPhysics(){this.physics=new RAPIER.World({x:0,y:-9.81,z:0});this.physics.timestep=1/60;
  this.charController=this.physics.createCharacterController(.045);
  this.charController.enableAutostep(.3,.12,true);this.charController.enableSnapToGround(.24);
  this.playerBody=this.physics.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0,1.05,0));
  this.playerCollider=this.physics.createCollider(RAPIER.ColliderDesc.capsule(.51,.34),this.playerBody);
  this.solidBodies=[];
 }
 clearWorld(){
  if(this.worldGroup){this.scene.remove(this.worldGroup);this.worldGroup.traverse(o=>{if(o.geometry&&!this.assets.has(o.userData.assetId)){
    // Imported geometries stay cached, so avoid disposing shared glTF geometry.
   }});}
  if(this.actorGroup){this.scene.remove(this.actorGroup);}this.actorGroup=new THREE.Group();this.scene.add(this.actorGroup);this.heroMixer=null;this.heroAnimations={};
  this.worldGroup=new THREE.Group();this.scene.add(this.worldGroup);this.lights=[];this.gates=[];this.drops=[];this.enemyUnits=[];this.statueActors=[];this.wallSegments=[];
  this.setupPhysics();
 }
 createHero(x,z){
  this.playerBody.setNextKinematicTranslation({x,y:1.05,z});this.physics.step();
  const root=this.meshModel('kay-knight',x,z,2.72,{group:this.actorGroup});this.hero=root;
  this.heroPivot=new THREE.Group();this.actorGroup.add(this.heroPivot);this.actorGroup.remove(root);this.heroPivot.add(root);root.position.x=0;root.position.z=0;
  this.heroPivot.position.set(x,0,z);
  // Centre camera instantly after world transitions, avoiding an offscreen spawn.
  this.cameraTarget.set(x,.8,z);this.camera.position.copy(this.cameraTarget).add(this.cameraOffset);this.camera.lookAt(this.cameraTarget);
  const setup=this.configureAnimations(root,'kay-knight');this.heroMixer=setup.mixer;this.heroAnimations=setup.actions;this.heroAnimationState='idle';
  const hand=(()=>{let bone=null;root.traverse(o=>{if(/handslot[._]?r|hand[._]?r/i.test(o.name))bone ||= o;});return bone;})();
  this.weaponRig=new THREE.Group();(hand||root).add(this.weaponRig);
  this.heroSword=this.meshModel('weapon-sword',0,0,.38,{group:this.weaponRig});
  this.heroGun=this.meshModel('blaster-g',0,0,.48,{group:this.weaponRig});
  if(this.heroSword){this.heroSword.position.set(.12,.02,0);this.heroSword.rotation.set(Math.PI/2,0,0);}
  if(this.heroGun){this.heroGun.position.set(.10,-.03,0);this.heroGun.rotation.set(0,Math.PI/2,0);}
  this.selectWeapon(this.weapon,true);
 }
 openHub(){
  this.clearWorld();this.scene.fog.color.setHex(PALETTE.sanctuary.fog);
  this.rooms=[{layout:HUB,index:0,cleared:true,active:false,spawned:true,enemies:[]}];
  this.makeTerrain(this.rooms);
  this.createHero(worldX(0,8),worldZ(7));this.roomIndex=0;
  this.testMarker.roomCount=1;this.hp=this.maxHp;this.potions=2;this.gameStarted=true;
  this.worldType='hub';this.setMode('hub');this.updateHUD();this.setObjective('CÂMARA ÂNCORA · E PARA INTERAGIR · PORTAL AO CENTRO');
 }
 enterDungeon(){
  this.clearWorld();this.scene.fog.color.setHex(PALETTE.crypt.fog);
  this.rooms=chooseExpedition().map((layout,index)=>({layout,index,cleared:index===0,active:false,spawned:false,enemies:[]}));
  this.makeTerrain(this.rooms);this.createHero(worldX(0,9),worldZ(7));
  this.roomIndex=0;this.worldType='dungeon';this.hp=this.maxHp;this.potions=2;
  this.xp=0;this.level=1;this.killCount=0;this.materials={iron:0,embers:0};
  this.progress.runs++;this.save();this.testMarker.roomCount=this.rooms.length;
  this.setMode('playing');this.setObjective('NÓ ZERO · Avance, vença os guardiões e retorne vivo');
  this.notice('EXPEDIÇÃO INICIADA · O PORTAL PERMANECE NO NÓ ZERO');
 }
 movePointer(e){this.pointer.x=(e.clientX/innerWidth)*2-1;this.pointer.y=1-(e.clientY/innerHeight)*2;
  this.raycaster.setFromCamera(this.pointer,this.camera);const target=new THREE.Vector3();
  if(this.raycaster.ray.intersectPlane(this.plane,target)){
   const here=this.playerBody?.translation();if(here){this.aim.set(target.x-here.x,0,target.z-here.z).normalize();}
  }
 }
 pointerDown(e){if(this.mode!=='playing')return;if(e.button===0)this.attack();if(e.button===2)this.attack(true);}
 keyDown(e){if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();this.keys.add(e.code);
  if(e.repeat)return;
  if(e.code==='Escape'){if(this.mode==='playing')this.setMode('paused');else if(this.mode==='paused')this.setMode(this.worldType==='hub'?'hub':'playing');}
  if(e.code==='KeyE')this.interact();
  if(e.code==='Digit1')this.selectWeapon('blade');if(e.code==='Digit2')this.selectWeapon('gun');
  if(e.code==='Space')this.startDodge();if(e.code==='KeyH')this.heal();if(e.code==='KeyR')this.startReturn();
  if(e.code==='KeyQ'&&this.mode==='playing')this.special();
 }
 action(name){
  if(name==='start')this.enterDungeon();else if(name==='attack')this.attack();else if(name==='dodge')this.startDodge();
  else if(name==='interact')this.interact();else if(name==='heal')this.heal();else if(name==='return')this.startReturn();
  else if(name==='blade'||name==='gun')this.selectWeapon(name);
  else if(name==='pause'){if(this.mode==='paused')this.setMode(this.worldType==='hub'?'hub':'playing');else if(this.mode==='playing')this.setMode('paused');}
 }
 selectWeapon(kind,silent=false){
  this.weapon=kind==='gun'?'gun':'blade';
  if(this.heroSword)this.heroSword.visible=this.weapon==='blade';
  if(this.heroGun)this.heroGun.visible=this.weapon==='gun';
  this.weaponKick=0;
  if(!silent){this.audio.play('pickup');this.updateHUD();}
 }
 near(x,z,r=2.9){const p=this.playerBody.translation();return Math.hypot(p.x-x,p.z-z)<=r;}
 nearestStation(){
  if(this.worldType!=='hub')return null;
  const cells=[['portal',9,6,3.85],['forja',3,2,4],['mercador',15,2,4],['arquivo',3,9,4],['cofre',15,9,4],['altar',3,11,4],['preparação',15,11,4]];
  return cells.find(([id,x,z,r])=>this.near(worldX(0,x),worldZ(z),r));
 }
 interact(){
  if(this.worldType==='hub'){
   const station=this.nearestStation();if(!station){this.notice('Aproxime-se de uma estrutura para interagir');return;}
   const id=station[0];
   if(id==='portal'){this.enterDungeon();return;}
   if(id==='forja'){
    if(this.progress.echoes>=25){this.progress.echoes-=25;this.progress.unlocks=Array.from(new Set([...this.progress.unlocks,'forge']));this.notice('FORJA · Espada temperada: +12% dano');this.save();}
    else this.notice('FORJA · Necessário 25 ecos para temperar a lâmina');
   }else if(id==='mercador'){
    if(this.progress.echoes>=12){this.progress.echoes-=12;this.potions=Math.min(5,this.potions+1);this.notice('MERCADOR · Poção adquirida');this.save();}
    else this.notice('MERCADOR · 12 ecos por poção');
   }else if(id==='cofre')this.notice(`COFRE · Ferro ${this.progress.inventory.iron||0} · Brasas ${this.progress.inventory.embers||0}`);
   else if(id==='arquivo')this.notice(`ARQUIVO · ${this.progress.runs} expedições · ${this.progress.extractions} extrações · ${this.progress.kills} derrotados`);
   else this.notice('ALTAR · Use WASD, ESPAÇO para esquivar e clique para atacar');
  }else if(this.worldType==='dungeon'){
   const start=this.rooms[0];
   if(this.near(worldX(0,9),worldZ(6),3.25)){this.extract();return;}
   if(this.roomIndex===this.rooms.length-1&&this.rooms.at(-1).cleared){this.extract();return;}
   this.notice('Volte ao portal do Nó Zero para extrair espólio');
  }
 }
 save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(this.progress));}catch{}}
 persistRun(){/* Only the permanent meta-progress is serialized until full run save migration. */this.save();}
 extract(){
  this.audio.play('room');this.progress.extractions++;this.progress.echoes+=Math.max(0,Math.round(this.killCount*2+this.materials.embers*4));
  this.progress.kills+=this.killCount;
  this.progress.inventory.iron=(this.progress.inventory.iron||0)+this.materials.iron;
  this.progress.inventory.embers=(this.progress.inventory.embers||0)+this.materials.embers;
  this.save();this.notice(`EXTRAÇÃO REALIZADA · +${this.materials.iron} ferro · +${this.materials.embers} brasas`);
  this.openHub();
 }
 startReturn(){if(this.worldType!=='dungeon'||this.mode!=='playing')return;
  if((this.progress.scrolls||0)<=0){this.notice('Você não possui um pergaminho de retorno');return;}
  this.cast=4;this.castOrigin=this.playerBody.translation();this.notice('RITUAL DE RETORNO · 4 SEGUNDOS · NÃO SE MOVA');
 }
 heal(){if(this.mode!=='playing'||this.potions<=0||this.hp===this.maxHp)return;this.potions--;this.hp=Math.min(this.maxHp,this.hp+38);this.audio.play('heal');this.notice('POÇÃO DE VIDA · +38');this.updateHUD();}
 startDodge(){if(this.mode!=='playing'||this.dashCooldown>0)return;this.dashTime=.22;this.dashCooldown=.95;this.invuln=Math.max(this.invuln,.27);this.audio.play('dodge');this.notice('');}
 special(){if(this.mode!=='playing'||this.attackCooldown>0)return;this.weapon='blade';this.attackCooldown=.8;const p=this.playerBody.translation();
  for(const enemy of this.enemyUnits)if(enemy.hp>0&&Math.hypot(enemy.x-p.x,enemy.z-p.z)<4.3)this.hitEnemy(enemy,23);
  this.pulse(p.x,p.z,0x8bdfed,1.8);
 }
 attack(forceGun=false){if(this.mode!=='playing'||this.attackCooldown>0)return;
  const gun=forceGun||this.weapon==='gun',range=gun?13.5:3.0,angle=gun?.36:1.05;
  this.attackCooldown=gun?.46:.39;this.lastAttack=gun?'gun':'blade';this.weaponKick=gun?1:.6;this.audio.play(gun?'gun':'sword');
  const p=this.playerBody.translation(),dir=this.aim;
  let nearest=null,distBest=999;
  for(const e of this.enemyUnits){if(e.hp<=0)continue;
   const dx=e.x-p.x,dz=e.z-p.z,dist=Math.hypot(dx,dz),a=Math.acos(CLAMP((dx*dir.x+dz*dir.z)/Math.max(.01,dist),-1,1));
   if(dist<range&&a<angle&&this.lineOfSight(p.x,p.z,e.x,e.z)&&dist<distBest){nearest=e;distBest=dist;}
   if(!gun&&dist<range&&a<angle)this.hitEnemy(e,19*(this.progress.unlocks.includes('forge')?1.12:1));
  }
  if(gun&&nearest)this.hitEnemy(nearest,15);
  if(gun){
    // A short-lived projectile tracer follows the real ray aim/hit direction,
    // distinct from the sword's wide impact ring.
    const dist=nearest?Math.max(1,distBest):8.5;
    const origin=new THREE.Vector3(p.x+dir.x*.7,1.32,p.z+dir.z*.7);
    const tip=new THREE.Vector3(p.x+dir.x*dist,1.28,p.z+dir.z*dist);
    const segment=tip.clone().sub(origin),tracer=new THREE.Mesh(
      new THREE.CylinderGeometry(.045,.075,segment.length(),6),
      new THREE.MeshBasicMaterial({color:0xa9f6ff,transparent:true,opacity:.92,depthWrite:false})
    );
    tracer.position.copy(origin).add(tip).multiplyScalar(.5);
    tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),segment.normalize());
    this.worldGroup.add(tracer);this.fx.push({mesh:tracer,time:.105,max:.105});
    const flash=new THREE.Mesh(new THREE.SphereGeometry(.17,8,8),
      new THREE.MeshBasicMaterial({color:0xffdca0,transparent:true,opacity:1,depthWrite:false}));
    flash.position.copy(origin);this.worldGroup.add(flash);this.fx.push({mesh:flash,time:.12,max:.12});
  }
  this.pulse(p.x+dir.x*2.4,p.z+dir.z*2.4,gun?0x7bdff7:0xffdd96,gun?.24:.50);
  this.playMotion(this.heroAnimations,this.heroAnimationState,gun?'shoot':'attack');this.heroAnimationState=gun?'shoot':'attack';
  this.updateHUD();
 }
 lineOfSight(ax,az,bx,bz){
  const steps=Math.ceil(Math.hypot(bx-ax,bz-az)/.35);
  for(let i=0;i<=steps;i++){
   const k=i/steps,x=ax+(bx-ax)*k,z=az+(bz-az)*k;
   const room=this.rooms.find(r=>x>=r.index*(WIDTH+5)*TILE-1&&x<=(r.index*(WIDTH+5)+WIDTH)*TILE+1);
   if(!room)continue;
   const col=Math.round((x-room.index*(WIDTH+5)*TILE)/TILE),row=Math.round(z/TILE);
   if(row>=0&&row<HEIGHT&&col>=0&&col<WIDTH&&room.layout.rows[row][col]==='#')return false;
  }
  return true;
 }
 pulse(x,z,color,size=1){
  const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.78,depthWrite:false,blending:THREE.AdditiveBlending});
  const mesh=new THREE.Mesh(new THREE.TorusGeometry(size,.055,6,32),material);
  mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.13,z);this.worldGroup.add(mesh);this.fx.push({mesh,time:.43,max:.43});
 }
 hitEnemy(e,damage){e.hp-=damage;e.stagger=.16;
  this.pulse(e.x,e.z,0xffad8d,.43);this.audio.play('hit');if(e.hp<=0){e.hp=0;this.enemyDown(e);}
 }
 enemyDown(e){
  this.killCount++;this.xp+=e.kind==='warden'?190:e.kind==='knight'?27:16;
  if(this.xp>=this.level*76){this.xp-=this.level*76;this.level++;this.maxHp+=8;this.hp=Math.min(this.maxHp,this.hp+20);this.notice(`NÍVEL ${this.level} · Vitalidade +8`);}
  this.materials.iron+=1;if(e.kind==='warden'||e.kind==='knight')this.materials.embers++;
  if(e.visual){this.actorGroup.remove(e.visual);}if(e.mixer)e.mixer.stopAllAction();this.physics.removeRigidBody(e.body);
  this.enemyUnits=this.enemyUnits.filter(u=>u!==e);
  const room=this.rooms[e.room];if(room&&!this.enemyUnits.some(u=>u.room===room.index)){
   room.cleared=true;room.active=false;this.removeGates();
   this.notice(room.layout.theme==='boss'?'GUARDIÃO DERROTADO · E PARA EXTRAIR':'CÂMARA LIBERADA · OS PORTÕES SE ABRIRAM');
   this.pulse(worldX(room.index,9),worldZ(6),0x8ce5c3,3);this.audio.play('room');
  }
  this.updateHUD();
 }
 spawnEnemy(room,col,row,kind='orc'){
  const x=worldX(room.index,col),z=worldZ(row);
  const boss=kind==='warden',knight=kind==='knight';
  const enemyModel=room.layout.theme==='cistern'?'grave-character-ghost':'kay-skeleton';
  const visual=this.meshModel(enemyModel,0,0,boss?3.35:knight?2.60:2.1,{group:this.actorGroup});
  if(!visual)return;
  const root=new THREE.Group();this.actorGroup.remove(visual);this.actorGroup.add(root);root.add(visual);visual.position.x=0;visual.position.z=0;
  const body=this.physics.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x,1.03,z));
  const collider=this.physics.createCollider(RAPIER.ColliderDesc.capsule(boss?.80:.48,boss?.59:.36),body);
  const controller=this.physics.createCharacterController(.06);controller.enableAutostep(.25,.08,true);
  root.position.set(x,0,z);
  const animated=this.configureAnimations(visual,enemyModel);
  const enemy={x,z,visual:root,body,collider,controller,mixer:animated.mixer,actions:animated.actions,animationState:'idle',kind,room:room.index,hp:boss?520:knight?96:58,max:boss?520:knight?96:58,
    speed:boss?2.2:knight?3.0:3.3,cooldown:1+Math.random()*.6,windup:0,stagger:0,path:null,pathTimer:0};
  this.enemyUnits.push(enemy);room.enemies.push(enemy);
 }
 // Authored KayKit skeletal clips: idle, running, melee strike, hit and death.
 configureAnimations(mesh,name){
  const clips=this.animationClips.get(name)||[];
  const mixer=new THREE.AnimationMixer(mesh),actions={};
  const search={idle:/idle|standing/i,run:/run|walk/i,attack:/melee_attack|attack|slash|swing/i,shoot:/ranged|shoot|fire|bow|throw|spellcast/i,hit:/hit|hurt|impact/i,death:/death|die/i};
  for(const [id,pattern] of Object.entries(search)){
   const clip=clips.find(c=>pattern.test(c.name));if(clip)actions[id]=mixer.clipAction(clip);
  }
  if(actions.idle)actions.idle.play();else if(clips[0])actions.idle=mixer.clipAction(clips[0]).play();
  return {mixer,actions};
 }
 playMotion(actions,last,name){
  const desired=actions?.[name]||actions?.idle;if(!desired)return;
  const previous=actions?.[last];if(previous&&previous!==desired)previous.fadeOut(.13);
  if(name==='attack'||name==='shoot'||name==='hit'){desired.setLoop(THREE.LoopOnce,1);desired.clampWhenFinished=true;}
  else desired.setLoop(THREE.LoopRepeat,Infinity);
  desired.reset().fadeIn(.13).play();
 }
 startCombat(room){if(room.spawned||room.cleared||room.index===0)return;
  room.spawned=true;room.active=true;this.roomIndex=room.index;
  const options=[[5,3],[13,3],[5,9],[13,9],[9,2],[9,10],[4,6],[14,6]];
  const available=options.filter(([x,z])=>room.layout.rows[z][x]==='.'&&![...['b','c','t','#']].includes(room.layout.rows[z][x]));
  const expected=room.layout.theme==='boss'?1:room.layout.theme==='treasure'?3:4;
  for(let n=0;n<expected;n++){
   const [col,row]=available[n%available.length]||[9,6];
   this.spawnEnemy(room,col,row,room.layout.theme==='boss'?'warden':n===0&&room.index>1?'knight':'orc');
  }
  this.addGates(room);this.setObjective(room.layout.name+' · ELIMINE OS INIMIGOS');
  this.notice('CÂMARA SELADA · SOBREVIVA');this.audio.play('gate');
 }
 addGates(room){this.removeGates();
  for(const side of [-1,1]){
   if((side===-1&&room.index===0)||(side===1&&room.index===this.rooms.length-1))continue;
   const x=worldX(room.index,side===-1?0:WIDTH-1),z=worldZ(6);
   const barrier=this.meshModel('gate',x,z,TILE*2.65,{height:0});
   const rigid=this.solid(x,1.55,z,.30,1.52,TILE*1.55);
   this.gates.push({barrier,rigid});
  }
 }
 removeGates(){for(const o of this.gates){if(o.barrier)this.worldGroup.remove(o.barrier);if(o.rigid)this.physics.removeRigidBody(o.rigid);}this.gates=[];}
 triggerRooms(){if(this.worldType!=='dungeon')return;
  const player=this.playerBody.translation();
  for(const room of this.rooms){
   if(room.index===0||room.spawned)continue;
   const centre=worldX(room.index,9);
   if(Math.abs(player.x-centre)<TILE*5.4&&Math.abs(player.z-worldZ(6))<TILE*4.5){this.startCombat(room);break;}
  }
 }
 routeEnemy(e,player){
  const room=this.rooms[e.room],ox=worldX(room.index,0);
  const matrix=room.layout.rows.map(row=>[...row].map(c=>['#','b','c','t'].includes(c)?1:0));
  const sx=CLAMP(Math.round((e.x-ox)/TILE),0,WIDTH-1),sy=CLAMP(Math.round(e.z/TILE),0,HEIGHT-1);
  const tx=CLAMP(Math.round((player.x-ox)/TILE),0,WIDTH-1),ty=CLAMP(Math.round(player.z/TILE),0,HEIGHT-1);
  matrix[sy][sx]=0;matrix[ty][tx]=0;
  const pathFinder=new EasyStar.js();pathFinder.setGrid(matrix);pathFinder.setAcceptableTiles([0]);
  pathFinder.enableDiagonals();pathFinder.disableCornerCutting();
  pathFinder.findPath(sx,sy,tx,ty,path=>{e.path=path?.slice(1)||[];});
  pathFinder.calculate();e.pathTimer=.52;
 }
 updateEnemies(dt){const player=this.playerBody.translation();
  for(const e of this.enemyUnits){
   if(e.stagger>0){e.stagger-=dt;continue;}
   e.cooldown-=dt;e.pathTimer-=dt;
   const dx=player.x-e.x,dz=player.z-e.z,distance=Math.hypot(dx,dz),sameRoom=Math.abs(e.x-player.x)<WIDTH*TILE;
   if(distance>21||!sameRoom)continue;
   e.visual.rotation.y=Math.atan2(dx,dz);
   if(distance<(e.kind==='warden'?2.3:1.55)){
    if(e.windup<=0&&e.cooldown<=0){e.windup=e.kind==='warden'?.72:.44;e.cooldown=e.kind==='warden'?2.25:1.36;this.pulse(player.x,player.z,0xff6f6f,.7);}
   }else if(e.windup<=0){
    if(e.pathTimer<=0)this.routeEnemy(e,player);
    let dest=null;
    if(e.path?.length){let node=e.path[0];dest=new THREE.Vector3(worldX(e.room,node.x),0,worldZ(node.y));
      if(Math.hypot(dest.x-e.x,dest.z-e.z)<.33)e.path.shift();}
    if(!dest)dest=new THREE.Vector3(player.x,0,player.z);
    const move=new THREE.Vector3(dest.x-e.x,0,dest.z-e.z);
    if(move.lengthSq()>.001){move.normalize().multiplyScalar(dt*e.speed);
     e.controller.computeColliderMovement(e.collider,{x:move.x,y:0,z:move.z});const m=e.controller.computedMovement();
     const pos=e.body.translation();e.body.setNextKinematicTranslation({x:pos.x+m.x,y:1.03,z:pos.z+m.z});}
   }
   if(e.windup>0){e.windup-=dt;if(e.windup<=0){
    if(distance<(e.kind==='warden'?3.3:2.05)&&this.invuln<=0&&this.dashTime<=0){
     this.hp-=e.kind==='warden'?30:17;this.audio.play('hurt');this.invuln=.55;this.cast=0;this.pulse(player.x,player.z,0xff445f,.84);
     if(this.hp<=0){this.hp=0;this.die();}this.updateHUD();}
   }}
  }
 }
 die(){this.audio.play('death');this.setMode('defeat');this.materials.iron=Math.floor(this.materials.iron*.35);this.materials.embers=Math.floor(this.materials.embers*.2);
  this.progress.kills+=this.killCount;this.save();this.notice('VOCÊ CAIU · O ESPÓLIO FOI PERDIDO');
  $('menu').innerHTML=`<div class="panel"><span class="eyebrow">FRACTURE</span><h1>O ECO SE APAGOU</h1><p>A dificuldade permanece. Tente uma nova incursão.</p><button id="tryagain">VOLTAR À CÂMARA ÂNCORA</button></div>`;
  $('menu').classList.remove('hidden');$('tryagain').onclick=()=>this.openHub();
 }
 // Kinematic collision displacement is resolved by Rapier, including dash and obstacles.
 updateMovement(dt){const x=(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0);
  const z=(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)-(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0);
  const desired=new THREE.Vector3(x,0,z);this.isMoving=desired.lengthSq()>.05;
  if(this.isMoving)desired.normalize();
  if(this.dashTime>0){this.dashTime-=dt;desired.multiplyScalar(2.7);}
  desired.multiplyScalar(dt*5.4);
  const previous=this.playerBody.translation();
  this.charController.computeColliderMovement(this.playerCollider,{x:desired.x,y:0,z:desired.z});
  const displacement=this.charController.computedMovement();
  this.playerBody.setNextKinematicTranslation({x:previous.x+displacement.x,y:1.05,z:previous.z+displacement.z});
  if(this.heroPivot){
   const a=Math.atan2(this.aim.x,this.aim.z);
   this.heroPivot.rotation.y+=(a-this.heroPivot.rotation.y)*CLAMP(dt*10,0,1);
  }
  if(this.cast>0){
   if(this.isMoving||Math.hypot(previous.x-this.castOrigin.x,previous.z-this.castOrigin.z)>.14){this.cast=0;this.notice('RITUAL INTERROMPIDO');}
   else{this.cast-=dt;if(this.cast<=0){this.progress.scrolls--;this.extract();}}
  }
 }
 updateVisuals(dt){const p=this.playerBody.translation();
  if(this.heroPivot){this.heroPivot.position.set(p.x,0,p.z);
   const animation=this.attackCooldown>.14?(this.lastAttack==='gun'?'shoot':'attack'):this.dashTime>0?'run':this.isMoving?'run':'idle';
   if(animation!==this.heroAnimationState){this.playMotion(this.heroAnimations,this.heroAnimationState,animation);this.heroAnimationState=animation;}
   this.weaponKick=Math.max(0,this.weaponKick-dt*5.6);
    if(this.weaponRig){
      this.weaponRig.position.z=this.weapon==='gun'?-this.weaponKick*.12:0;
      this.weaponRig.rotation.z=this.weapon==='gun'?-this.weaponKick*.22:Math.sin((1-this.weaponKick)*Math.PI)*this.weaponKick*.75;
    }
    this.heroMixer?.update(dt);
  }
  for(const e of this.enemyUnits){const t=e.body.translation();e.x=t.x;e.z=t.z;e.visual.position.set(t.x,0,t.z);
   const animation=e.stagger>0?'hit':e.windup>0?'attack':e.path?.length?'run':'idle';
   if(animation!==e.animationState){this.playMotion(e.actions,e.animationState,animation);e.animationState=animation;}
   e.mixer?.update(dt);
  }
  for(const effect of [...this.fx]){effect.time-=dt;
   if(effect.time<=0){this.worldGroup.remove(effect.mesh);effect.mesh.geometry.dispose();effect.mesh.material.dispose();this.fx.splice(this.fx.indexOf(effect),1);}
   else{effect.mesh.scale.setScalar(1+(1-effect.time/effect.max)*1.2);effect.mesh.material.opacity=.64*(effect.time/effect.max);}
  }
  // Comfort mode: no aim look-ahead, no bob, shake or delayed rotation.
  // The camera doesn't move at all while the hero remains in a 3m deadzone.
  if(!this.cameraFrozen){
   const dx=p.x-this.cameraTarget.x,dz=p.z-this.cameraTarget.z;
   const moveX=Math.sign(dx)*Math.max(0,Math.abs(dx)-this.cameraDeadZone);
   const moveZ=Math.sign(dz)*Math.max(0,Math.abs(dz)-this.cameraDeadZone);
   const ease=1-Math.exp(-dt*10);
   this.cameraTarget.x+=moveX*ease;this.cameraTarget.z+=moveZ*ease;
  }
  this.camera.position.copy(this.cameraTarget).add(this.cameraOffset);
  this.camera.lookAt(this.cameraTarget);
  this.sun.position.set(p.x-13,23,p.z+17);this.sun.target.position.set(p.x,0,p.z);this.sun.target.updateMatrixWorld();
  // Occluding wall façades fade, while the physical colliders remain solid.
  for(const obj of this.wallSegments){
   const dx=obj.userData.baseX-p.x,dz=obj.userData.baseZ-p.z;
   const obscure=dx>0&&dz>0&&dx<5.2&&dz<5.2;
   obj.traverse(mesh=>{if(!mesh.isMesh)return;
    if(!mesh.userData.uniqueOpacity){mesh.material=mesh.material.clone();mesh.material.transparent=true;mesh.userData.uniqueOpacity=true;}
    mesh.material.opacity+=((obscure?.27:1)-mesh.material.opacity)*CLAMP(dt*9,0,1);
    mesh.material.depthWrite=!obscure;
   });
  }
 }
 frame(){let dt=CLAMP(this.clock.getDelta(),0,1/30);
  this.elapsed+=dt;this.hitCooldown=Math.max(0,this.hitCooldown-dt);this.attackCooldown=Math.max(0,this.attackCooldown-dt);
  this.dashCooldown=Math.max(0,this.dashCooldown-dt);this.invuln=Math.max(0,this.invuln-dt);
  if(this.mode==='hub'||this.mode==='playing'){
   this.audio.update(dt,this.worldType);
   if(this.isMoving){this.stepTimer-=dt;if(this.stepTimer<=0){this.audio.play('step');this.stepTimer=.33;}}
   else this.stepTimer=.08;
   this.updateMovement(dt);
   if(this.mode==='playing'){this.triggerRooms();this.updateEnemies(dt);}
   this.physics.timestep=dt;this.physics.step();this.updateVisuals(dt);
   this.updateHUD();
  }
  this.renderer.render(this.scene,this.camera);
  requestAnimationFrame(()=>this.frame());
 }
 setObjective(text){$('objective').textContent=text;}
 notice(message){if(!message)return;$('notice').textContent=message;$('notice').classList.remove('hidden');
  clearTimeout(this.noticeHandle);this.noticeHandle=setTimeout(()=>$('notice').classList.add('hidden'),3400);}
 updateHUD(){
  $('healthfill').style.width=`${CLAMP(this.hp/this.maxHp*100,0,100)}%`;
  $('healthtext').textContent=`${Math.ceil(this.hp)} / ${this.maxHp}`;
  $('level').textContent=`NÍVEL ${this.level}`;
  $('xp').textContent=`XP ${Math.floor(this.xp)}`;
  $('potions').textContent=`${this.potions}`;
  $('echoes').textContent=`${this.progress.echoes}`;
  $('materials').textContent=`FERRO ${this.materials.iron} · BRASAS ${this.materials.embers}`;
  $('stance').textContent=this.weapon==='blade'?'LÂMINA ERRANTE':'REVÓLVER DE ECOS';
  for(const b of document.querySelectorAll('.weapon-group button')){
   const active=b.dataset.action===this.weapon;b.classList.toggle('equipped',active);
   b.setAttribute('aria-pressed',String(active));
  }
  $('roomname').textContent=this.worldType==='hub'?'CÂMARA ÂNCORA':(this.rooms[this.roomIndex]?.layout.name||'CRIPTA');
  $('controls').textContent=this.worldType==='hub'?'WASD MOVER · E INTERAGIR · PORTAL AO CENTRO':'WASD MOVER · MOUSE MIRAR · CLIQUE ATACAR · ESPAÇO ESQUIVAR · 1/2 ARMA · H POÇÃO · E EXTRAÇÃO';
  $('status').textContent=this.mode==='hub'?'REFÚGIO SEGURO':this.gates.length?'SALA SELADA':'EXPLORAÇÃO';
 }
}
const app=new Fracture();app.resize();app.init();