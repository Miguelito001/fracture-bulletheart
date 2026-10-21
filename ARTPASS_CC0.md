# FRACTURE Isometric – Kenney CC0 Art Pass

Source artworks, **not AI-generated placeholders**, downloaded from their original creator Kenney via a pinned public asset mirror:
- **Kenney Isometric Miniature Dungeon**, https://kenney.nl/assets/isometric-miniature-dungeon
- **Kenney Isometric Miniature Library**, https://kenney.nl/assets/isometric-miniature-library
- Mirror: https://github.com/GeorgeQLe/assets-2d-isometric , pinned to commit `0d66f7aebf6faf651ab680c9b83b2d8a40e666a1`.
- License: **Creative Commons Zero 1.0 Universal (CC0-1.0)**. https://creativecommons.org/publicdomain/zero/1.0/

`tools/import_kenney_cc0.py` fetches 48 named PNG files from this source and optimizes copies for the browser, preserving the 256×512 registration and transparency. Images are checked into `assets/kenney/` alongside `manifest.json` containing the original source URL and SHA-256 per asset. The running game makes **no external image requests**.

Kenney is credited voluntarily. Sprite composition, effects and other original FRACTURE code are separate from the Kenney source art. Original 2D character sprites are still used while isometric character animation work is underway; this art pass focuses on physically authored environment assets. No material from Minecraft Dungeons is present in the project.

The playable ISOV2 preview stays on its feature branch, separate from the established `main` release.
