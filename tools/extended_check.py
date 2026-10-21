from playwright.sync_api import sync_playwright
from pathlib import Path
import json,base64
root=Path('/mnt/data/FRACTURE_BULLETHEART/dist');h=(root/'index.html').read_text();css=(root/'style.css').read_text();js=(root/'game.js').read_text().replace('a.src = `./assets/${id}.png`;','a.src = __imgmap[id];');mp={p.stem:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode() for p in (root/'assets').glob('*.png')};js='const __imgmap='+json.dumps(mp)+';'+js;h=h.replace('<link rel="stylesheet" href="./style.css"/>','<style>'+css+'</style>').replace('<script defer src="./game.js"></script>','<script>'+js+'</script>')
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox']);pg=b.new_page(viewport={'width':1440,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.goto('about:blank');pg.set_content(h)
 pg.click('#start');pg.click('[data-class="wanderer"]');pg.wait_for_timeout(150)
 x=pg.evaluate('''() => {let errors=[];let sizes=[];for(let i=0;i<100;i++){run.floor=i%5+1;generateFloor();sizes.push(rooms.length);if(rooms.filter(r=>r.kind==='elite').length<2)errors.push('elites');if(!rooms.find(r=>r.kind==='boss'))errors.push('boss');for(const r of rooms){if(!walkable(r.cx,r.cy,16))errors.push('center');for(const id of r.connections){const o=rooms[id];const delta=vec(Math.atan2(o.cy-r.cy,o.cx-r.cx),36);let a={x:r.cx,y:r.cy};while(distance(a,o)>55){if(!walkable(a.x,a.y,15)){errors.push('corridor');break;}a.x+=delta.x;a.y+=delta.y;if(distance(a,o)<36)break;}}}}return {maps:100,minRooms:Math.min(...sizes),maxRooms:Math.max(...sizes),errors:errors.slice(0,8),errorsCount:errors.length};}''')
 print('Generation:',x)
 pg.evaluate('''() => {run.floor=2;generateFloor();const r=rooms.find(r=>r.kind==='elite');px=r.cx;py=r.cy;camera.x=px-640;camera.y=py-360;visitRoom(r);showLocation('SALÃO DO CARRASCO');}''');pg.wait_for_timeout(450);pg.screenshot(path='/mnt/data/FRACTURE_BULLETHEART/preview-fight.png')
 info=pg.evaluate('''() => ({mobs:mobs.filter(x=>!x.dead).length,room:current?.kind,tiles:world.size,mode,weapon:run.weapons[run.slot]})''');print('Fight:',info)
 pg.evaluate('''() => {const m=mobs.find(m=>!m.dead);hurt(m,200,'hammer');run.sigils=2;const r=rooms.find(r=>r.kind==='boss');px=r.cx;py=r.cy;camera.x=px-640;camera.y=py-360;visitRoom(r);}''');pg.wait_for_timeout(300);pg.screenshot(path='/mnt/data/FRACTURE_BULLETHEART/preview-boss.png')
 print('Boss:',pg.evaluate('''() => ({shield:bossCurrent?.shield,maxHp:bossCurrent?.max,alive:mobs.filter(x=>!x.dead).length})'''))
 # Test boss phase progression end
 stage=pg.evaluate('''() => {const b=bossCurrent;damageAnchor(b.anchors[0].x,b.anchors[0].y,3,50);damageAnchor(b.anchors[0].x,b.anchors[0].y,3,50);hurt(b,500000);return {phase:b.phase,hp:b.hp,shield:b.shield,alive:!b.dead};}''');print('phase gate:',stage)
 # Empty quest? level reward modal
 print('errors:',errs[:4]);b.close()
