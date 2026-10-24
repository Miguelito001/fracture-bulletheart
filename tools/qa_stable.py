"""Real Chromium gameplay check for the *published 1.3* FRACTURE core."""
import json
import threading
import functools
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
directory=root/"dist"
handler=functools.partial(SimpleHTTPRequestHandler,directory=str(directory))
server=ThreadingHTTPServer(("127.0.0.1",0),handler)
threading.Thread(target=server.serve_forever,daemon=True).start()

try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
        page=browser.new_page(viewport={"width":1280,"height":720},device_scale_factor=1)
        errors=[]
        page.on("pageerror",lambda error:errors.append(str(error)))
        page.goto(f"http://127.0.0.1:{server.server_port}/",wait_until="load")
        page.wait_for_function("typeof enterHub === 'function' && mode === 'hub'")
        start=page.evaluate("({x:px,y:py,mode,saveKey:KEY})")
        page.keyboard.down("d")
        page.wait_for_timeout(240)
        page.keyboard.up("d")
        after=page.evaluate("({x:px,y:py})")
        assert after["x"]>start["x"]+15,(start,after)
        assert start["saveKey"]=="fracture_bulletheart_v1"
        page.evaluate("begin('wanderer')")
        page.wait_for_function("mode==='playing' && rooms.length>4")
        result=page.evaluate("""() => {
          const room=rooms.find(r=>r.kind==='battle');
          if(!room)throw Error('missing battle room');
          mobs=[]; px=room.cx;py=room.cy; current=room;
          const target=spawnMob('crawler',room,px+50,py);
          const before=target.hp;
          attackCD=0;
          shootWeapon('sword',0);
          const feedback=particles.filter(p=>p.kind==='ring'||/^\\d+!?$/.test(p.kind));
          const sword={before,after:target.hp,feedback:feedback.map(p=>p.kind),
                       action:weaponMotion.time,weapon:weaponMotion.kind};
          updatePlayer(.05);
          const progressed=weaponMotion.time;
          return {sword,progressed,runSlot:run.slot};
        }""")
        assert result["sword"]["after"]<result["sword"]["before"],result
        assert result["sword"]["action"]>result["progressed"]>=0,result
        assert "ring" in result["sword"]["feedback"],result
        assert any(k.strip("!").isdigit() for k in result["sword"]["feedback"]),result
        page.locator("#weapon2").click()
        switched=page.evaluate("({slot:run.slot,weapon:run.weapons[run.slot]})")
        assert switched=={"slot":1,"weapon":"gun"},switched
        page.evaluate("render()")
        path=root/"qa-stable-gameplay.png"
        page.screenshot(path=str(path))
        assert not errors,errors
        print("STABLE_1_3_BROWSER_QA",json.dumps({"hubMovement":[start,after],"combat":result,"switched":switched,"screenshots":[str(path.name)]}))
        browser.close()
finally:
    server.shutdown()
