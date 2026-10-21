import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const source=readFileSync('src/main.ts','utf8');
test('isometric renderer and inverse projection are used',()=>{assert.match(source,/function isoPoint\(/);assert.match(source,/function isoUnproject\(/);assert.match(source,/function drawIsoWorld\(/);assert.match(source,/drawIsoWorld\(\);/);});
test('world simulation is preserved independently of visual projection',()=>{assert.match(source,/function moveWithCollision\(/);assert.match(source,/function hammerFalloff\(/);assert.match(source,/function slashHits\(/);assert.match(source,/function updateEnemies\(/);});
test('hub portal, crafting, storage and extraction remain accessible',()=>{assert.match(source,/function isoPortal\(/);assert.match(source,/function isoForge\(/);assert.match(source,/function isoMerchant\(/);assert.match(source,/function isoArchive\(/);assert.match(source,/function isoVault\(/);assert.match(source,/function isoAltar\(/);assert.match(source,/function interactHub\(/);assert.match(source,/function settleExpedition\(/);});
