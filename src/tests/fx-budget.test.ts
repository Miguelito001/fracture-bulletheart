import { describe,it,expect } from 'vitest';
import type {EffectEvent} from '../core/types';
import {limitCombatFx,MAX_FX_PER_FRAME,MAX_VISIBLE_FX} from '../render/fx-budget';

describe('Readable combat FX budgets',()=>{
  it('preserves important impacts but never floods the whole screen',()=>{
    const types: EffectEvent['type'][]=['damage','hit','death','swing','pickup','loot-beam','shrine'];
    const events:Array<EffectEvent>=Array.from({length:400},(_,i)=>({
      id:'stress:'+i,
      type:types[i%types.length]!,
      x:Math.cos(i)*4,
      y:Math.sin(i)*4,
      amount:17,
      heavy:true
    }));
    const shown=limitCombatFx(events,{x:0,y:0});
    expect(shown.length).toBeLessThanOrEqual(MAX_FX_PER_FRAME);
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.some(x=>x.type==='damage')).toBe(true);
    expect(shown.some(x=>x.type==='hit')).toBe(true);
    expect(MAX_VISIBLE_FX).toBeLessThanOrEqual(24);
  });
  it('ignores distant and repeated bursts, without changing combat damage state',()=>{
    const events:EffectEvent[]=Array.from({length:120},(_,i)=>({
      id:'fx-'+i,type:'hit',x:i<100?50:1,y:i<100?50:1,heavy:true
    }));
    const sourceLength=events.length;
    const shown=limitCombatFx(events,{x:0,y:0});
    expect(events).toHaveLength(sourceLength);
    expect(shown.length).toBeLessThan(3);
    expect(shown.every(x=>Math.hypot(x.x!,x.y!)<=12)).toBe(true);
  });
  it('does not drop nearby small damage numbers entirely',()=>{
    const shown=limitCombatFx([{id:'1',type:'damage',x:2,y:0,amount:31}],{x:0,y:0});
    expect(shown).toHaveLength(1);
    expect(shown[0]?.amount).toBe(31);
  });
});
