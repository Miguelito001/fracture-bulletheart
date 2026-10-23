import type { EffectEvent, Point } from "../core/types";

// The combat layer is not allowed to hide the fight. Damage remains authoritative
// in the game simulation; only redundant cosmetic events are discarded.
const PER_FRAME: Readonly<Record<string,number>> = {
  telegraph: 4, damage: 7, hit: 4, death: 3, swing: 2, dodge: 1,
  "loot-beam": 2, pickup: 2, shrine: 1, door: 1
};
export const MAX_VISIBLE_FX = 24;
export const MAX_FX_PER_FRAME = 12;
const IMPORTANT = ["telegraph","damage","hit","swing","dodge","death","shrine","door","pickup","loot-beam"];

export function limitCombatFx(events: readonly EffectEvent[], player: Point): EffectEvent[] {
  const counts = new Map<string,number>(), seen = new Set<string>();
  const result: EffectEvent[] = [];
  // Prioritize visible hit confirmation over loot bursts and lingering glows.
  const sorted = [...events].sort((a,b)=>IMPORTANT.indexOf(a.type)-IMPORTANT.indexOf(b.type));
  for (const event of sorted) {
    if (result.length>=MAX_FX_PER_FRAME) break;
    if (event.x===undefined||event.y===undefined) continue;
    if (Math.hypot(event.x-player.x,event.y-player.y)>12) continue;
    const type = event.type;
    const budget=PER_FRAME[type]??0;
    const count=counts.get(type)??0;
    if (!budget||count>=budget) continue;
    const cellX=Math.floor(event.x*1.25),cellY=Math.floor(event.y*1.25);
    // AOE hits can cause 10+ events in the same spot, producing an opaque blob.
    // Keep one flash for each nearby spot, but preserve up to two damage numbers.
    const slot=(type==="damage")?Math.min(2,count):0;
    const dedupe=type+":"+cellX+":"+cellY+":"+slot;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    counts.set(type,count+1);
    result.push(event);
  }
  return result;
}
