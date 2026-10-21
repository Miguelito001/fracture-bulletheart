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
  page.screenshot(path=str(ROOT/'artpass-hub-smoke.png'))
  page.evaluate("() => {px=hubStations[0].x;py=hubStations[0].y+60;}")
  page.keyboard.press('e')
  page.wait_for_timeout(600)
  run=page.evaluate("() => ({hub:hubActive,mode,rooms:rooms.length,floor:run.floor})")
  assert not run['hub'] and run['mode']=='playing' and run['rooms']>=10,run
  page.screenshot(path=str(ROOT/'artpass-dungeon-smoke.png'))
  page.evaluate("() => {const r=rooms.find(r=>r.kind==='battle');if(r){px=r.cx;py=r.cy;visitRoom(r);}}")
  page.wait_for_timeout(450)
  page.screenshot(path=str(ROOT/'artpass-combat-smoke.png'))
  assert not errors,'JS errors: '+str(errors)
  print('GAMEPLAY OK:',run,'PAGE ERRORS: 0',flush=True)
  b.close()
finally:srv.terminate()
