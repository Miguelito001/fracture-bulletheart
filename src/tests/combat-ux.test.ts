import { describe, expect, it } from "vitest";
import { TorchlineGame, calculatePlayerStats } from "../core/game";
import { RNG } from "../core/rng";
import type { MonsterState, StatBlock } from "../core/types";

describe("FRACTURE action combat controls", () => {
 it("SPACE dodge crosses real distance, respects obstacles and is cooldown limited", () => {
   const game=new TorchlineGame();
   game.setDirectInput(-1,-1);
   const start={x:game.state.player.x,y:game.state.player.y};
   game.dispatch({type:"dodge"});
   const player=game.state.player;
   const travelled=Math.hypot(player.x-start.x,player.y-start.y);
   expect(travelled).toBeGreaterThan(.25);
   expect(travelled).toBeLessThanOrEqual(1.71);
   expect(player.dodgeCooldownMs).toBe(1250);
   expect(player.dodgeInvulnMs).toBe(240);
   const previous={x:player.x,y:player.y};
   game.dispatch({type:"dodge"});
   expect(player.x).toBe(previous.x);
   expect(player.y).toBe(previous.y);
   game.setDirectInput(0,0);
 });
 it("brief dodge iframe prevents damage while keeping enemies lethal afterwards",()=>{
   const game=new TorchlineGame();
   game.setDirectInput(-1,-1);
   game.dispatch({type:"dodge"});
   expect(game.state.player.dodgeInvulnMs).toBeGreaterThan(0);
   const enemy=game.state.monsters[0] as MonsterState;
   expect(enemy).toBeTruthy();
   const hp=game.state.player.hp;
   const stats=calculatePlayerStats(game.state) as StatBlock;
   const internal=game as unknown as {monsterAttack:(enemy:MonsterState,stats:StatBlock,rng:RNG)=>void};
   internal.monsterAttack(enemy,stats,new RNG(777));
   expect(game.state.player.hp).toBe(hp);
   game.state.player.dodgeInvulnMs=0;
   internal.monsterAttack(enemy,stats,new RNG(777));
   expect(game.state.player.hp).toBeLessThan(hp);
 });
 it("an empty-range attack still swings the weapon, not a silent guard",()=>{
   const game=new TorchlineGame();
   game.state.monsters=[];
   game.dispatch({type:"basicAttack"});
   expect(game.state.player.animation).toBe("attack");
   expect(game.state.player.attackCooldownMs).toBeGreaterThan(0);
   expect(game.state.effects.some(e=>e.type==="swing")).toBe(true);
   expect(game.state.debug.lastCommand).toBe("sword sweep");
 });
});
