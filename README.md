# FRACTURE: BULLETHEART — CRYPTFIRE

A **playable open-source-based action RPG** for the browser. Rebuilt with the tested MIT-licensed Dungeon Torch Crawler game instead of the prior experimental 3D engine.

Gothic dungeon with an authored architectural layout, mouse pathfinding, WASD secondary movement, hit feedback, real-time enemy combat, animations in eight directions, equipment, inventory, loot, shrines, upgrades, local sound, floors and local saves.

**Controls:** Click ground to move; click an enemy to attack; Shift attack; Space special; Q potion; E stairs; F shrine; I inventory; P/Escape pause; R restart. WASD/arrow keys for alternate movement.

**Run:** `npm install && npm run dev`

**Test:** `npm test && npm run typecheck && npm run build`; browser `npm run test:browser` after installing Playwright Chromium. Source assets are pinned/downloaded during build.

Licensed game foundation / asset attribution: [THIRD_PARTY_FOUNDATION.md](THIRD_PARTY_FOUNDATION.md), [FOUNDATION_LICENSE.md](FOUNDATION_LICENSE.md).

This branch deliberately replaces the old experimental game with a complete, authored vertical slice. It does not claim that all mechanics from the previous FRACTURE version are implemented.
