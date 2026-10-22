import type { GameAction } from "../core/types";

type KeyboardPlayer = { x: number; y: number; };
export type MovementController = { tick: (now: number) => void; isMoving: () => boolean; dispose: () => void; };
const bindings: Record<string, [number, number]> = {
  w: [-1, -1], arrowup: [-1, -1],
  s: [1, 1], arrowdown: [1, 1],
  a: [-1, 1], arrowleft: [-1, 1],
  d: [1, -1], arrowright: [1, -1]
};
// Perspective-locked controls: W moves visibly UP, D moves RIGHT.
// Original Dungeon Torch Crawler used a single 1.35-unit move on keyDown;
// OS key-repeat created choppy, unpredictable movement.
export function movementVector(keys: ReadonlySet<string>): { x: number; y: number } {
  let x = 0, y = 0;
  for (const key of keys) {
    const pair = bindings[key];
    if (!pair) continue;
    x += pair[0];
    y += pair[1];
  }
  const length = Math.hypot(x, y);
  return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}
export function bindKeyboard(
  dispatch: (action: GameAction) => void,
  getPlayer?: () => KeyboardPlayer,
  canMove: () => boolean = () => true
): MovementController {
  const keys = new Set<string>();
  let lastCommand = -1000;
  const focusedInput = () => /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
  const keydown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (focusedInput() || event.ctrlKey || event.metaKey || event.altKey) return;
    if (bindings[key]) {
      event.preventDefault();
      keys.add(key);
      return;
    }
    // Browser auto-repeat must never trigger five attacks per held key.
    if (event.repeat) return;
    if (key === " ") { event.preventDefault(); dispatch({ type: "useAbility" }); }
    else if (key === "e") dispatch({ type: "useStairs" });
    else if (key === "f") dispatch({ type: "activateShrine" });
    else if (key === "q") dispatch({ type: "drinkPotion" });
    else if (key === "shift") { event.preventDefault(); dispatch({ type: "basicAttack" }); }
    else if (key === "p" || key === "escape") dispatch({ type: "pause" });
    else if (key === "`" || key === "~") dispatch({ type: "toggleDebug" });
    else if (key === "r") dispatch({ type: "restart" });
    else if (["1","2","3"].includes(key)) dispatch({ type: "chooseSkill", index: Number(key) - 1 });
  };
  const keyup = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    keys.delete(key);
    if (bindings[key] && !movementVector(keys).x && !movementVector(keys).y && getPlayer && canMove()) {
      const p = getPlayer();
      dispatch({ type: "moveTo", x: p.x, y: p.y });
    }
  };
  const blur = () => keys.clear();
  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
  window.addEventListener("blur", blur);
  return {
    tick(now: number) {
      if (!canMove()) return;
      const vector = movementVector(keys);
      if (!vector.x && !vector.y) return;
      if (now - lastCommand < 110) return;
      lastCommand = now;
      const player = getPlayer?.();
      if (player) {
        dispatch({ type: "moveTo", x: player.x + vector.x * 2.25, y: player.y + vector.y * 2.25 });
      } else {
        dispatch({ type: "move", dx: vector.x, dy: vector.y });
      }
    },
    isMoving: () => keys.size > 0,
    dispose() {
      keys.clear();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
    }
  };
}
