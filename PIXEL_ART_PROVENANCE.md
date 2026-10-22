# FRACTURE — Pixel Art Provenance

The visual rebuild uses **DungeonTileset II v1.7** by 0x72, under **Creative Commons Zero (CC0-1.0)**. Original author/license: https://0x72.itch.io/dungeontileset-ii. Sprite PNGs are pulled from the publicly available GitHub mirror of that same pack at https://github.com/marceloferreira357/bun-crawler-client (mirror commit 2a00fd56341cb2278bc66350d5f71f4abfadef32), verified by expected byte length and PNG signature. All selected art is downloaded at build time and bundled in `public/pixel`; the game makes no GitHub requests during play.

We do **not** mix 2D pixellated 0x72 monsters with detailed 3D renderings. Code-derived gameplay and sound from the MIT-licensed Dungeon Torch Crawler remain attributed in `THIRD_PARTY_FOUNDATION.md`. The former 3D renderer is retained in source history, but no longer runs on this branch. The stable `main` is unchanged.
