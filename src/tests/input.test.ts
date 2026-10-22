import { describe, expect, it } from "vitest";
import { movementVector } from "../input/input";
import { TorchlineGame } from "../core/game";
describe("FRACTURE playable controls", () => {
 it("W is screen-up, D is screen-right, and diagonals have normalized speed", () => {
  const w=movementVector(new Set(["w"])),d=movementVector(new Set(["d"]));
  expect(w.x).toBeLessThan(0);expect(w.y).toBeLessThan(0);
  expect(d.x).toBeGreaterThan(0);expect(d.y).toBeLessThan(0);
  expect(Math.hypot(w.x,w.y)).toBeCloseTo(1,6);
  expect(Math.abs(w.x*d.x+w.y*d.y)).toBeLessThan(0.001);
  const wd=movementVector(new Set(["w","d"]));
  expect(Math.hypot(wd.x,wd.y)).toBeCloseTo(1,6);
  expect(wd.y).toBeLessThan(-0.99);
 });
 it("collision-aware held movement actually changes the player position and stops on release", () => {
  const game=new TorchlineGame();
  const start={x:game.state.player.x,y:game.state.player.y};
  let progressed=false;
  for(const [dx,dy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
   game.setDirectInput(dx,dy);
   for(let frame=0;frame<4;frame++) game.tickFrame(40);
   if(Math.hypot(game.state.player.x-start.x,game.state.player.y-start.y)>.1){progressed=true;break;}
  }
  expect(progressed).toBe(true);
  game.setDirectInput(0,0);
  const stopped={x:game.state.player.x,y:game.state.player.y};
  for(let frame=0;frame<4;frame++)game.tickFrame(40);
  expect(Math.hypot(game.state.player.x-stopped.x,game.state.player.y-stopped.y)).toBeLessThan(.001);
 });
});
