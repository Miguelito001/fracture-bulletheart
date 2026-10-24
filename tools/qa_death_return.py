"""Real browser regression: death -> return -> move -> portal -> die again.
Run from project root after npm run build. Uses isolated temporary browser profile.
"""
from pathlib import Path
import json, functools, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
server=ThreadingHTTPServer(("127.0.0.1",0),functools.partial(SimpleHTTPRequestHandler,directory=str(root/"dist")))
threading.Thread(target=server.serve_forever,daemon=True).start()
def snapshot(page):
    return page.evaluate("""() => ({mode,hubActive,hp:run?.hp,position:[px,py],walkable:walkable(px,py,16),
      tile:tile(px,py),worldCells:world.size,blockCount:blocked.size,monsters:mobs.length,
      modal:!!document.querySelector('#overlay .modal'),
      hudHidden:document.querySelector('#hud').classList.contains('hidden'),
      hubHidden:document.querySelector('#hub-status').classList.contains('hidden'),
      lastSave:localStorage.getItem(KEY)?JSON.parse(localStorage.getItem(KEY)).runs:null
    })""")
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
  page=browser.new_page(viewport={"width":1280,"height":720},device_scale_factor=1)
  errors=[]
  page.on("pageerror",lambda e:errors.append(str(e)))
  page.goto(f"http://127.0.0.1:{server.server_port}/",wait_until="load")
  page.wait_for_function("typeof enterHub==='function' && mode==='hub'")
  initial=snapshot(page)
  assert initial["walkable"] and initial["hubActive"],initial
  for attempt in range(2):
   # Enter through the real hub portal interaction.
   page.evaluate("""() => {px=HUB.x;py=HUB.y-205;interactHub();}""")
   page.wait_for_function("mode==='playing' && !hubActive")
   running=snapshot(page)
   assert running["walkable"],running
   # Force the same actual death handler used by enemy attacks, not UI fakery.
   page.evaluate("""() => {hitInvuln=0;dashTime=0;damagePlayer(999999);}""")
   page.wait_for_selector("#home-close",state="visible")
   defeat=snapshot(page)
   assert defeat["mode"]=="choice" and defeat["hubActive"],defeat
   assert defeat["modal"] and defeat["walkable"],defeat
   page.locator("#home-close").click()
   page.wait_for_function("mode==='hub' && hubActive && !document.querySelector('#overlay .modal')")
   returned=snapshot(page)
   assert returned["walkable"] and not returned["monsters"],returned
   assert not returned["hubHidden"] and returned["hudHidden"],returned
   page.keyboard.down("d")
   page.wait_for_timeout(400)
   page.keyboard.up("d")
   after=snapshot(page)
   assert after["position"][0]>returned["position"][0]+30,(attempt,returned,after)
   assert after["walkable"],after
   page.keyboard.down("w")
   page.wait_for_timeout(220)
   page.keyboard.up("w")
   diagonal=snapshot(page)
   assert diagonal["position"][1]<after["position"][1]-15,(attempt,after,diagonal)
   assert diagonal["walkable"],diagonal
   # Ensure pause and resume don't strand the player in an overlay.
   page.keyboard.press("Escape")
   page.wait_for_function("mode==='pause'")
   page.locator("#resume-hub").click()
   page.wait_for_function("mode==='hub'")
   resumed=snapshot(page)
   assert resumed["walkable"] and not resumed["modal"],resumed
   print("DEATH_RETURN_QA",json.dumps(dict(attempt=attempt+1,starting=running,
        defeat=defeat,returnState=returned,moved=after,resumed=resumed),ensure_ascii=False))
  # Extraction must use the same reliable return path.
  page.evaluate("""() => {px=HUB.x;py=HUB.y-205;interactHub();run.scrolls=1;settleExpedition('extraction');}""")
  page.wait_for_selector("#home-close",state="visible")
  page.locator("#home-close").click()
  page.wait_for_function("mode==='hub' && hubActive")
  assert snapshot(page)["walkable"]
  # Saving permanent echoes and unlocks after death.
  persisted=page.evaluate("""() => JSON.parse(localStorage.getItem(KEY))""")
  assert persisted["runs"]>=2,persisted
  page.screenshot(path=str(root/"qa-anchor-death-return.png"),full_page=True)
  assert not errors,errors
  print("ANCHOR_RETURN_REAL_BROWSER_PASS",json.dumps({"runs":persisted["runs"],"screenshots":["qa-anchor-death-return.png"],"errors":errors}))
  browser.close()
finally:
 server.shutdown()
