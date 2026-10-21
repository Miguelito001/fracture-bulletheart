// Hand-authored room layouts. These are architectural layouts, not a procedural
// scattering algorithm. Symbols: # stone wall, . walkable, capital letters are
// functional nodes, lowercase letters are physical environmental props.
// Four centre-aligned north/east/south/west door sockets are standardized.
export const WIDTH=19, HEIGHT=13, TILE=2.35;
const blueprint=(id,name,theme,raw)=>{
  const rows=raw.trim().split('\n').map(s=>s.trim());
  if(rows.length!==HEIGHT||rows.some(row=>row.length!==WIDTH))throw Error(`Invalid blueprint ${id}: ${rows.map(r=>r.length)}`);
  return Object.freeze({id,name,theme,rows:Object.freeze(rows)});
};
export const HUB=blueprint('anchor','CÂMARA ÂNCORA','sanctuary',`
###################
#......#...#......#
#..f...#...#..m...#
#......#...#......#
#.................#
....t.........t....
.........P.........
....t.........t....
#.................#
#..a...#...#..c...#
#......#...#......#
#..b...#...#..s...#
###################
`);
export const ROOMS=Object.freeze([
 blueprint('crypt','CRIPTA DAS CINZAS','crypt',`
###################
#....c.....#......#
#..........#..b...#
#.................#
#.....t...........#
......#.......#....
.........A.........
......#.......#....
#.....t...........#
#.................#
#..........#..c...#
#....b.....#......#
###################
`),
 blueprint('chapel','CAPELA DAS CINZAS','chapel',`
###################
#..b....###....b..#
#.......#A#.......#
#.......#.#.......#
#.................#
....c.......c......
.........A.........
....c.......c......
#.................#
#....t.......t....#
#.................#
#..b...........b..#
###################
`),
 blueprint('guard','POSTO DOS VIGIAS','guard',`
###################
#....#.........#..#
#....#..t......#..#
#....#.........#..#
#.................#
.......c.....c.....
.........A.........
.......c.....c.....
#.................#
#..t..........t...#
#..##.........##..#
#..b...........b..#
###################
`),
 blueprint('library','ARQUIVO SEPULTADO','archive',`
###################
#bb...#....#...bb.#
#bb...#....#...bb.#
#.....#....#......#
#.................#
.....c........c....
.........A.........
.....c........c....
#.................#
#.....#....#......#
#bb...#....#...bb.#
#bb...#....#...bb.#
###################
`),
 blueprint('cistern','CISTERNA ABANDONADA','cistern',`
###################
#.......###.......#
#.......#.#.......#
#.......#.#.......#
#...t.........t...#
...................
.........A.........
...................
#...t.........t...#
#.......#.#.......#
#.......#.#.......#
#.......###.......#
###################
`),
 blueprint('foundry','FORJA ESQUECIDA','forge',`
###################
#..b..t.....t..b..#
#.................#
#......#####......#
#.................#
.....b.........b...
.........A.........
.....b.........b...
#.................#
#......#####......#
#.................#
#..t...........t..#
###################
`),
 blueprint('ossuary','OSSUÁRIO PROFUNDO','ossuary',`
###################
#..c....#.#....c..#
#.......#.#.......#
#.................#
#.....b.....b.....#
.....t.........t...
.........A.........
.....t.........t...
#.....b.....b.....#
#.................#
#.......#.#.......#
#..c....#.#....c..#
###################
`),
 blueprint('treasury','COFRE PROFANADO','treasure',`
###################
#....c..###..c....#
#.......#.#.......#
#.................#
#....b.......b....#
...................
.........A.........
...................
#....b.......b....#
#.................#
#.......#.#.......#
#....c..###..c....#
###################
`),
 blueprint('warden','TRONO DO GUARDIÃO','boss',`
###################
#..t...........t..#
#.................#
#....c.......c....#
#.................#
...................
.........B.........
...................
#.................#
#....c.......c....#
#.................#
#..t...........t..#
###################
`)
]);
export function validateBlueprint(room){
 const cells=[];let nodes=[];for(let z=0;z<HEIGHT;z++)for(let x=0;x<WIDTH;x++){
  const ch=room.rows[z][x];if(ch!=='#'){cells.push(`${x},${z}`);if(ch==='A'||ch==='B'||ch==='P')nodes.push({x,z,ch});}
 }
 if(!nodes.length)throw Error(`No semantic node ${room.id}`);
 const seen=new Set([`${nodes[0].x},${nodes[0].z}`]),queue=[[nodes[0].x,nodes[0].z]];
 for(let i=0;i<queue.length;i++){
  const [x,z]=queue[i];for(const [a,b]of [[1,0],[-1,0],[0,1],[0,-1]]){
   const xx=x+a,zz=z+b,key=`${xx},${zz}`;
   if(xx>=0&&zz>=0&&xx<WIDTH&&zz<HEIGHT&&room.rows[zz][xx]!=='#'&&!seen.has(key)){seen.add(key);queue.push([xx,zz]);}
  }
 }
 if(seen.size!==cells.length)throw Error(`Disconnected room: ${room.id}; ${seen.size}/${cells.length}`);
 if(![5,6,7].every(z=>room.rows[z][0]!== '#'&&room.rows[z][WIDTH-1]!=='#'))throw Error(`Missing door sockets ${room.id}`);
 return {id:room.id,floor:cells.length,nodes:nodes.length};
}
export function chooseExpedition(random=Math.random){
 const eligible=ROOMS.filter(r=>r.theme!=='boss'&&r.theme!=='treasure'&&r.id!=='crypt');
 const pool=[...eligible];for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 return [ROOMS[0],...pool.slice(0,2),ROOMS.find(r=>r.id==='treasury'),ROOMS.find(r=>r.id==='warden')];
}
export const worldX=(roomIndex,col)=>roomIndex*(WIDTH+5)*TILE+col*TILE;
export const worldZ=row=>row*TILE;