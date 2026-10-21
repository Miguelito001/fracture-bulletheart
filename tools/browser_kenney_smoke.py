#!/usr/bin/env python3
"""Automated browser smoke for bundled Kenney art and real gameplay."""
import pathlib,subprocess,time,urllib.request
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent
srv=subprocess.Popen(['python','-m','http.server','8765','--bind','127.0.0.1','--directory',str(ROOT/'dist')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 for _ in range(60):
  try:urllib.request.urlopen('http://127.0.0.1:8765/',timeout=1);break
  except Exception:time.sleep(.25)
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox'])
  page=b.new_page(viewport={'width':1280,'height':720},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  response=page.goto('http://127.0.0.1:8765/',wait_until='load')
  assert response and response.status==200,response
  page.wait_for_function("() => typeof KENNEY_IDS !== 'undefined' && KENNEY_IDS.every(id=>assets['kenney-'+id]?.complete)",timeout=30000)
  missing=page.evaluate("() => KENNEY_IDS.filter(id=>!assets['kenney-'+id].naturalWidth)")
  assert not missing,'Missing Kenney images: '+str(missing)

  page.wait_for_function("() => typeof KENNEY_CHARACTER_FRAMES !== 'undefined' && Array.from({length:8},(_,d)=>KENNEY_CHARACTER_FRAMES.map(f=>'kenney-male-'+d+'-'+f)).flat().every(k=>assets[k]?.complete)",timeout=30000)
  missing_chars=page.evaluate("() => Array.from({length:8},(_,d)=>KENNEY_CHARACTER_FRAMES.map(f=>'kenney-male-'+d+'-'+f)).flat().filter(k=>!assets[k].naturalWidth)")
  assert not missing_chars,'Missing real Kenney character frames: '+str(missing_chars)
  print('KENNEY CHARACTER PNG LOADED:',48,flush=True)

  data=page.evaluate("() => ({count:KENNEY_IDS.length,mode,hub:hubActive,frame:document.querySelector('#scene').width})")
  print('KENNEY PNG LOADED:',data,flush=True);assert data['count']==48 and data['hub'] and data['frame']>0
  citadel=page.evaluate("() => window.__fractureCitadel")
  assert citadel and citadel['architecture'] and citadel['tiles']==55,citadel
  page.wait_for_function("() => window.__fractureCitadel?.ready?.() === true", timeout=30000)
  print('FRACTURED CITADEL ACTIVE:',citadel,flush=True)
  page.wait_for_timeout(400)
  page.screenshot(path=str(ROOT/'artpass-hub-smoke.png'))
  # Every visible station is a real interaction, not an unreachable painted menu.
  solid=page.evaluate("""() => {
    return hubStations.map(s=>({id:s.id,blocks:!walkable(s.x,s.y,15)}));
  }""")
  assert all(s['blocks'] for s in solid),'Missing station collisions: '+str(solid)
  navigation=page.evaluate("""() => {
    const start=tile(px,py),seen=new Set([start]),q=[start];
    const walk=(tx,ty)=>walkable((tx+.5)*T,(ty+.5)*T,12);
    for(let i=0;i<q.length;i++){
      const [x,y]=q[i].split(',').map(Number);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx,ny=y+dy,key=tileKey(nx,ny);
        if(!seen.has(key)&&walk(nx,ny)){seen.add(key);q.push(key);}
      }
    }
    return hubStations.map(s=>({
      station:s.id,
      reachable:[...seen].some(key=>{
        const [x,y]=key.split(',').map(Number);
        return Math.hypot((x+.5)*T-s.x,(y+.5)*T-s.y)<135;
      })
    }));
  }""")
  assert all(p['reachable'] for p in navigation),'Inaccessible station by real walking: '+str(navigation)
  print('HUB NAVIGATION REACHABLE:',navigation,flush=True)
  architectural=page.evaluate("() => structuralColliders.length>0 && structuralColliders.every(p=>structureCollision(p.x,p.y,3))")
  assert architectural,'Arch columns are not physical obstacles'
  for station in ['forge','merchant','vault','archive','altar']:
   page.evaluate("(id) => {const s=hubStations.find(q=>q.id===id);px=s.x+115;py=s.y;}",station)
   page.keyboard.press('e')
   result=page.evaluate("() => ({mode,text:document.querySelector('#overlay').textContent||''})")
   assert result['mode'] in ('choice','archive') and len(result['text'])>90,(station,result)
   page.evaluate("() => closeHubModal()")
  print('HUB STATIONS AND PHYSICAL COLLISION OK:',solid,flush=True)
  page.evaluate("() => {px=hubStations[0].x;py=hubStations[0].y+60;}")
  page.keyboard.press('e')
  page.wait_for_timeout(600)
  run=page.evaluate("() => ({hub:hubActive,mode,rooms:rooms.length,floor:run.floor})")
  assert not run['hub'] and run['mode']=='playing' and run['rooms']>=10,run

  # Procedural rooms must connect on ACTUAL walkable floor cells.
  # Run several different complete seeds to catch closed-off exits.
  connectivity=page.evaluate("""() => {
    const results=[];
    for(let attempt=0;attempt<7;attempt++){
      if(attempt)generateFloor();
      const initial=tile(rooms[0].cx,rooms[0].cy),seen=new Set([initial]),queue=[initial];
      for(let i=0;i<queue.length;i++){
        const [x,y]=queue[i].split(',').map(Number);
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const key=tileKey(x+dx,y+dy);
          if(world.has(key)&&!blocked.has(key)&&!seen.has(key)){seen.add(key);queue.push(key);}
        }
      }
      const reachable=rooms.every(r=>seen.has(tile(r.cx,r.cy)));
      const distinct=new Set(rooms.map(r=>{
        let bits='';
        for(let y=-5;y<=5;y++)for(let x=-7;x<=7;x++)bits+=world.has(tileKey(Math.floor(r.cx/T)+x,Math.floor(r.cy/T)+y))?'1':'0';
        return bits;
      })).size;
      const propsPhysical=sceneProps.every(p=>blocked.has(tile(p.x,p.y))&&!walkable(p.x,p.y,12));
      results.push({rooms:rooms.length,walkable:seen.size,reachable,shapes:distinct,
        props:sceneProps.length,propsPhysical});
    }
    return results;
  }""")
  assert all(x['reachable'] and x['shapes']>=3 and x['props']>0 and x['propsPhysical'] for x in connectivity),connectivity
  print('PROCEDURAL GEOMETRY AND COLLISION OK:',connectivity,flush=True)
  page.wait_for_timeout(120)
  # Clicking visible HUD items actually changes equipped weapons.
  page.locator('#weapon2').click()
  assert page.evaluate("() => run.slot")==1,'Weapon 2 click did not select weapon'
  page.locator('#weapon1').click()
  assert page.evaluate("() => run.slot")==0,'Weapon 1 click did not select weapon'
  print('INTERACTIVE HUD OK',flush=True)
  # Session restores the exact same world, including prop identities.
  previous=page.evaluate("() => {persistSession();return {tiles:world.size,props:sceneProps.length};}")
  page.reload(wait_until='load')
  page.wait_for_function("() => typeof mode !== 'undefined' && mode==='playing' && window.__fractureCitadel?.ready?.()===true",timeout=30000)
  restored=page.evaluate("() => ({tiles:world.size,props:sceneProps.length,mode})")
  assert restored['tiles']==previous['tiles'] and restored['props']==previous['props'],(previous,restored)
  print('SAVE/RESTORE WORLD TOPOLOGY OK:',restored,flush=True)
  page.screenshot(path=str(ROOT/'artpass-dungeon-smoke.png'))
  page.evaluate("() => {const r=rooms.find(r=>r.kind==='battle');if(r){px=r.cx;py=r.cy;visitRoom(r);}}")
  page.wait_for_timeout(450)
  page.screenshot(path=str(ROOT/'artpass-combat-smoke.png'))
  assert not errors,'JS errors: '+str(errors)
  # Return physically to Node Zero and extract an actual material into permanent storage.
  page.evaluate("() => {mobs.forEach(m=>m.dead=true);current=null;px=rooms[0].cx;py=rooms[0].cy;run.cargo=[{id:'scrap',qty:3}];}")
  old_stash=page.evaluate("() => save.stash.scrap||0")
  old_count=page.evaluate("() => save.extractions||0")
  page.keyboard.press('e')
  page.wait_for_timeout(150)
  extraction=page.evaluate("() => ({hub:hubActive,mode,stash:save.stash.scrap||0,extractions:save.extractions||0})")
  assert extraction['hub'] and extraction['mode']=='choice',extraction
  assert extraction['stash']==old_stash+3,extraction
  assert extraction['extractions']==old_count+1,extraction
  assert not errors,'JS errors: '+str(errors)
  print('GAMEPLAY AND EXTRACTION OK:',run,extraction,'PAGE ERRORS: 0',flush=True)
  # Emit genuine downscaled browser captures in QA logs for visual inspection.
  from PIL import Image
  from io import BytesIO
  import base64
  for label,filename in [('HUB','artpass-hub-smoke.png'),('COMBAT','artpass-combat-smoke.png')]:
   im=Image.open(ROOT/filename).convert('RGB')
   im.thumbnail((640,360))
   buf=BytesIO();im.save(buf,format='JPEG',quality=58,optimize=True)
   print('FRACTURE_VISUAL_'+label+'_START'+base64.b64encode(buf.getvalue()).decode('ascii')+'FRACTURE_VISUAL_'+label+'_END',flush=True)
  b.close()
finally:srv.terminate()
