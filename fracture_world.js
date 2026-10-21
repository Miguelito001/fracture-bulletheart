/* FRACTURE: BULLETHEART — THE FRACTURED CITADEL
 * Actual Canvas 2D world geometry. Not concept art or an image overlay.
 * Visual-only layer: no changes to collision, damage, procedural layout or saves.
 * The authored decoration uses the bundled Kenney Isometric Blocks CC0 tiles.
 */
(function () {
"use strict";
const PI=Math.PI, TAU=PI*2;
const PALETTES=[
  {stone:"#586373",light:"#8895a2",dark:"#303d50",mortar:"#1b2836",metal:"#c9b18a",cloth:"#8b4e69",plant:"#507e70"},
  {stone:"#59666b",light:"#93a8a1",dark:"#334a4b",mortar:"#1b3038",metal:"#d0b780",cloth:"#467c88",plant:"#64a18d"},
  {stone:"#63647b",light:"#a6a0b6",dark:"#38354f",mortar:"#25253c",metal:"#d8c18e",cloth:"#7c5ca1",plant:"#76987e"},
  {stone:"#665760",light:"#a79196",dark:"#44323e",mortar:"#281d30",metal:"#d59b70",cloth:"#a55451",plant:"#777d71"},
  {stone:"#57526a",light:"#9b90b0",dark:"#302943",mortar:"#211b36",metal:"#d1b179",cloth:"#6a4b8d",plant:"#598e90"}
];
const BLOCK_IDS=Array.from({length:55},(_,i)=>String(i+1).padStart(2,"0"));
const blockImgs={};for(const id of BLOCK_IDS){const img=new Image();img.src="./assets/voxel/voxelTile_"+id+".png";blockImgs[id]=img;}
const pos=(x,y,z=0)=>{const p=isoPoint(x,y);return {x:p.x,y:p.y-z};};
function poly(points,fill,stroke,line=1) {
  g.beginPath();g.moveTo(points[0].x,points[0].y);
  for(let i=1;i<points.length;i++)g.lineTo(points[i].x,points[i].y);
  g.closePath();g.fillStyle=fill;g.fill();
  if(stroke){g.strokeStyle=stroke;g.lineWidth=line;g.stroke();}
}
function stroke(points,color,width=2) {
  if(points.length<2)return;g.beginPath();g.moveTo(points[0].x,points[0].y);
  for(let i=1;i<points.length;i++)g.lineTo(points[i].x,points[i].y);
  g.lineWidth=width;g.strokeStyle=color;g.stroke();
}
function disc(x,y,rx,ry,fill){g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fillStyle=fill;g.fill();}
function rect(x,y,w,h,fill,round=0){g.fillStyle=fill;g.beginPath();if(round)g.roundRect(x,y,w,h,round);else g.rect(x,y,w,h);g.fill();}
function h32(x,y,z=0){let h=Math.imul(x+503,73856093)^Math.imul(y+701,19349663)^Math.imul(z+911,83492791);h^=h>>>16;return h>>>0;}
function cc0(id,x,y,scale=1,z=0,alpha=1){
  const image=blockImgs[id];if(!image?.complete||!image.naturalWidth)return false;
  const p=pos(x,y,z),w=109*scale,height=128*scale;
  g.save();g.globalAlpha=alpha;g.imageSmoothingEnabled=true;
  g.filter=["09","11","12"].includes(id)?"brightness(.69) saturate(.72) sepia(.14)":id==="15"?"brightness(.72) saturate(1.3) sepia(.17) hue-rotate(169deg)":"none";
  g.drawImage(image,p.x-w/2,p.y-height+25*scale,w,height);g.restore();return true;
}
function theme(){return hubActive?PALETTES[0]:PALETTES[(Math.max(1,run?.floor||1)-1)%PALETTES.length];}
function cull(x,y,margin=230){const p=pos(x,y);return p.x < -margin||p.x>W+margin||p.y < -margin||p.y>H+margin;}
function surface(tx,ty,h){
  const cx=(tx+.5)*T,cy=(ty+.5)*T,p=pos(cx,cy);
  if(p.x<-112||p.x>W+112||p.y<-85||p.y>H+85)return false;
  const t=theme(),rx=T*.91,ry=T*.46;
  let sector=0;
  if(hubActive){
    const u=(cx-HUB.x)/T,v=(cy-HUB.y)/T;
    sector=u<-5?(v<0?1:2):u>5?(v<0?3:4):v<-4?5:v>4?6:0;
  }else{
    let best=1e8;
    for(const r of rooms){const d=Math.abs(cx-r.cx)+Math.abs(cy-r.cy);
      if(d<best){best=d;sector=r.kind==="boss"?7:r.kind==="elite"?6:r.kind==="shrine"||r.kind==="secret"?5:r.kind==="treasure"?3:r.kind==="forge"?1:r.kind==="start"?4:0;}
    }
  }
  const shades=[t.stone,"#53677a","#55586d","#5b5e70","#506a74","#59536e","#62536c","#624756"];
  const base=shades[sector]||t.stone;
  const a={x:p.x,y:p.y-ry},b={x:p.x+rx,y:p.y},c={x:p.x,y:p.y+ry},d={x:p.x-rx,y:p.y};
  poly([a,b,c,d],base,t.mortar,1.15);
  // Every flagstone has a light-facing bevel and a darker southern lip.
  stroke([{x:d.x+2,y:d.y-1},{x:a.x,y:a.y+2},{x:b.x-2,y:b.y-1}],t.light+"65",1.5);
  stroke([{x:b.x,y:b.y+1},{x:c.x,y:c.y-2},{x:d.x+1,y:d.y+1}],t.dark+"a6",1.7);
  if((h&7)===1||sector===4){const o=7+(h%8);stroke([
    {x:p.x-o,y:p.y-1},{x:p.x-5,y:p.y+4},{x:p.x+o,y:p.y-2}
  ],t.mortar+"a0",1.1);}
  if(h%13===0){
    const ox=((h>>>5)%21)-10,oy=((h>>>10)%13)-6;
    stroke([{x:p.x+ox-12,y:p.y+oy-3},{x:p.x+ox-3,y:p.y+oy+2},{x:p.x+ox+4,y:p.y+oy}],t.dark+"aa",1.2);
  }
  // Floor construction is continuous; no massive stacked cubes obscuring movement.
  if(hubActive){
    const u=(cx-HUB.x)/T,v=(cy-HUB.y)/T;
    const axial=Math.abs(u)<1.12||Math.abs(v)<1.12;
    if(axial){
      poly([{x:p.x,y:p.y-ry*.79},{x:p.x+rx*.79,y:p.y},{x:p.x,y:p.y+ry*.79},{x:p.x-rx*.79,y:p.y}],h%6===0?"#b39a7788":"#8d829066","#c2ac8a55",1);
      if(h%8===0){disc(p.x,p.y,2.7,1.5,"#f7dbab");}
    }
    if(sector===5||sector===6){stroke([{x:p.x-19,y:p.y},{x:p.x,y:p.y-9},{x:p.x+19,y:p.y}],"#b2a0aa66",1.2);}
  }else if(sector===7){
    if(h%4===0)disc(p.x,p.y,3.5,2.2,"#b96798aa");
  }else if(h%29===0){
    stroke([{x:p.x-5,y:p.y+6},{x:p.x-4,y:p.y-1},{x:p.x+1,y:p.y-5}],t.plant+"b8",1.7);
  }
  return true;
}
isoFloorTile=surface;
function wall(tx,ty,side,height){
  // Proper masonry facades along exposed north and west boundaries.
  const x0=tx*T,y0=ty*T;
  const a=side==="north"?pos(x0,y0):pos(x0,y0);
  const b=side==="north"?pos(x0+T,y0):pos(x0,y0+T);
  if(a.x<-200&&b.x<-200||a.x>W+200&&b.x>W+200||a.y<-250&&b.y<-250||a.y>H+250&&b.y>H+250)return;
  const t=theme(),block=h32(tx,ty,side==="north"?1:2),wallHeight=hubActive?105:100;
  const near=Math.hypot(px-(tx+.5)*T,py-(ty+.5)*T);
  const alpha=near<95?.20:near<185?.43:1;
  g.save();g.globalAlpha=alpha;
  const A={x:a.x,y:a.y-wallHeight},B={x:b.x,y:b.y-wallHeight};
  poly([a,b,B,A],(block%6===0?t.stone:t.dark),t.mortar,2);
  // Brick courses and vertical staggered joins, all aligned to wall perspective.
  for(let course=1;course<=3;course++){
    const z=wallHeight*course/4;
    stroke([{x:a.x,y:a.y-z},{x:b.x,y:b.y-z}],t.light+"47",1.5);
    const count=course%2===0?2:3;
    for(let i=1;i<count;i++){
      const ratio=i/count+(course%2?0:.045);
      const xx=a.x+(b.x-a.x)*ratio,yy=a.y+(b.y-a.y)*ratio;
      stroke([{x:xx,y:yy-z},{x:xx,y:yy-z-wallHeight/4}],t.mortar+"d0",1.4);
    }
  }
  // Deep parapet, iron-studded crest and occasional slit window.
  poly([A,B,{x:B.x+4,y:B.y-9},{x:A.x+4,y:A.y-9}],t.light,t.mortar,1.5);
  if(block%4===0){
    const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    rect(mid.x-5,mid.y-wallHeight+29,10,28,"#162335",5);
    rect(mid.x-2,mid.y-wallHeight+31,4,15,block%3?"#91b4cf":"#efbf6a",2);
    stroke([{x:mid.x-6,y:mid.y-wallHeight+29},{x:mid.x+6,y:mid.y-wallHeight+29}],t.metal,2);
  }
  if(block%6===0){
    const k=pos(x0+(side==="north"?T/2:0),y0+(side==="west"?T/2:0));
    stoneColumnAt(k.x,k.y,114,t,.77);
  }
  if(block%17===0){
    const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    banner(mid.x,mid.y-wallHeight+30,19,39,t.cloth);
  }
  g.restore();
}
isoWall=wall;
function stoneColumnAt(x,y,height,t,scale=1){
  const w=17*scale;disc(x,y+2,17*scale,7*scale,"#0c142d60");
  rect(x-w/2-6*scale,y-height+12*scale,w+12*scale,height-4*scale,t.dark,3);
  rect(x-w/2,y-height+9*scale,w,height-11*scale,t.stone,2);
  rect(x-w/2+2*scale,y-height+15*scale,3*scale,height-28*scale,t.light+"9a");
  rect(x-w/2-8*scale,y-height,w+16*scale,13*scale,t.light,2);
  rect(x-w/2-6*scale,y-15*scale,w+12*scale,10*scale,t.metal,2);
  stroke([{x:x-w/2-8*scale,y:y-height+13*scale},{x:x+w/2+7*scale,y:y-height+13*scale}],t.mortar,1.5);
}
function banner(x,y,w,h,color){
  g.save();g.shadowColor="#0a0c22";g.shadowBlur=9;
  poly([{x:x-w/2,y},{x:x+w/2,y},{x:x+w/2-2,y:y+h},{x,y:y+h-10},{x:x-w/2+2,y:y+h}],color,"#252a3e",1.5);
  stroke([{x:x-w/2-4,y:y+4},{x:x+w/2+4,y:y+4}],"#d7b17c",4);
  stroke([{x,y:y+9},{x,y:y+h-19}],"#eccd965c",2);
  disc(x,y+h*.52,4,4,"#d7b17c");g.restore();
}
function arch(x,y,width,height,t,accent){
  const c=pos(x,y),w=width/2;
  const left=c.x-w,right=c.x+w,bottom=c.y+2,top=c.y-height;
  // Recessed arcade with deliberately asymmetrical carved voussoirs.
  g.save();g.fillStyle="#132237b8";
  g.beginPath();g.moveTo(left,bottom);g.lineTo(left,top+35);
  g.quadraticCurveTo(c.x,top-28,right,top+35);g.lineTo(right,bottom);g.closePath();g.fill();
  g.lineCap="square";g.lineWidth=18;g.strokeStyle=t.dark;
  g.beginPath();g.moveTo(left,top+35);g.quadraticCurveTo(c.x,top-43,right,top+35);g.stroke();
  g.lineWidth=11;g.strokeStyle=t.light;
  g.beginPath();g.moveTo(left,top+35);g.quadraticCurveTo(c.x,top-43,right,top+35);g.stroke();
  stroke([{x:left-8,y:top+39},{x:left-8,y:bottom}],t.stone,20);
  stroke([{x:right+8,y:top+39},{x:right+8,y:bottom}],t.stone,20);
  for(let i=1;i<6;i++){const a=PI+(i/6)*PI;const q={x:c.x+Math.cos(a)*(w+1),y:top+42+Math.sin(a)*41};
    disc(q.x,q.y,3.2,3.2,t.mortar);
  }
  stoneColumnAt(left-8,bottom,38,t,.75);stoneColumnAt(right+8,bottom,38,t,.75);
  disc(c.x,top+14,8,8,accent);disc(c.x,top+14,3,3,"#fff3d3");
  g.restore();
}
function torch(x,y,tint="#ffc879"){
  const p=pos(x,y);rect(p.x-5,p.y-76,10,65,"#493c48",3);
  rect(p.x-12,p.y-84,24,9,"#c59d67",4);
  const wobble=Math.sin(globalTime*8+x*.017)*6;
  g.save();g.shadowColor=tint;g.shadowBlur=30;
  poly([{x:p.x-9,y:p.y-82},{x:p.x-11,y:p.y-100},{x:p.x+wobble,y:p.y-126},{x:p.x+7,y:p.y-93},{x:p.x+11,y:p.y-82}],"#ff9e43","#f3c177",2);
  disc(p.x,p.y-89,5,12,"#fff2a9");g.restore();
  disc(p.x,p.y-10,27,12,"#dfaa6055");
}
function chasmRailing(x,y,t,w=150){
  const p=pos(x,y),half=w/2;
  stroke([{x:p.x-half,y:p.y-12},{x:p.x+half,y:p.y-12}],t.metal,5);
  for(let i=0;i<=4;i++){
    const xx=p.x-half+w*i/4;rect(xx-3,p.y-36,6,37,t.dark,2);disc(xx,p.y-36,4,4,t.light);
  }
}
function paveRug(x,y,w=150,color="#75485b"){
  const p=pos(x,y);
  poly([{x:p.x,y:p.y-w*.43},{x:p.x+w,y:p.y},{x:p.x,y:p.y+w*.43},{x:p.x-w,y:p.y}],color,"#c39b6c",2.8);
  poly([{x:p.x,y:p.y-w*.32},{x:p.x+w*.73,y:p.y},{x:p.x,y:p.y+w*.32},{x:p.x-w*.73,y:p.y}],"#1d2f43a1","#e6ba786f",2);
  for(let i=1;i<=5;i++){const xx=-w+i*w/3;disc(p.x+xx,p.y,2,2,"#dec699");}
}
function sigil(x,y,r,color){
  const p=pos(x,y);g.save();g.shadowColor=color;g.shadowBlur=16;
  g.beginPath();g.ellipse(p.x,p.y,r,r*.5,0,0,TAU);g.lineWidth=3;g.strokeStyle=color;g.stroke();
  for(let i=0;i<8;i++){
    const a=i*TAU/8+globalTime*.045;
    const q={x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r*.5};
    disc(q.x,q.y,3,2,"#f5e5b9");
  }
  stroke([{x:p.x-r*.5,y:p.y},{x:p.x,y:p.y-r*.24},{x:p.x+r*.5,y:p.y},{x:p.x,y:p.y+r*.24},{x:p.x-r*.5,y:p.y}],color,2);
  g.restore();
}
function shrub(x,y,seed){
  const p=pos(x,y),t=theme();
  disc(p.x,p.y,20,8,"#15233578");
  for(let i=0;i<5;i++){
    const a=i*2.5+seed;
    stroke([{x:p.x,y:p.y-2},{x:p.x+Math.cos(a)*13,y:p.y-9-Math.abs(Math.sin(a))*11}],t.plant,3);
    disc(p.x+Math.cos(a)*14,p.y-9-Math.abs(Math.sin(a))*11,5,6,i%2?"#7c9f8a":"#426f64");
  }
}
function looseProp(x,y,seed,variant=0){
  if(cull(x,y,150))return;
  const p=pos(x,y),t=theme();
  disc(p.x,p.y+3,34,13,"#091a2685");
  const k=seed%6;
  if(k===0){cc0("14",x,y,.60);rect(p.x-23,p.y-44,46,6,"#dbc28d");}
  else if(k===1){cc0("09",x,y,.56);stroke([{x:p.x-15,y:p.y-28},{x:p.x+15,y:p.y-28}],t.metal,2);}
  else if(k===2){shrub(x,y,seed);}
  else if(k===3){cc0(variant===7?"19":"15",x,y,.64);}
  else if(k===4){torch(x,y);}
  else {cc0("12",x,y,.58);disc(p.x,p.y-49,5,5,"#d7c6a5");}
}
const originalStation=isoStation;
function station(id,x,y){
  const t=theme(),p=pos(x,y);
  if(cull(x,y,390))return;
  if(id==="portal"){
    paveRug(x,y+24,142,"#35567c");
    arch(x,y+47,228,186,t,"#76dcf5");
    stoneColumnAt(p.x-137,p.y+35,144,t,1.3);stoneColumnAt(p.x+137,p.y+35,144,t,1.3);
    sigil(x,y+47,91,"#65bceb");
    for(const side of [-1,1]){banner(p.x+side*145,p.y-113,26,62,"#345b81");torch(x+side*158,y+89);}
  }else if(id==="forge"){
    paveRug(x,y+38,124,"#785147");
    arch(x,y+72,235,151,t,"#ffb561");
    stoneColumnAt(p.x-132,p.y+30,106,t,1.15);stoneColumnAt(p.x+130,p.y+30,106,t,1.15);
    for(let i=0;i<3;i++)cc0(i===0?"14":i===1?"16":"09",x-127+i*105,y+115,.61);
    torch(x-144,y-25);torch(x+143,y-27);
  }else if(id==="merchant"){
    paveRug(x,y+53,127,"#87674b");
    for(const side of [-1,1])stoneColumnAt(p.x+side*112,p.y+31,123,t,.96);
    banner(p.x-113,p.y-83,22,54,"#a64f59");banner(p.x+115,p.y-83,22,54,"#a64f59");
    looseProp(x-120,y+110,14);looseProp(x+150,y+60,17);
  }else if(id==="archive"){
    paveRug(x,y+40,134,"#584f77");
    arch(x,y+36,240,179,t,"#bf9cfc");
    stoneColumnAt(p.x-136,p.y+27,143,t,1.12);stoneColumnAt(p.x+136,p.y+27,143,t,1.12);
    cc0("15",x-110,y+94,.58);cc0("13",x+110,y+89,.58);
  }else if(id==="vault"){
    paveRug(x,y+43,135,"#526e6c");
    arch(x,y+34,233,150,t,"#a7e0d5");
    for(const side of [-1,1])stoneColumnAt(p.x+side*128,p.y+36,137,t,1.06);
    cc0("14",x-119,y+90,.66);cc0("14",x+119,y+90,.66);
  }else{
    paveRug(x,y+40,124,"#704e7a");
    for(let i=0;i<4;i++){
      const a=TAU*i/4;
      const q=pos(x+Math.cos(a)*114,y+Math.sin(a)*114);
      stoneColumnAt(q.x,q.y,89,t,.78);
    }
    sigil(x,y+20,105,"#c898ea");
    cc0("13",x-104,y+71,.55);cc0("13",x+109,y+76,.55);
  }
  // Preserve all previously implemented interactable station artwork.
  originalStation(id,x,y);
}
isoStation=station;
const originalDecor=isoDungeonDecor;
function dungeonDecor(r){
  if(!r.seen||cull(r.cx,r.cy,500))return;
  const t=theme(),x=r.cx,y=r.cy,p=pos(x,y),seed=h32(r.gx,r.gy,run?.floor||1);
  if(r.kind==="start"){
    paveRug(x,y,158,"#334d74");
    arch(x,y+48,215,165,t,"#69bfea");
    sigil(x,y,106,"#719aca");
    torch(x-212,y-162);torch(x+212,y+161);
  }else if(r.kind==="boss"){
    paveRug(x,y,230,"#70354e");
    sigil(x,y,191,"#d869a3");
    for(let i=0;i<4;i++){
      const a=i*TAU/4+PI/4;
      const q=pos(x+Math.cos(a)*245,y+Math.sin(a)*245);
      stoneColumnAt(q.x,q.y,153,t,1.25);
      banner(q.x,q.y-139,26,62,"#852e5e");
    }
    if(!r.cleared)torch(x-220,y-200,"#f269ae");
  }else if(r.kind==="elite"){
    paveRug(x,y,155,"#7e5341");
    sigil(x,y,129,"#d39c68");
    for(const [dx,dy] of [[-220,-145],[220,145]]){const q=pos(x+dx,y+dy);stoneColumnAt(q.x,q.y,135,t,1.2);}
    for(const [dx,dy] of [[-215,113],[225,-99]]){torch(x+dx,y+dy);}
  }else if(r.kind==="treasure"){
    paveRug(x,y+30,120,"#7b6742");
    arch(x,y+110,180,127,t,"#ecca76");
    cc0("14",x-121,y+115,.75);cc0("14",x+123,y+115,.78);
    sigil(x,y+12,75,"#ceba77");
  }else if(r.kind==="shrine"||r.kind==="secret"){
    paveRug(x,y,155,"#655477");
    arch(x,y+93,235,136,t,"#be9af3");
    sigil(x,y+27,116,"#a58bdc");
    cc0("13",x-147,y-120,.78);cc0("13",x+152,y-115,.78);
  }else if(r.kind==="heal"){
    paveRug(x,y,135,"#366e65");
    sigil(x,y+32,99,"#71ebc7");
    for(const [dx,dy] of [[-175,-94],[175,94]])shrub(x+dx,y+dy,seed);
  }else if(r.kind==="forge"){
    paveRug(x,y,131,"#7b513c");
    arch(x,y+99,190,139,t,"#ffa666");
    cc0("14",x-121,y+110,.74);torch(x+160,y-58);
  }else if(r.kind==="battle"){
    if(seed%3===0){
      arch(x+125,y-110,177,122,t,"#c7ad7c");
      looseProp(x-210,y+97,seed);looseProp(x+195,y+130,seed>>>7);
    }else if(seed%3===1){
      // Former guard post: broken barricade, supplies and a warm beacon.
      chasmRailing(x-173,y-125,t,135);
      cc0("14",x+225,y-107,.8);
      looseProp(x-172,y+129,seed);
      torch(x+184,y+120);
    }else{
      // Catacomb: spaced columns, banners and ruins (safe outside the combat centre).
      for(const [dx,dy] of [[-204,-148],[210,143]]){
        const q=pos(x+dx,y+dy);stoneColumnAt(q.x,q.y,134,t,1.1);
        banner(q.x+30,q.y-112,20,47,t.cloth);
      }
      cc0("09",x-140,y+160,.62);shrub(x+180,y-112,seed);
    }
    if(seed%4===0)looseProp(x+130,y+192,seed>>>5);
  }
  originalDecor(r);
}
isoDungeonDecor=dungeonDecor;
// Maintain the original hitboxes. Extra animation changes drawings, never combat timing.
const originalCharacter=isoCharacter;
let heroX=NaN,heroY=NaN,heroStride=0;
isoCharacter=function(id,x,y,w,h,alpha=1){
  const hero=(id==="wanderer"||id==="arcanist"||id==="bulwark");
  if(hero){
    const delta=Math.hypot(x-heroX,y-heroY);
    const moving=Number.isFinite(delta)&&delta>0.5;
    heroStride=moving?Math.min(1,heroStride+.24):Math.max(0,heroStride-.2);
    heroX=x;heroY=y;
    const q=pos(x,y),hop=heroStride*Math.abs(Math.sin(globalTime*13))*4;
    originalCharacter(id,x,y-hop,w,h,alpha);
    if(heroStride>.08){
      const shift=Math.sin(globalTime*13);
      for(const side of [-1,1]){
        disc(q.x+side*(14+shift*3),q.y+3+shift*side*2,10,3,"#141a2b88");
      }
    }
    if(dashTime>0){
      g.save();g.globalAlpha=.23+dashTime*.3;
      for(let i=1;i<=3;i++){
        const q2=pos(x-dashDir.x*20*i,y-dashDir.y*20*i);
        disc(q2.x,q2.y-42,14+i*5,25+i*4,"#78def1");}
      g.restore();
    }
  }else{
    originalCharacter(id,x,y,w,h,alpha);
    const q=pos(x,y);
    if(id==="boss"){
      // Crown of fractured runes; visually unique even when the monster is large.
      g.save();g.shadowColor="#f47be0";g.shadowBlur=14;
      for(let i=0;i<5;i++){
        const a=i*TAU/5+globalTime*.65;
        const xx=q.x+Math.cos(a)*54,yy=q.y-139+Math.sin(a)*20;
        poly([{x:xx,y:yy-11},{x:xx+6,y:yy},{x:xx,y:yy+8},{x:xx-6,y:yy}],"#cc72de","#332443",2);
      }g.restore();
    }else if(id==="wisp"){
      g.save();g.shadowColor="#64e2ed";g.shadowBlur=24;
      disc(q.x,q.y-41,18+Math.sin(globalTime*5)*4,27,"#71d6e53d");g.restore();
    }else if(id==="bomber"){
      g.save();g.shadowColor="#f8a746";g.shadowBlur=15;
      disc(q.x,q.y-89,5+Math.sin(globalTime*8)*1.5,9,"#ffda81");g.restore();
    }
  }
};

// Scene props now have their own silhouettes. These replace the old fallback
// that used identical white CC0 cubes for every collision object.
kenney=function(id,x,y,scale=1,opacity=1){
  if(cull(x,y,160))return true;
  const p=pos(x,y),t=theme(),r=Math.max(.3,scale),key=h32(Math.round(x/T),Math.round(y/T));
  g.save();g.globalAlpha=opacity;g.lineJoin="round";
  disc(p.x,p.y+2,30*r,11*r,"#09131e93");
  if(/stoneColumn|stoneWallColumn|stoneWall|stoneStep|stairs/i.test(id)){
    const h=(id.includes("Wall")?87:110)*r;
    stoneColumnAt(p.x,p.y,h,t,.9*r);
    if(key%4===0){
      disc(p.x,p.y-h+10*r,7*r,4*r,t.metal);
      stroke([{x:p.x-6*r,y:p.y-h+32*r},{x:p.x+6*r,y:p.y-h+35*r}],t.mortar,2);
    }
  }else if(/barrel/i.test(id)){
    const w=25*r,h=45*r;
    rect(p.x-w/2,p.y-h,w,h-5*r,"#936744",6*r);
    poly([{x:p.x-w/2,y:p.y-h+7*r},{x:p.x+w/2,y:p.y-h+7*r},
      {x:p.x+w/2-3*r,y:p.y-6*r},{x:p.x-w/2+3*r,y:p.y-6*r}],"#9d744f","#493b37",2);
    disc(p.x,p.y-h+3*r,w*.56,7*r,"#c49661");
    for(const yy of [p.y-h+13*r,p.y-14*r]){
      rect(p.x-w/2-2*r,yy,w+4*r,5*r,"#596b78",2*r);
      disc(p.x-5*r,yy+2*r,1.5*r,1.5*r,"#d8c497");
    }
    if(id.includes("Stacked")){
      const q=pos(x+19*r,y-21*r);
      rect(q.x-9*r,q.y-69*r,23*r,39*r,"#805736",5*r);
      disc(q.x+2*r,q.y-69*r,13*r,6*r,"#bb9466");
    }
  }else if(/wood|crate/i.test(id)){
    const width=27*r,h=34*r;
    const q=pos(x,y);
    poly([{x:q.x-width,y:q.y-h},{x:q.x,y:q.y-h-13*r},{x:q.x+width,y:q.y-h},
      {x:q.x,y:q.y-h+13*r}],"#be8d59","#594238",2);
    poly([{x:q.x-width,y:q.y-h},{x:q.x,y:q.y-h+13*r},{x:q.x,y:q.y+5*r},{x:q.x-width,y:q.y-7*r}],"#8e5d3f","#493a38",2);
    poly([{x:q.x,y:q.y-h+13*r},{x:q.x+width,y:q.y-h},{x:q.x+width,y:q.y-7*r},{x:q.x,y:q.y+5*r}],"#76543c","#493a38",2);
    stroke([{x:q.x-width+5*r,y:q.y-h+3*r},{x:q.x-5*r,y:q.y-h+13*r},{x:q.x-5*r,y:q.y}], "#c59c63",2.8*r);
    stroke([{x:q.x+5*r,y:q.y-h+13*r},{x:q.x+width-5*r,y:q.y-h+3*r},{x:q.x+width-5*r,y:q.y-5*r}], "#a98056",2.8*r);
    if(id.includes("Crates"))kenneyPropSecond(q.x+23*r,q.y+7*r,r*.75);
  }else if(/chest/i.test(id)){
    rect(p.x-26*r,p.y-44*r,52*r,33*r,"#865f41",5*r);
    rect(p.x-29*r,p.y-51*r,58*r,14*r,"#af8453",5*r);
    rect(p.x-18*r,p.y-53*r,6*r,45*r,"#bdac78",2*r);
    rect(p.x+12*r,p.y-53*r,6*r,45*r,"#bdac78",2*r);
    rect(p.x-7*r,p.y-38*r,14*r,16*r,"#d7b86b",2*r);
    disc(p.x,p.y-30*r,3*r,3*r,"#3c404b");
  }else if(/book|display|table|library/i.test(id)){
    const w=35*r,h=83*r;
    rect(p.x-w,p.y-h,w*2,h-7*r,"#775348",4*r);
    rect(p.x-w+6*r,p.y-h+8*r,w*2-12*r,h-22*r,"#252f42",3*r);
    for(let i=0;i<3;i++){
      const sy=p.y-h+(i+1)*21*r;
      rect(p.x-w+7*r,sy,w*2-14*r,3*r,"#b49062");
      for(let b=0;b<7;b++)rect(p.x-w+11*r+b*7*r,sy-17*r,5*r,16*r,
        ["#b06b65","#cba468","#568c94","#8b6b9c"][(b+i+key)%4],1*r);
    }
  }else{
    kenneyPropSecond(p.x,p.y,r);
  }
  g.restore();return true;
};
function kenneyPropSecond(x,y,r){
  rect(x-21*r,y-35*r,42*r,31*r,"#805a40",4*r);
  rect(x-16*r,y-42*r,32*r,12*r,"#ba8855",3*r);
  rect(x-3*r,y-44*r,6*r,42*r,"#d0ab6a",2*r);
}
// Shots and melee sparks get readable trails without modifying their hitboxes.
const previousShot=isoShot;
isoShot=function(s){
  previousShot(s);
  const p=pos(s.x,s.y,29);
  const size=s.enemy?11:s.kind==="arrow"?7:10;
  g.save();g.globalCompositeOperation="screen";
  g.shadowBlur=s.enemy?20:15;g.shadowColor=s.enemy?"#ff4e85":"#6ce8ff";
  disc(p.x,p.y,size,size*.65,s.enemy?"#ff7192bb":"#b3e4f5cc");
  if(s.kind==="arrow"){
    const q=pos(s.x+s.vx*.045,s.y+s.vy*.045,29);
    stroke([{x:p.x,y:p.y},{x:q.x,y:q.y}],"#ffe9b7",3.5);
    disc(q.x,q.y,3,3,"#fff5dc");
  }
  g.restore();
};
const previousParticle=isoParticle;
isoParticle=function(p){
  previousParticle(p);
  if(p.kind==="slash"||p.kind==="ring"||p.kind==="spark"){
    const q=pos(p.x,p.y,35),life=Math.max(0,p.life/p.max);
    g.save();g.globalCompositeOperation="screen";g.globalAlpha=life*.8;
    g.shadowColor=p.color||"#f6ca86";g.shadowBlur=16;
    if(p.kind==="slash"){
      const start=p.vx-p.vy*.5,end=p.vx+p.vy*.5,points=[];
      for(let i=0;i<=18;i++){
        const a=start+(end-start)*i/18;
        points.push(pos(p.x+Math.cos(a)*p.size,p.y+Math.sin(a)*p.size,35));}
      stroke(points,"#ffebc3",3.4*life);
    }else if(p.kind==="ring"){
      g.beginPath();g.ellipse(q.x,q.y,Math.max(8,p.size)*.9,Math.max(8,p.size)*.43,0,0,TAU);
      g.strokeStyle=p.color;g.lineWidth=3.3;g.stroke();
    }else{
      stroke([{x:q.x-4,y:q.y},{x:q.x+4,y:q.y-7}],p.color||"#fff5c9",3);
    }
    g.restore();
  }
};

// Read-only inspection marker for browser automation.
window.__fractureCitadel={version:"1",tiles:55,license:"Kenney CC0",architecture:true,ready:()=>BLOCK_IDS.every(id=>blockImgs[id].complete&&blockImgs[id].naturalWidth>0)};
})();
