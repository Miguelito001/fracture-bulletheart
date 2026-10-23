import { describe, expect, it } from "vitest";
import { stepVelocity } from "../core/last-stand-movement";
import { TorchlineGame } from "../core/game";
import type { MonsterState } from "../core/types";

describe("MIT Last Stand movement integrated into Torch Crawler", () => {
  it("accelerates within PUSH limits and brakes faster than it starts", () => {
    const velocity = {x:0,z:0};
    const desired = {x:4,z:0};
    stepVelocity(velocity, desired, 1/60);
    expect(velocity.x).toBeGreaterThan(0);
    expect(velocity.x).toBeLessThanOrEqual(14/60+0.001);
    for(let i=0;i<32;i++)stepVelocity(velocity,desired,1/60);
    expect(velocity.x).toBeGreaterThan(3.4);
    let stop=0;
    while(velocity.x>0.1&&stop<50){stepVelocity(velocity,{x:0,z:0},1/60);stop++;}
    expect(stop).toBeLessThan(30);
  });
  it("keeps movement approximately timestep-independent", () => {
    const v60={x:0,z:0},v120={x:0,z:0};
    for(let i=0;i<60;i++)stepVelocity(v60,{x:3,z:2},1/60);
    for(let i=0;i<120;i++)stepVelocity(v120,{x:3,z:2},1/120);
    expect(Math.hypot(v60.x-v120.x,v60.z-v120.z)).toBeLessThan(0.09);
  });
});
describe("Last Stand-style committed attacks in the dungeon",()=>{
  function armedFoe(game:TorchlineGame):MonsterState{
    const p=game.state.player;
    return {
      id:"telegraph-foe",kind:"bone-warden",name:"Bone Warden",x:p.x+0.7,y:p.y,
      hp:30,maxHp:30,attack:8,defense:0,xp:0,color:"#ffffff",
      role:"melee",cooldown:0,attackCooldownMs:0,aggroRadius:6,
      animation:"idle",hitFlashMs:0,animationLockMs:0,aiState:"chase"
    };
  }
  it("shows danger before actually damaging the player",()=>{
    const game=new TorchlineGame(522551);
    game.state.turn=1;
    game.state.monsters=[armedFoe(game)];
    game.drainEffects();
    const before=game.state.player.hp;
    game.tickFrame(16.67);
    const events=game.drainEffects();
    expect(events.some(e=>e.type==="telegraph")).toBe(true);
    expect(game.state.player.hp).toBe(before);
  });
  it("lets a player dodge the previously marked area",()=>{
    const game=new TorchlineGame(522551);
    game.state.turn=1;
    game.state.monsters=[armedFoe(game)];
    game.drainEffects();
    game.tickFrame(50);
    const before=game.state.player.hp;
    game.state.player.x+=2;
    for(let i=0;i<11;i++)game.tickFrame(50);
    expect(game.state.player.hp).toBe(before);
  });
});
