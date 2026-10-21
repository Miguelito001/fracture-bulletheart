/* FRACTURE — O REINO PARTIDO: CARTOON VOXEL ART PASS.
   Kenney Isometric Blocks (CC0). Gameplay, saves and collision remain untouched.
   Completely replaces the miniature-photo aesthetic with coherent chibi art. */
(function () {
  "use strict";
  const BLOCKS = ["09","11","12","13","14","15","17","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36","37","38","39","40"];
  const voxelArt = {};
  for (const id of BLOCKS) {
    const img = new Image();
    img.src = "./assets/voxel/voxelTile_" + id + ".png";
    voxelArt[id] = img;
  }
  let twinkleClock = 0;
  function hash(a,b,s=0) {return ((Math.imul(a+97, 73856093)^Math.imul(b+107, 19349663)^Math.imul(s+13, 83492791))>>>0);}
  function voxel(id,x,y,scale=1,elevation=0,opacity=1) {
    const img=voxelArt[id],p=isoPoint(x,y);
    const w=109*scale,h=128*scale;
    if(img && img.complete && img.naturalWidth) {
      g.save();g.globalAlpha=opacity;g.imageSmoothingEnabled=true;
      // Neutral stone, not luminous white cubes competing with actors and portal.
      g.filter=["09","11","12"].includes(id)?"brightness(.69) saturate(.69) sepia(.10)":id==="13"?"brightness(.79) saturate(.70)":id==="15"?"brightness(.72) saturate(1.30) sepia(.17) hue-rotate(169deg)":"none";
      g.drawImage(img,p.x-w/2,p.y-27*scale-elevation,w,h);
      g.restore();return true;
    }
    const palette={"09":["#8597a0","#50606c","#596b78"],"12":["#e6c69a","#987c65","#bb9671"],"11":["#bd9b74","#526576","#62788b"],"14":["#ca8c56","#845536","#a96c43"],"19":["#dd7451","#696070","#836372"],"13":["#d8f7fc","#769eb2","#95c2cd"]}[id]||["#a7adb8","#636b81","#7b7890"];
    isoPrism(x,y,30*scale,51*scale,palette[0],palette[1],palette[2]);
    return false;
  }
  function groundColor(f,h) {
    if(hubActive) return h%103===0?"13":h%23===0?"12":h%13===0?"11":"09";
    const region=(run?.floor||1)%5;
    if(region===2)return h%19===0?"12":h%11===0?"11":"09";
    if(region===3)return h%17===0?"13":h%7===0?"11":"09";
    if(region===4)return h%13===0?"19":h%9===0?"12":"09";
    if(h%113===0)return "19";
    return h%29===0?"12":h%13===0?"11":"09";
  }
  isoFloorTile=function(tx,ty,h) {
    const x=(tx+.5)*T,y=(ty+.5)*T,p=isoPoint(x,y);
    if(p.x < -160||p.x > W+160||p.y < -180||p.y > H+180)return false;
    const id=groundColor(run?.floor||1,h);
    voxel(id,x,y,1,0,1);
    /* Inlaid paths turn the base into a navigable place instead of a menu room. */
    if(hubActive){
      const u=x-HUB.x,v=y-HUB.y;
      const trunk=Math.abs(u)<T*.69&&Math.abs(v)<T*5;
      const cross=Math.abs(v)<T*.72&&Math.abs(u)<T*6;
      if(trunk||cross){
        isoDiamond(x,y,42,21,"#33445fba","#ba9a6f9c");
        if(h%6===0){const q=isoPoint(x,y);g.strokeStyle="#d8b97e85";g.lineWidth=1.2;
          g.beginPath();g.moveTo(q.x-9,q.y+1);g.lineTo(q.x,q.y-3);g.lineTo(q.x+9,q.y+1);g.stroke();}
      }
    }
    /* Hand-placed marks, darker grout, moss and golden motes per cell.
       Sparse deterministic details: no photo textures or repeating overlays. */
    if(h%3===0){
      g.save();g.strokeStyle=hubActive?"#e2b77745":"#27445499";g.lineWidth=1;
      const ox=((h>>>3)%25)-12,oy=((h>>>7)%12)-6;
      g.beginPath();g.moveTo(p.x+ox-12,p.y+oy-1);g.lineTo(p.x+ox-3,p.y+oy+3);
      g.lineTo(p.x+ox+4,p.y+oy-1);g.stroke();g.restore();
    }
    if(h%29===0){
      const q=isoPoint(x-13,y+9);g.strokeStyle=hubActive?"#5fb89a":"#456c80";g.lineWidth=2;
      g.beginPath();g.moveTo(q.x,q.y);g.lineTo(q.x-5,q.y-10);g.moveTo(q.x,q.y);g.lineTo(q.x+6,q.y-8);g.stroke();
    }
    if(h%43===0){
      const q=isoPoint(x+8,y-4);g.save();g.shadowColor="#fbbd5a";g.shadowBlur=13;
      ell(q.x,q.y-2,2.6,2.6,"#f3c67b");g.restore();
    }
    /* Shared open-source block shape prevents photographic texture seams. */
    if(h%17===0){const u=isoPoint(x-9,y-12);
      g.save();g.strokeStyle=hubActive?"#e6bc7947":"#a4ccda43";g.lineWidth=1.3;
      g.beginPath();g.moveTo(u.x,u.y);g.lineTo(u.x+9,u.y+5);g.lineTo(u.x+15,u.y+2);g.stroke();g.restore();}
    if(hubActive&&h%61===0){const u=isoPoint(x,y);
      g.fillStyle="#f7c7818c";g.fillRect(u.x+4,u.y-4,3,3);}
    return true;
  };
  isoWall=function(tx,ty,orient,height) {
    const x=(tx+(orient==="north"?.5:0))*T,y=(ty+(orient==="west"?.5:0))*T;
    const nearby=Math.hypot(px-x,py-y),op=nearby<100?.28:nearby<176?.65:1;
    const key=hash(tx,ty),mat=hubActive?"12":((run?.floor||1)===4?"19":"09");
    voxel(mat,x,y,1,71,op);
    if(key%7===0)voxel(hubActive?"15":"11",x,y,.77,137,op);
    if(key%19===0)voxel("14",x,y,.5,192,op);
    if(key%13===0)isoTorch(x,y);
    if(key%11===0){const p=isoPoint(x,y),c=hubActive?"#b56b62":"#805368";
      poly([[p.x-26,p.y-136],[p.x+27,p.y-135],[p.x+21,p.y-82],[p.x,p.y-70],[p.x-23,p.y-84]],c,"#503848",2);
      const q=p;g.fillStyle="#dcb96e";g.beginPath();g.arc(q.x,q.y-110,6,0,Math.PI*2);g.fill();}
    if(key%23===0){voxel("14",x,y,.43,72,op);}

  };
  /* A coherent art style: oversized expressive faces, strong dark silhouettes,
     saturated cloaks, readable enemy taxonomy and a true ground contact shadow. */
  function ell(cx,cy,rx,ry,color) {
    g.fillStyle=color;g.beginPath();g.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);g.fill();
  }
  function rounded(x,y,w,h,r,color,edge) {
    g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=color;g.fill();
    if(edge){g.strokeStyle=edge;g.lineWidth=2;g.stroke();}
  }
  function poly(points,fill,stroke,weight=2) {
    g.beginPath();g.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)g.lineTo(points[i][0],points[i][1]);
    g.closePath();g.fillStyle=fill;g.fill();
    if(stroke){g.strokeStyle=stroke;g.lineWidth=weight;g.stroke();}
  }
  function toonHero(cx,cy,s=1,kind="wanderer",facing=1) {
    const palette={wanderer:["#315f97","#204578","#b94353","#ecd3a5"],bulwark:["#94754c","#665238","#ce9d50","#e7c49b"],arcanist:["#7253a6","#473478","#6ad4ec","#efcfae"],npc:["#746344","#51442e","#b9a37d","#e8c6a1"]}[kind]||["#315f97","#204578","#b94353","#ecd3a5"];
    const [cloth,shade,trim,skin]=palette;
    g.save();g.translate(cx,cy);g.scale(s*facing,s);g.lineJoin="round";
    /* boots and legs */
    rounded(-16,-20,12,18,3,"#2d2537","#14192a");
    rounded(6,-20,12,18,3,"#2d2537","#14192a");
    rounded(-20,-8,17,9,3,"#45372e","#161a28");
    rounded(4,-8,18,9,3,"#45372e","#161a28");
    /* cloak fans away with walking movement */
    const sway=Math.sin(globalTime*8+cx*.01)*3;
    poly([[-20,-65],[18,-65],[24+sway,-18],[0,-11],[-23,-20]],shade,"#1b2132",2.5);
    poly([[-15,-60],[12,-60],[17,-30],[-16,-29]],cloth,"#24374f",2);
    rounded(-21,-59,12,28,5,cloth,"#27374d");
    rounded(12,-59,12,28,5,cloth,"#27374d");
    /* scarf and bronze buckle */
    poly([[-17,-57],[15,-57],[11,-48],[-14,-48]],trim,"#34273f",1.5);
    rounded(-5,-36,10,7,2,"#e9b65e","#563d35");
    /* big expressive hood and face */
    poly([[-23,-65],[-22,-84],[-10,-97],[8,-97],[22,-82],[22,-61],[11,-55],[-13,-56]],shade,"#151c2f",3);
    poly([[-20,-80],[-8,-96],[9,-94],[20,-81],[16,-65],[-18,-65]],cloth,"#26354a",2);
    rounded(-13,-79,26,19,6,skin,"#37283a");
    rounded(-13,-83,27,9,4,shade);
    rounded(-9,-72,6,3,1,"#17253c");rounded(4,-72,6,3,1,"#17253c");
    /* shiny edge on hood */
    g.strokeStyle="#99d8e68a";g.lineWidth=2;g.beginPath();g.moveTo(-19,-78);g.lineTo(-12,-92);g.lineTo(1,-94);g.stroke();
    g.restore();
  }
  function toonMonster(cx,cy,s,kind) {
    g.save();g.translate(cx,cy);g.scale(s,s);g.lineJoin="round";
    if(kind==="crawler"||kind==="boss"||kind==="elite"){
      const boss=kind==="boss",c=boss?"#b66ace":kind==="elite"?"#dd8848":"#87b950";
      poly([[-25,-45],[-37,-61],[-28,-72],[-8,-62],[11,-62],[28,-73],[37,-62],[24,-44]],"#554160","#1d2635",3);
      ell(0,-27,32,34,c);
      poly([[-29,-41],[-33,-61],[-14,-70],[-9,-48]],"#e9d8a4","#263341",2);
      poly([[29,-41],[33,-61],[14,-70],[9,-48]],"#e9d8a4","#263341",2);
      ell(-12,-35,6,8,"#f9e5a8");ell(12,-35,6,8,"#f9e5a8");
      ell(-12,-35,3,4,"#382329");ell(12,-35,3,4,"#382329");
      rounded(-10,-17,20,10,3,"#583437");
      poly([[-7,-16],[-3,-24],[1,-16]],"#f5e9b3");
      poly([[4,-16],[8,-24],[12,-16]],"#f5e9b3");
      rounded(-20,-3,12,6,3,"#4b4556");rounded(8,-3,12,6,3,"#4b4556");
      if(kind!=="crawler"){rounded(-32,-38,12,27,5,"#bc7245","#56384b");rounded(20,-38,12,27,5,"#bc7245","#56384b");}
    }else if(kind==="wisp"){
      const bob=Math.sin(globalTime*4+cx)*5;
      g.translate(0,bob);g.shadowColor="#7ff0fc";g.shadowBlur=18;
      poly([[-21,-12],[-24,-38],[-14,-66],[0,-79],[17,-59],[22,-35],[17,-11],[7,-19],[-1,-9],[-10,-19]],"#5bc8ef","#25638c",3);
      ell(-8,-42,4,7,"#102849");ell(9,-42,4,7,"#102849");g.shadowBlur=0;
    }else if(kind==="bomber"){
      ell(0,-33,28,27,"#c77847");ell(0,-37,22,20,"#f0b25f");
      rounded(-5,-72,10,18,3,"#5b4e48");g.fillStyle="#f8e692";g.beginPath();g.arc(0,-76,7,0,Math.PI*2);g.fill();
      ell(-9,-39,4,5,"#452b36");ell(9,-39,4,5,"#452b36");
    }else if(kind==="ranger"||kind==="knight"){
      toonHero(0,0,1,kind==="ranger"?"arcanist":"bulwark",1);
      if(kind==="ranger"){g.strokeStyle="#9df2b8";g.lineWidth=3;g.beginPath();g.arc(21,-41,23,-Math.PI/2,Math.PI/2);g.stroke();}
      else {rounded(-16,-74,33,9,4,"#b1c8ce","#2d3e55");}
    }
    g.restore();
  }
  isoCharacter=function(id,x,y,w,h,alpha=1) {
    const p=isoPoint(x,y),boss=id==="boss",s=(boss?1.7:id==="elite"?1.23:id==="crawler"?.83:id==="wisp"?.87:1);
    g.save();g.globalAlpha=alpha;ell(p.x,p.y+1,26*s,10*s,"#0c15239c");
    const bounce=id==="wanderer"||id==="bulwark"||id==="arcanist" ? Math.sin(globalTime*10)*(Math.hypot(px-lastHeroX,py-lastHeroY)>3?2:0):Math.sin(globalTime*3+x)*1.2;
    if(id==="wanderer"||id==="bulwark"||id==="arcanist"){toonHero(p.x,p.y+bounce,s,id,(Math.cos(heroDirection*Math.PI/4)>=0)?1:-1);}
    else if(id==="crawler"||id==="boss"||id==="elite"||id==="wisp"||id==="bomber"||id==="ranger"||id==="knight"){toonMonster(p.x,p.y+bounce,s,id);}
    else toonHero(p.x,p.y+bounce,1,"npc");
    g.restore();
  };
  /* Cartoon architecture uses colored blocks and world objects instead of floating labels. */
  isoTorch=function(x,y) {
    const p=isoPoint(x,y),f=Math.sin(globalTime*9+x*.01)*4;
    rounded(p.x-5,p.y-59,10,53,3,"#754c3e","#282c3b");
    ell(p.x,p.y-61,19,5,"#593942");
    g.save();g.shadowColor="#ffa94c";g.shadowBlur=26;
    poly([[p.x-9,p.y-66],[p.x-3,p.y-88+f],[p.x+2,p.y-98-f],[p.x+12,p.y-72],[p.x+5,p.y-60]],"#ff9a43","#f9bf61",1.7);
    ell(p.x,p.y-70,5,9,"#fff4a1");g.restore();
    isoGlow(x,y-80,125,"#ff9a3038");
  };
  function isoGem(x,y,c="#74e6ff",height=45) {
    const p=isoPoint(x,y);g.save();g.shadowColor=c;g.shadowBlur=18;
    poly([[p.x,p.y-height-28],[p.x+15,p.y-height],[p.x,p.y-height+19],[p.x-15,p.y-height]],c,"#d4faff",2);
    poly([[p.x,p.y-height-28],[p.x+15,p.y-height],[p.x,p.y-height+19]],"#256fb5a0");g.restore();
  }
  function altarBase(x,y,color="#263951",r=65) {
    isoDiamond(x,y,r*1.6,r*.79,color,"#bd9654");
    isoDiamond(x,y,r*1.3,r*.63,"#21334d","#b7a175");
    const p=isoPoint(x,y);g.strokeStyle="#e8cc8788";g.lineWidth=2;g.beginPath();g.ellipse(p.x,p.y,r*.82,r*.36,0,0,Math.PI*2);g.stroke();
  }
  function toonPortal(x,y) {
    altarBase(x,y+33,"#284060",88);
    // The arch and its collidable stone pillars are authored in fracture_world.js.
    const p=isoPoint(x,y),beat=globalTime*2;
    g.save();g.shadowColor="#53c3ff";g.shadowBlur=45;
    ell(p.x,p.y-103,47,71,"#10275c");ell(p.x,p.y-103,41,65,"#2877d1");
    ell(p.x,p.y-103,34,56,"#56bbed");ell(p.x,p.y-103,25,47,"#164185");
    g.strokeStyle="#c6f6ff";g.lineWidth=5;
    g.beginPath();g.ellipse(p.x,p.y-103,39,61,0,beat,beat+Math.PI*1.35);g.stroke();
    for(let i=0;i<6;i++){const a=beat*.7+i*2.41;ell(p.x+Math.sin(a)*56,p.y-103+Math.cos(a)*68,3.5,3.5,"#b4edff");}
    g.restore();isoGlow(x,y-120,215,"#458fe94b");
    const focus=distance({x:px,y:py},{x,y});
    if(!hubActive&&focus<115)isoText(run.floor===1?"[ E ] EXTRAIR ESPÓLIO":"[ E ] VOLTAR AO ANDAR ANTERIOR",p.x,p.y-208,15,"#d0f4ff");
  }
  function floorDecor(x,y,kind) {
    const p=isoPoint(x,y);
    if(kind==="moss"){
      g.strokeStyle="#539788";g.lineWidth=3;
      for(let i=0;i<5;i++){const dx=Math.sin(i*9+x)*15,dy=Math.cos(i*11+y)*8;
        g.beginPath();g.moveTo(p.x+dx,p.y+dy);g.lineTo(p.x+dx+4,p.y+dy-11);g.stroke();}
    }else if(kind==="crystals"){
      for(let i=0;i<3;i++)isoGem(x+i*17-18,y+Math.sin(i*3)*18,["#6bd9f1","#8bdceb","#9d8fff"][i],18+i*7);
    }
  }
  function toonForge(x,y) {

    const p=isoPoint(x,y);
    /* furnace with cast iron mouth and orange animated light */
    rounded(p.x-75,p.y-141,100,112,14,"#4b4b5e","#c9a16c");
    rounded(p.x-59,p.y-119,67,72,11,"#192735","#dca970");
    g.save();g.shadowBlur=28;g.shadowColor="#ff8c28";
    ell(p.x-24,p.y-64,25,35,"#ff853b");ell(p.x-24,p.y-63,11,25,"#fff0a1");g.restore();
    isoGlow(x-50,y-28,175,"#ff7d3044");
    floorDecor(x-115,y+125,"moss");
    /* anvil */

    poly([[p.x+25,p.y-44],[p.x+88,p.y-44],[p.x+77,p.y-32],[p.x+15,p.y-32]],"#9cc2cb","#24354b",3);
    for(let i=0;i<4;i++){const a=globalTime*2+i*1.63;ell(p.x-27+Math.sin(a)*40,p.y-87-Math.cos(a)*29,3,5,"#ffd585");}

  }
  function toonMerchant(x,y) {
    const p=isoPoint(x,y);

    rounded(p.x-78,p.y-97,7,85,2,"#69483c");rounded(p.x+80,p.y-97,7,85,2,"#69483c");
    poly([[p.x-98,p.y-107],[p.x-43,p.y-136],[p.x+46,p.y-136],[p.x+104,p.y-107],[p.x+74,p.y-75],[p.x-74,p.y-75]],"#b64c59","#35263c",3);
    for(let i=-1;i<=1;i++)poly([[p.x+i*51-24,p.y-111],[p.x+i*51+13,p.y-133],[p.x+i*51+37,p.y-103],[p.x+i*51+12,p.y-78]],i===0?"#f1b674":"#d66864");
    rounded(p.x-68,p.y-34,148,36,7,"#95603d","#442f37");
    for(let i=0;i<6;i++)ell(p.x-48+i*21,p.y-35-((i*7)%15),7,6,i%2?"#e4c16e":"#72d4be");
    toonHero(p.x+5,p.y-34,.66,"npc",1);
    floorDecor(x+120,y+78,"moss");

  }
  function toonArchive(x,y) {
    const p=isoPoint(x,y);

    for(let i=0;i<2;i++){
      const px0=p.x+(i===0?-82:4);
      rounded(px0,p.y-147,76,120,5,"#65473f","#ca9a6b");
      for(let row=0;row<3;row++){
        rounded(px0+5,p.y-141+row*38,66,31,3,"#262b43");
        for(let b=0;b<8;b++){const colors=["#a75358","#62a8ba","#e0b45c","#876ab4"];rounded(px0+8+b*7,p.y-137+row*38,5,23,1,colors[(row+b*2+i)%4]);}
      }
    }
    isoGem(x+70,y-35,"#9bbdff",86);
    floorDecor(x-85,y+100,"crystals");

  }
  function toonVault(x,y) {
    const p=isoPoint(x,y);
    // Real masonry vault wings are provided by the collidable station geometry.
    rounded(p.x-54,p.y-121,108,93,11,"#425569","#c59e6b");
    rounded(p.x-40,p.y-112,80,73,9,"#233646","#a9b5be");
    ell(p.x,p.y-78,17,18,"#d9b26a");ell(p.x,p.y-78,9,10,"#485765");

    floorDecor(x+110,y+100,"moss");

  }
  function toonAltar(x,y) {
    altarBase(x,y+20,"#553858",78);isoGem(x,y,"#dda8fb",109);
    const p=isoPoint(x,y);
    for(let i=0;i<4;i++){const a=i*Math.PI/2+globalTime*.2;ell(p.x+Math.cos(a)*62,p.y-8+Math.sin(a)*30,3,3,"#ebbbff");}
  }
  isoStation=function(id,x,y) {
    if(id==="portal")toonPortal(x,y);
    else if(id==="forge")toonForge(x,y);
    else if(id==="merchant")toonMerchant(x,y);
    else if(id==="archive")toonArchive(x,y);
    else if(id==="vault")toonVault(x,y);
    else toonAltar(x,y);
  };
  isoDungeonDecor=function(r) {
    if(!r.seen)return;
    const p=isoPoint(r.cx,r.cy);
    if(p.x < -330||p.x>W+330||p.y < -250||p.y>H+250)return;
    if(r.kind==="start"){toonPortal(r.cx,r.cy-50);return;}
    if(r.kind==="boss"||r.kind==="elite"){
      altarBase(r.cx,r.cy,r.kind==="boss"?"#502c64":"#574039",115);
      // Architectural columns replace non-solid pale stone voxel blocks.
      if(r.cleared)isoText("[ E ] DESCER",p.x,p.y-145,16,"#e6c8ff");
    }else if(r.kind==="treasure"){isoGem(r.cx,r.cy,"#e9bc6d",83);}
    else if(r.kind==="shrine"||r.kind==="secret")toonAltar(r.cx,r.cy);
    else if(r.kind==="forge")toonForge(r.cx,r.cy);
    else if(r.kind==="heal"){altarBase(r.cx,r.cy,"#2d5e63",82);isoGem(r.cx,r.cy,"#70ebcc",75);}
    else if(r.kind==="battle"){
      const n=hash(r.gx,r.gy);
  
  
  
  
    }
    if(r.active){const n=r.connections||[];for(const id of n){const next=rooms[id],a=Math.atan2(next.cy-r.cy,next.cx-r.cx),v=vec(a,T*7.3),q=isoPoint(r.cx+v.x,r.cy+v.y);
      g.strokeStyle="#ee737f";g.lineWidth=7;g.beginPath();g.moveTo(q.x-12,q.y-6);g.lineTo(q.x+12,q.y+6);g.stroke();}}
  };

  function bloomLight(x,y,c,r=260,intensity=1){
    const q=isoPoint(x,y),a=Math.max(.1,intensity);
    g.save();g.globalCompositeOperation="screen";
    const light=g.createRadialGradient(q.x,q.y,3,q.x,q.y,r);
    light.addColorStop(0,c+"50");light.addColorStop(.25,c+"2e");light.addColorStop(.65,c+"13");light.addColorStop(1,c+"00");
    g.globalAlpha=Math.min(1,a);g.fillStyle=light;g.fillRect(q.x-r,q.y-r,r*2,r*2);g.restore();
  }
  function animatedAtmosphere(){
    if(hubActive){
      bloomLight(hubStations[0].x,hubStations[0].y-100,"#50c4fa",325,1);
      bloomLight(hubStations[1].x,hubStations[1].y-50,"#ff983b",320,.9);
      bloomLight(hubStations[2].x,hubStations[2].y-60,"#ffca72",220,.7);
      bloomLight(hubStations[3].x,hubStations[3].y-55,"#74d7b2",200,.65);
      bloomLight(hubStations[4].x,hubStations[4].y-50,"#ba90ff",225,.65);
      bloomLight(hubStations[5].x,hubStations[5].y-50,"#d19bff",240,.7);
    }else{
      for(const r of rooms){
        if(!r.seen)continue;
        const p=isoPoint(r.cx,r.cy);
        if(p.x<-320||p.x>W+320||p.y<-320||p.y>H+320)continue;
        if(r.kind==="start")bloomLight(r.cx,r.cy-40,"#428df9",285,1);
        else if(r.kind==="forge")bloomLight(r.cx,r.cy,"#ff9941",260,.9);
        else if(r.kind==="elite"||r.kind==="boss")bloomLight(r.cx,r.cy,"#d85895",250,.55);
        else if(r.kind==="treasure")bloomLight(r.cx,r.cy,"#ffc56b",200,.35);
      }
    }
    const fog=g.createLinearGradient(0,0,W,H);
    fog.addColorStop(0,"#273a6709");fog.addColorStop(.65,"#5e58a004");fog.addColorStop(1,"#0c183f0a");
    g.fillStyle=fog;g.fillRect(0,0,W,H);
  }
  /* Some legacy miniature props are used for collision only; visible obstacles get voxel silhouettes. */
  const previousWorld=drawIsoWorld;
  drawIsoWorld=function(){
    previousWorld();
    animatedAtmosphere();
    /* Floating sparks and a soft atmospheric wash make the hub feel inhabited. */
    if(hubActive) {
      g.save();
      for(let i=0;i<25;i++){
        const phase=globalTime*(.16+(i%5)*.04)+i*19.23;
        const xx=((i*89.71+Math.sin(phase)*33)%W+W)%W;
        const yy=((i*51.17-phase*17)%H+H)%H;
        g.globalAlpha=.27+Math.sin(phase*3)*.12;
        ell(xx,yy,1.2,1.8,i%3===0?"#b4f1ff":"#ffd19a");
      }
      g.restore();
    }
  };
  /* Replace remaining miniature/photographic props with the same CC0 voxel vocabulary. */
  kenney=function(id,x,y,scale=1,opacity=1){
    const wood=/barrel|wood|table|chest/i.test(id);
    const crystal=/altar|display|book/i.test(id);
    return voxel(wood?"14":crystal?"15":"09",x,y,scale*.82,0,opacity);
  };
  window.__fractureCartoonArtPass=true;
  /* The bottom HUD remains interactive and all hotkeys/combat are unchanged. */
})();
