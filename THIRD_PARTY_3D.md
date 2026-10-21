# FRACTURE — verified reusable components (3D rebuild)

This branch replaces the ad-hoc Canvas 2D isometric renderer with mature, independently maintained components.

- Three.js (MIT): actual 3D scene graph, real depth testing, GLTFLoader, lights, orthographic camera. https://github.com/mrdoob/three.js
- Rapier JS (Apache-2.0): actual collision solver and kinematic character controller (including walls and props). https://github.com/dimforge/rapier
- EasyStar.js (MIT): grid-based A* pathfinding for room encounters. https://github.com/prettymuchbryce/easystarjs
- Vite (MIT): production bundling and local development. https://vite.dev/
- Kenney Mini Dungeon, Graveyard Kit and Castle Kit (CC0 1.0): environment models, props, player/orc, gear. Original creator https://kenney.nl/; packaged as standalone .glb by https://github.com/Hidencod/tge-assets (also CC0), source commit `4920991271cb3079006478ff77b851e1d04342b3`. 47 GLB models acquired reproducibly at build via `scripts/get-cc0-models.mjs`.

No Microsoft/Minecraft game files or proprietary assets are included. Imported .glb models are public-domain. Dependencies and licenses are retained in their npm packages.

The `fracture_bulletheart_v1` save is **read**, not overwritten. This vertical slice migrates echoes, extractions, runs and unlocks. Per-run saves and full endgame systems are not claimed to be migrated yet.