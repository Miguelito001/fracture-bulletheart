# FRACTURE Isometric – Kenney CC0 Art Pass

Source artworks, **not AI-generated placeholders**, downloaded from their original creator Kenney via a pinned public asset mirror:
- **Kenney Isometric Miniature Dungeon**, https://kenney.nl/assets/isometric-miniature-dungeon
- **Kenney Isometric Miniature Library**, https://kenney.nl/assets/isometric-miniature-library
- Mirror: https://github.com/GeorgeQLe/assets-2d-isometric , pinned to commit `0d66f7aebf6faf651ab680c9b83b2d8a40e666a1`.
- License: **Creative Commons Zero 1.0 Universal (CC0-1.0)**. https://creativecommons.org/publicdomain/zero/1.0/

`tools/import_kenney_cc0.py` fetches 48 named PNG files from this source and optimizes copies for the browser, preserving the 256×512 registration and transparency. Images are checked into `assets/kenney/` alongside `manifest.json` containing the original source URL and SHA-256 per asset. The running game makes **no external image requests**.

Kenney is credited voluntarily. Sprite composition, effects and other original FRACTURE code are separate from the Kenney source art. The player, hub humans and humanoid rivals now also use **Kenney Dungeon Pack 2.3 eight-direction characters** (48 idle/run PNG frames); nonhumanoid enemies and bosses still retain the original FRACTURE sprites. No material from Minecraft Dungeons is present in the project.

The playable ISOV2 preview stays on its feature branch, separate from the established `main` release.


### Character art source

**Kenney Dungeon Pack 2.3** — 48 eight-direction character idle/run frames, CC0-1.0. Original files: `kenneyDungeonPack_2.3/Characters/Male/` in https://github.com/ETdoFresh/kenney.nl, pinned to commit `45df48c4d45f8716216b1a9e22df0b69cd9f5932`. The original `License.txt` explicitly grants CC0. Every bundled frame has provenance and SHA-256 in `assets/kenney/characters/manifest.json`.
