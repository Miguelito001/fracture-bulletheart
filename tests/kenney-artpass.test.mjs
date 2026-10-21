import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {test} from 'node:test';
const source=readFileSync('src/main.ts','utf8');
const importer=readFileSync('tools/import_kenney_cc0.py','utf8');
test('real Kenney CC0 tile pack integrated into renderer',()=>{assert.match(source,/function kenney\(/);assert.match(source,/stoneTile_S/);assert.match(source,/stoneWall_S/);assert.match(source,/bookcaseWideBooks_S/);assert.match(source,/chestClosed_S/);assert.match(source,/kenney\('stoneWallArchway_S'/);});
test('asset importer uses a pinned source and fails hard on unavailable downloads',()=>{assert.match(importer,/SOURCE_COMMIT = '[a-f0-9]{40}'/);assert.match(importer,/CC0/);assert.match(importer,/urlopen\(/);assert.match(importer,/raise RuntimeError/);});
test('imported source files are bundled as real PNGs (not remote placeholders)',()=>{
 const manifestPath='assets/kenney/manifest.json';
 if(!existsSync(manifestPath))return; // The local dev tree may not have downloaded assets yet; CI must.
 const m=JSON.parse(readFileSync(manifestPath,'utf8'));assert.equal(m.license,'CC0-1.0');assert.ok(m.assets.length>=45);
 for(const x of m.assets){const f='assets/kenney/'+x.output;assert.ok(existsSync(f),'Missing '+f);const bytes=readFileSync(f);assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a',f);}
});
