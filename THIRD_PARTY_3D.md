# FRACTURE — verified reusable components (3D rebuild)

This branch replaces the ad-hoc Canvas 2D isometric renderer with mature, independently maintained components.

- Three.js (MIT): actual 3D scene graph, real depth testing, GLTFLoader, lights, orthographic camera. https://github.com/mrdoob/three.js
- Rapier JS (Apache-2.0): actual collision solver and kinematic character controller (including walls and props). https://github.com/dimforge/rapier
- EasyStar.js (MIT): grid-based A* pathfinding for room encounters. https://github.com/prettymuchbryce/easystarjs
- Vite (MIT): production bundling and local development. https://vite.dev/
- Kenney Mini Dungeon, Graveyard Kit and Castle Kit (CC0 1.0): environment models, props, player/orc, gear. Original creator https://kenney.nl/; packaged as standalone .glb by https://github.com/Hidencod/tge-assets (also CC0), source commit `4920991271cb3079006478ff77b851e1d04342b3`. 47 Kenney GLB models acquired reproducibly at build via `scripts/get-cc0-models.mjs`.

No Microsoft/Minecraft game files or proprietary assets are included. Imported .glb models are public-domain. Dependencies and licenses are retained in their npm packages.

The `fracture_bulletheart_v1` save is **read**, not overwritten. This vertical slice migrates echoes, extractions, runs and unlocks. Per-run saves and full endgame systems are not claimed to be migrated yet.
- KayKit Adventurers 1.0 (Knight, Hooded Rogue), CC0: https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 at `672074b73ba276876a19e8816ecdc5241817ab47`.
- KayKit Skeletons 1.0 (Skeleton Warrior), CC0: https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0 at `15b62b9bad122f72926c10fb14d622c73819fa54`.
These public fully rigged GLBs contain real authored clips activated by Three.js AnimationMixer.

- KayKit Dungeon Remastered 1.0 (14 3D floor, wall, column, furniture, torch, banner and doorway models), CC0 1.0: https://github.com/KayKit-Game-Assets/KayKit-Dungeon-Remastered-1.0 pinned to `b0ca9bd96a8072ab36a3a5464f00ed1e06a16d07`. Original modular geometry is scaled and reused with physical Rapier colliders.
