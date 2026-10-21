# FRACTURE: BULLETHEART — ISOV2 Vertical Slice

A new playable isometric renderer on top of FRACTURE 1.3 combat and progression, not the final art.

## What's new

- 2.5D isometric presentation, textured diamond floor and raised architectural walls.
- Physical Anchor Chamber with distinctive portal, smithy, merchant stall, archive, vault and altar.
- Camera projection with inverse pointer aiming; WASD follows screen direction.
- Same damage, weapons, boss AI, health, dodge timing and loot as 1.3.
- Persistent expedition checkpoint and physical/scroll extraction continue to work.

## Scope

This is the first interactive technical/art prototype. Full authored modular rooms, new sprites, enemy animations and professional asset pipeline are **not** completed. Original 1.3 remains on the main branch.

## Local

`npm install && npm run build && npm test`, open dist/index.html.

Playtest: W+D from spawn to portal, E to start and E at Nó Zero to extract.

## Technical decisions

The actual engine is TypeScript + Canvas 2D (no Phaser). Existing 2D hitboxes continue unchanged. All entity sprites and telegraphs are independently projected, rather than skewing the canvas globally.