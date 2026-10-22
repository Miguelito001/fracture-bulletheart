import {Tile, type EffectEvent, type GameState, type Point, type MonsterState} from "../core/types";

// FRACTURE: BULLETHEART — fully 2D, pixel-perfect renderer.
// Art: 0x72 DungeonTileset II (CC0), pinned and mirrored for repeatable builds.
// The proven Torchline combat simulation, AI, loot, equipment and save remain intact.
const TILE=47;
type InputHit={type:"monster";id:string}|{type:"world";x:number;y:number}|null;
type Spark={x:number;y:number;life:number;max:number;color:string;amount?:number;heavy?:boolean;kind:string};
const keys=["floor_1","floor_2","floor_3","floor_4","floor_5","floor_6","floor_7","floor_8",
 "wall_mid","wall_top_mid","wall_top_left","wall_top_right","wall_left","wall_right",
 "wall_banner_blue","wall_banner_red","column","column_wall","crate","skull","floor_stairs","flask_red",
 "flask_blue","weapon_regular_sword","weapon_bow","weapon_hammer","coin_anim_f0",
 "coin_anim_f1","coin_anim_f2","coin_anim_f3","chest_full_open_anim_f0",
 "doors_leaf_closed","doors_leaf_open"];
for(const base of ["knight_m","goblin","skelet","imp","chort","big_demon"]){
 for(const mode of ["idle","run"])for(let i=0;i<4;i++)keys.push(base+"_"+mode+"_anim_f"+i);
}
keys.push("knight_m_hit_anim_f0");
const cache=new Map<string,HTMLImageElement>();
function sprite(key:string):HTMLImageElement|null{
 const file=key+".png";
 let pic=cache.get(file);
 if(!pic){
  pic=new Image();
  pic.decoding="async";
  pic.src="/pixel/"+file;
  cache.set(file,pic);
 }
 return pic.complete&&pic.naturalWidth>0?pic:null;
}
for(const key of keys)sprite(key);
const bounded=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
const rand=(x:number,y:number,salt=0)=>{
 let n=Math.imul((x+5811)|0,374761393)^Math.imul((y+1931)|0,668265263)^Math.imul((salt+71)|0,2246822519);
 n=(n^(n>>>13))*1274126177;return (n^(n>>>16))>>>0;
};
export class PixelRenderer{
 private context:CanvasRenderingContext2D;
 private width=1280;
 private height=720;
 private scale=1;
 private cx=0;
 private cy=0;
 private cameraReady=false;
 private last=performance.now();
 private sparks:Spark[]=[];
 private tilesDrawn=0;
 private actorsDrawn=0;
 constructor(private readonly canvas:HTMLCanvasElement){
  const ctx=canvas.getContext("2d",{alpha:false});
  if(!ctx)throw Error("Canvas 2D is required for FRACTURE");
  this.context=ctx;this.resize();
  window.addEventListener("resize",this.resize);
 }
 loadAssets(_unused:unknown):void{}
 dispose():void{window.removeEventListener("resize",this.resize);}
 private resize=()=>{
  this.width=Math.max(320,window.innerWidth);this.height=Math.max(260,window.innerHeight);
  this.scale=Math.min(1.6,Math.max(1,devicePixelRatio||1));
  this.canvas.width=Math.round(this.width*this.scale);
  this.canvas.height=Math.round(this.height*this.scale);
  this.canvas.style.width=this.width+"px";this.canvas.style.height=this.height+"px";
  this.context.setTransform(this.scale,0,0,this.scale,0,0);
  this.context.imageSmoothingEnabled=false;
 };
 private screen(x:number,y:number){return {x:Math.round(this.width/2+(x-this.cx)*TILE),y:Math.round(this.height/2+(y-this.cy)*TILE)};}
 private tile(name:string,x:number,y:number,size=TILE){
  const pic=sprite(name);const p=this.screen(x,y);
  if(pic)this.context.drawImage(pic,Math.round(p.x-size/2),Math.round(p.y-size/2),size,size);
  else{
   this.context.fillStyle=name.startsWith("wall")?"#1f2a35":"#27323c";
   this.context.fillRect(p.x-size/2,p.y-size/2,size,size);
  }
  this.tilesDrawn++;
 }
 private img(key:string,x:number,y:number,size=1){
  const p=this.screen(x,y),pic=sprite(key),height=TILE*size*(pic?pic.naturalHeight/Math.max(1,pic.naturalWidth):1.35),width=TILE*size;
  if(pic)this.context.drawImage(pic,Math.round(p.x-width/2),Math.round(p.y-height+TILE*.39),Math.round(width),Math.round(height));
  else{
   this.context.fillStyle="#8bad91";this.context.fillRect(p.x-width*.36,p.y-height*.7,width*.72,height*.6);
  }
  this.actorsDrawn++;
 }
 private text(x:number,y:number,label:string,color="#ffe3a6",size=13){
  const p=this.screen(x,y);
  const ctx=this.context;ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold "+size+"px system-ui";
  ctx.lineWidth=3;ctx.strokeStyle="#071018";ctx.strokeText(label,p.x,p.y);
  ctx.fillStyle=color;ctx.fillText(label,p.x,p.y);
 }
 private drawRoom(state:GameState,now:number){
  const ctx=this.context,room=state.dungeon.rooms[0];if(!room)return;
  const minX=Math.floor(this.cx-this.width/TILE/2)-2,maxX=Math.ceil(this.cx+this.width/TILE/2)+2;
  const minY=Math.floor(this.cy-this.height/TILE/2)-2,maxY=Math.ceil(this.cy+this.height/TILE/2)+2;
  const x1=Math.max(room.x-2,minX),x2=Math.min(room.x+room.w+1,maxX);
  const y1=Math.max(room.y-3,minY),y2=Math.min(room.y+room.h+1,maxY);
  // One authored chamber in the playable scene — no fake openings into void.
  for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++){
   const inside=x>room.x&&x<room.x+room.w-1&&y>room.y&&y<room.y+room.h-1;
   const top=y===room.y,edge=x===room.x||x===room.x+room.w-1;
   if(!inside&&!top&&!edge)continue;
   if(inside){
    const variation=rand(x,y)%100;
    const floor=variation>87?1+(rand(x,y,3)%8):variation>42?2:1;
    this.tile("floor_"+floor,x,y);
    if(variation===3||variation===11){
     // Tiny details are the same pixel language as the actors.
     const p=this.screen(x,y);ctx.fillStyle="rgba(76,103,88,.35)";
     ctx.fillRect(p.x+TILE*.2,p.y+TILE*.13,5,3);
    }
   }else{
    this.tile(top?"wall_top_mid":"wall_mid",x,y);
    if(top&&x>room.x+2&&x<room.x+room.w-3&&(x-room.x)%6===0)this.tile("wall_banner_red",x,y+1);
   }
  }
  // Borders are architectural, not scattered props. Use the game's *actual*
  // collision blockers to avoid pictures of objects the player can walk through.
  const blockers=state.dungeon.blockers,tw=state.dungeon.width;
  for(let y=Math.max(room.y+2,y1);y<Math.min(room.y+room.h-2,y2);y++)
   for(let x=Math.max(room.x+2,x1);x<Math.min(room.x+room.w-2,x2);x++){
    if(blockers[y*tw+x]!==1)continue;
    if(rand(x,y)%3===0)this.img("column",x,y,1.06);
   }
  const stairs=state.dungeon.stairs;
  this.tile("floor_stairs",stairs.x,stairs.y);
  const pulse=.7+Math.sin(now*.002)*.2;
  const ps=this.screen(stairs.x,stairs.y);
  ctx.strokeStyle="rgba(126,216,230,"+pulse+")";ctx.lineWidth=2;
  ctx.strokeRect(ps.x-TILE*.36,ps.y-TILE*.36,TILE*.72,TILE*.72);
 }
 private actor(a:GameState["player"]|MonsterState,now:number,hero:boolean){
  const moving=a.animation==="run";const mode=moving?"run":"idle";
  const name=hero?"knight_m":
   a.kind==="bone-warden"?"skelet":a.kind==="ash-chanter"?"imp":
   (a.elite?"big_demon":"goblin");
  const frame=Math.floor(now/(moving?110:230))%4;
  const pic=name+"_"+mode+"_anim_f"+frame;
  const p=this.screen(a.x,a.y),ctx=this.context;
  if(hero){
   const halo=.34+Math.sin(now*.004)*.06;
   ctx.fillStyle="rgba(75,183,195,"+halo+")";ctx.beginPath();ctx.ellipse(p.x,p.y+TILE*.27,TILE*.45,TILE*.20,0,0,Math.PI*2);ctx.fill();
  }else{
   ctx.fillStyle="rgba(0,0,0,.33)";ctx.beginPath();ctx.ellipse(p.x,p.y+TILE*.27,TILE*.31,TILE*.15,0,0,Math.PI*2);ctx.fill();
  }
  const key=!hero&&a.hitFlashMs&&a.hitFlashMs>0?name+"_idle_anim_f0":pic;
  this.img(key,a.x,a.y,a.elite?1.50:hero?1.26:1.10);
  if(hero){
   const portrait=statefulFacing(a.facing??0); // direction label intentionally HUD-only
   void portrait;
   ctx.strokeStyle="#a7dfda";ctx.lineWidth=2;
   ctx.strokeRect(p.x-TILE*.35,p.y-TILE*.60,TILE*.7,TILE*.68);
  }else{
   const mob=a as MonsterState;if(mob.hp<=0)return;
   const pct=bounded(mob.hp/Math.max(1,mob.maxHp),0,1);
   if(mob.hp<mob.maxHp||mob.elite){
    ctx.fillStyle="#090f15";ctx.fillRect(p.x-19,p.y-TILE*1.07,38,6);
    ctx.fillStyle=mob.elite?"#efb64b":"#db5f60";ctx.fillRect(p.x-18,p.y-TILE*1.07+1,36*pct,4);
   }
  }
 }
 private renderLoot(state:GameState,now:number){
  for(const item of state.items){
   if(item.x===undefined||item.y===undefined)continue;
   const key=item.kind==="gold"?"coin_anim_f"+Math.floor(now/180)%4:
    item.kind==="potion"?"flask_red":item.kind==="gear"?"weapon_regular_sword":"chest_full_open_anim_f0";
   this.img(key,item.x,item.y+.06, .65);
   const p=this.screen(item.x,item.y);
   this.context.strokeStyle="rgba(254,217,116,.48)";this.context.lineWidth=1;
   this.context.strokeRect(p.x-11,p.y-13,22,22);
  }
  for(const shrine of state.shrines){
   this.img(shrine.used?"column":"flask_blue",shrine.x,shrine.y,.95);
   if(!shrine.used)this.text(shrine.x,shrine.y-.88,"E", "#9ee4ec",11);
  }
 }
 private effects(events:EffectEvent[],dt:number){
  for(const e of events){
   if(e.x===undefined||e.y===undefined)continue;
   if(e.type==="damage"||e.type==="hit"||e.type==="death"||e.type==="pickup"||e.type==="shrine"){
    this.sparks.push({x:e.x,y:e.y,life:e.type==="damage"?.65:.35,max:e.type==="damage"?.65:.35,
      amount:e.amount,color:e.color||"#ffd28b",heavy:e.heavy,kind:e.type});
   }
  }
  if(this.sparks.length>70)this.sparks.splice(0,this.sparks.length-70);
  const ctx=this.context;
  for(let i=this.sparks.length-1;i>=0;i--){
   const e=this.sparks[i];e.life-=dt/1000;
   if(e.life<=0){this.sparks.splice(i,1);continue;}
   const t=1-e.life/e.max,p=this.screen(e.x,e.y-.15-t*.7);
   if(e.kind==="damage"){
    const r=(e.heavy?20:12)*(1-t*.65);
    ctx.strokeStyle=e.color;ctx.lineWidth=e.heavy?4:2;
    ctx.beginPath();ctx.arc(p.x,p.y+TILE*.48,r,0,Math.PI*2);ctx.stroke();
   }
   if(typeof e.amount==="number"){
    ctx.globalAlpha=Math.min(1,e.life/.14);ctx.font="bold "+(e.heavy?21:17)+"px system-ui";
    ctx.textAlign="center";ctx.lineWidth=3;ctx.strokeStyle="#0d121c";
    ctx.strokeText(String(e.amount),p.x,p.y);ctx.fillStyle=e.color;ctx.fillText(String(e.amount),p.x,p.y);ctx.globalAlpha=1;
   }
  }
 }
 render(state:GameState,events:EffectEvent[],dt:number,now:number):void{
  const started=performance.now();const ctx=this.context;
  if(this.width!==window.innerWidth||this.height!==window.innerHeight)this.resize();
  ctx.setTransform(this.scale,0,0,this.scale,0,0);ctx.imageSmoothingEnabled=false;
  ctx.fillStyle="#090e15";ctx.fillRect(0,0,this.width,this.height);
  const px=state.player.x,py=state.player.y;
  if(!this.cameraReady){this.cx=px;this.cy=py;this.cameraReady=true;}
  else{
   const amount=1-Math.exp(-9*Math.min(dt/1000,.05));
   this.cx+=(px-this.cx)*amount;this.cy+=(py-this.cy)*amount;
  }
  this.tilesDrawn=0;this.actorsDrawn=0;
  this.drawRoom(state,now);
  this.renderLoot(state,now);
  for(const mob of [...state.monsters].filter(m=>m.hp>0).sort((a,b)=>a.y-b.y))this.actor(mob,now,false);
  this.actor(state.player,now,true);
  this.effects(events,dt);
  // Small dark vignette, NO bloom/exposure stacks and NO screen shake.
  const grad=ctx.createRadialGradient(this.width/2,this.height/2,this.height*.1,
    this.width/2,this.height/2,Math.max(this.width,this.height)*.68);
  grad.addColorStop(0,"rgba(0,0,0,0)");
  grad.addColorStop(1,"rgba(4,7,14,.56)");
  ctx.fillStyle=grad;ctx.fillRect(0,0,this.width,this.height);
  state.debug.renderMs=Math.round((performance.now()-started)*10)/10;
  state.debug.drawCalls=this.tilesDrawn+this.actorsDrawn;
  state.debug.animatedSprites=this.actorsDrawn;
  state.debug.objects=this.tilesDrawn+this.actorsDrawn;
  state.debug.triangles=0;state.debug.particles=this.sparks.length;
  this.last=now;
 }
 getInputHit(clientX:number,clientY:number,state:GameState):InputHit{
  const rect=this.canvas.getBoundingClientRect(),x=clientX-rect.left,y=clientY-rect.top;
  let nearest:MonsterState|null=null,best=30;
  for(const m of state.monsters){
   if(m.hp<=0)continue;
   const p=this.screen(m.x,m.y-.25),d=Math.hypot(x-p.x,y-p.y);
   if(d<best){best=d;nearest=m;}
  }
  if(nearest)return {type:"monster",id:nearest.id};
  return {type:"world",x:this.cx+(x-this.width/2)/TILE,y:this.cy+(y-this.height/2)/TILE};
 }
}
// Avoid adding a secondary art system just for orientation. Native pixel
// sprite animations provide stable silhouettes at all zoom levels.
function statefulFacing(angle:number){return Math.round(angle/(Math.PI/4))&7;}
