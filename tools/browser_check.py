from playwright.sync_api import sync_playwright
from pathlib import Path
import json,base64
root=Path('/mnt/data/FRACTURE_BULLETHEART/dist');html=(root/'index.html').read_text();css=(root/'style.css').read_text();js=(root/'game.js').read_text();assets={p.stem:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode() for p in (root/'assets').glob('*.png')};js=js.replace('a.src = `./assets/${id}.png`;', 'a.src = __imgmap[id];')
# Compilation sometimes retains no spaces
print('js replacement?', 'a.src = __imgmap[id]' in js)
js='const __imgmap = '+json.dumps(assets)+';\n'+js
html=html.replace('<link rel="stylesheet" href="./style.css"/>','<style>'+css+'</style>').replace('<script defer src="./game.js"></script>','<script>'+js+'</script>')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
 try:
  page.goto('about:blank');page.set_content(html,timeout=30000);page.wait_for_timeout(800)
  print('title',page.title(),'start',page.locator('#start').count());page.screenshot(path='/mnt/data/FRACTURE_BULLETHEART/preview-menu.png')
  page.click('#start');print('classes',page.locator('[data-class]').count());page.click('[data-class="bulwark"]');page.wait_for_timeout(650)
  print('hud',page.locator('#hud').get_attribute('class'),'weapons',page.locator('#weapon-name1').inner_text(),page.locator('#weapon-name2').inner_text())
  page.screenshot(path='/mnt/data/FRACTURE_BULLETHEART/preview-combat.png')
  page.keyboard.down('d');page.wait_for_timeout(1000);page.keyboard.up('d')
  page.mouse.move(950,500);page.mouse.down();page.wait_for_timeout(400);page.mouse.up();page.wait_for_timeout(400)
  print('hp',page.locator('#hp-text').inner_text());page.screenshot(path='/mnt/data/FRACTURE_BULLETHEART/preview-action.png')
  print('errors',errors[:10])
 except Exception as e:print('failed',repr(e),'errors',errors[:10])
 finally:browser.close()
