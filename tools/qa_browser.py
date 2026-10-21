"""Browser smoke test for entry movement, slash collision and rarity.
Run: python tools/qa_browser.py
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,base64
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1400,'height':850})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    html=(root/'dist/index.html').read_text(encoding='utf8')
    css=(root/'dist/style.css').read_text(encoding='utf8')
    js=(root/'dist/game.js').read_text(encoding='utf8')
    images={x.stem:'data:image/png;base64,'+base64.b64encode(x.read_bytes()).decode('ascii') for x in (root/'dist/assets').glob('*.png')}
    js=js.replace('a.src = `./assets/${id}.png`;', 'a.src = __imgmap[id];')
    assert 'a.src = __imgmap[id]' in js
    js='const __imgmap = '+json.dumps(images)+';\n'+js
    html=html.replace('<link rel="stylesheet" href="./style.css"/>','<style>'+css+'</style>')
    html=html.replace('<script defer src="./game.js"></script>','<script>'+js+'</script>')
    page.goto('about:blank');page.set_content(html,timeout=30000);page.wait_for_timeout(450)
    assert page.locator('#start').count()==1,'Main menu did not open'
    page.locator('#start').click();page.locator('[data-class="wanderer"]').click()
    page.wait_for_timeout(180)
    assert not page.locator('#hud').evaluate('(e)=>e.classList.contains("hidden")')
    test=page.evaluate('''() => {
       const player=()=>({x:px,y:py});
       const battle=rooms.find(r=>r.kind==='battle');
       if(!battle)throw Error('No combat room generated');
       px=battle.cx-5*T;py=battle.cy;
       current=rooms[0];
       updatePlayer(0.016);
       const activated=battle.active;
       const start=player();
       keys.add('d');updatePlayer(0.1);keys.delete('d');
       const after=player();
       // Verify unblocked movements along both axes after room entry.
       keys.add('s');updatePlayer(0.1);keys.delete('s');
       const after2=player();
       const slash={near:slashHits({x:0,y:0},{x:40,y:0},15,0,112,Math.PI*.76),outside:slashHits({x:0,y:0},{x:-70,y:0},10,0,112,Math.PI*.76)};
       return {activated,start,after,after2,slash,kind:battle.kind,combatLock:current?.active};
    }''')
    print('ENTRY_MOTION',json.dumps(test))
    assert test['activated'],'Combat did not trigger after moving into the body of room'
    assert test['after']['x']>test['start']['x']+5,'Cannot move right after entering combat room'
    assert test['after2']['y']>test['after']['y']+5,'Cannot move down after entering combat room'
    assert test['slash']=={'near':True,'outside':False}
    damage=page.evaluate('''() => {
       const room=rooms.find(r=>r.kind==='battle');
       mobs=[];px=room.cx;py=room.cy;current=room;
       const near=spawnMob('crawler',room,px+46,py+8);
       const behind=spawnMob('crawler',room,px-90,py);
       const nearStart=near.hp,backStart=behind.hp;
       swing(0,112,Math.PI*.76,29);
       return {nearBefore:nearStart,nearAfter:near.hp,behindBefore:backStart,behindAfter:behind.hp};
    }''')
    print('SWORD_DAMAGE',json.dumps(damage))
    assert damage['nearAfter']<damage['nearBefore'],'Enemy between player and max slash range not hit'
    assert damage['behindAfter']==damage['behindBefore'],'Enemy behind player should not be hit'
    page.evaluate('render()')
    page.screenshot(path=str(root/'qa-sword-sector.png'))
    levels=page.evaluate('''() => {
      const xp=xpRequirementFor;
      run=createRun('wanderer');
      mode='playing';
      gainXP(75);
      const early=run.level;
      gainXP(25);
      const firstLevel=run.level;
      mode='pause';
      gainXP(150);
      return {early,firstLevel,after250:run.level,required:[1,2,3,5].map(xp)};
    }''')
    print('XP_PACING',json.dumps(levels))
    assert levels['early']==1 and levels['firstLevel']==1 and levels['after250']==2, 'XP unexpectedly fast'
    # Generate many floors to sample actual rarity code, not just source text.
    result=page.evaluate('''() => {
      const counts={forge:0,treasure:0,heal:0,elite:0,battle:0,secret:0};
      const N=350;audioOn=false;
      for(let i=0;i<N;i++){
        generateFloor();
        for(const r of rooms){if(Object.hasOwn(counts,r.kind)) counts[r.kind]++;}
      }
      return {N,counts};
    }''')
    print('MAP_RARITY',json.dumps(result))
    assert result['counts']['forge']<result['N']*.25,'Forgeries too common'
    assert result['counts']['treasure']<result['N']*.40,'Treasure rooms too common'
    assert result['counts']['elite']>=result['N']*2,'Sigil elites missing'
    assert not errors,f'Errors in game JS: {errors[:3]}'
    page.screenshot(path=str(root/'qa-after-fix.png'))
    print('BROWSER_QA_PASSED',json.dumps({'errors':errors,'screenshots':['qa-after-fix.png']}))
    browser.close()
