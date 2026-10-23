# FRACTURE: BULLETHEART — open-source foundation

The rebuild on this branch is derived from **Dungeon Torch Crawler** © 2026 Dungeon Torch Crawler contributors. MIT License. Source: https://github.com/cedrickchee/torchline-dungeon, pinned at `cf050b9ef0cfa4ebd5015574c19f179b47bffee1`.

**Actual transferred systems:** browser renderer (Three.js, authored 2.5D stone architecture), 8-direction actor sprite atlases and animations, dungeon simulation, monster AI, hit effects, target and click-to-move input, collision/navigation, loot, equipment/inventory, shrine and skills, fog-of-war, local sound, local storage save/load, and regression tests. MIT notice preserved in `FOUNDATION_LICENSE.md`.

**Art and sound:** 24 atlas PNG and 20 OGG files from the same MIT-licensed upstream revision are copied into the build using `scripts/fetch-source-assets.mjs`; they are hosted locally in the built website and are not loaded from GitHub during play.

The game is an adapted open-source foundation; it is not affiliated with the source author. Earlier FRACTURE gameplay is available unchanged on earlier branches. The stable `main` is untouched.

## Second source: Last Stand (MIT)

The ground locomotion controller in `src/core/last-stand-movement.ts` was sourced directly from [Last Stand](https://github.com/VictorZakharov/last-stand/blob/main/src/entities/movement.ts), including its velocity easing, PUSH acceleration and BRAKE deceleration limits. FRACTURE maps its world-space `z` to its dungeon's `y` coordinate. The distinction between marked windups and impact timing in our enemy combat is adapted from Last Stand's `src/entities/enemyAI.ts` telegraph/event architecture, integrated with Dungeon Torch Crawler's collision, dodge and sprite rendering. The MIT notice is retained in `LAST_STAND_LICENSE.md`.
