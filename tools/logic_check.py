from playwright.sync_api import sync_playwright
from pathlib import Path
import json,base64
root=Path('/mnt/data/FRACTURE_BULLETHEART/dist');h=(root/'index.html').read_text();css=(root/'style.css').read_text();js=(root/'game.js').read_text().replace('a.src = `./assets/${id}.png`;','a.src = __imgmap[id];');mp={p.stem:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode() for p in (root/'assets').glob('*.png')};js='const __imgmap='+json.dumps(mp)+';'+js;h=h.replace('<link rel="stylesheet" href="./style.css"/>','<style>'+css+'</style>').replace('<script defer src="./game.js"></script>','<script>'+js+'</script>')
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 pg=b.new_page(viewport={'width':1440,'height':900});errors=[];pg.on('pageerror',lambda e: errors.append(str(e)));pg.goto('about:blank');pg.set_content(h);pg.click('#start');pg.click('[data-class="wanderer"]');pg.wait_for_timeout(250)
 try:
  a=pg.evaluate('''() => ({rooms:rooms.length,edges:rooms.reduce((n,r)=>n+r.connections.length,0),floor:run.floor,playerOnFloor:floorAt(px,py),visible:rooms.filter(r=>r.seen).length,projectiles:shots.length})''');print('initial:',a)
  b1=pg.evaluate('''() => { for (const r of rooms){if(!floorAt(r.cx,r.cy))throw Error('room center unwalkable');} return rooms.map(r=>r.kind) }''');print('types:',{k:b1.count(k) for k in set(b1)})
  # Simulate XP pickup, verify level choice popup and keep progress
  c=pg.evaluate('''() => { gainXP(100);return {level:run.level, mode, cards:document.querySelectorAll('[data-choice]').length}; }''');print('gainXP:',c)
  pg.locator('[data-choice]').first.click();pg.wait_for_timeout(200)
  print('after choice:',pg.evaluate('''() => ({mode,level:run.level,damage:run.damage,room:current?.kind})'''))
  # Evaluate transition and combat room spawning (jump by debug to room center)
  d=pg.evaluate('''() => {const r=rooms.find(r=>r.kind==='battle');px=r.cx;py=r.cy;visitRoom(r);return {room:r.kind,enemies:mobs.length,active:r.active,mode};}''');print('battle:',d)
  # Drop all mobs and clear, then spawn boss when marks 2
  e=pg.evaluate('''() => {const r=current;mobs.filter(m=>!m.dead&&m.room===r.id).forEach(m=>{m.hp=1;kill(m)});run.sigils=2;const boss=rooms.find(r=>r.kind==='boss');px=boss.cx;py=boss.cy;visitRoom(boss);return {boss:boss.kind,active:boss.active,shield:bossCurrent?.shield,bossHp:bossCurrent?.hp,mode};}''');print('boss:',e)
  f=pg.evaluate('''() => {const boss=bossCurrent;const an=boss.anchors[0];damageAnchor(an.x,an.y,10,80);return {shield:boss.shield,anchors:boss.anchors.length}}''');print('anchor:',f)
 except Exception as e:print('FAILED:',repr(e))
 print('browser errors:',errors[:4]);b.close()
