// FRACTURE — Movement adapter for Three.js + Rapier.
// Gameplay remains imperative. Uses the existing Rapier kinematic controller for
// collision and THREE.MathUtils.damp for frame-rate independent acceleration.
// Design based on the established patterns in Rapier's character-controller docs
// and open-source top-down character demos; no code/assets copied verbatim.
import * as THREE from 'three';
export function screenRelativeInput(horizontal,vertical,cameraOffset){
  const f=new THREE.Vector3(cameraOffset.x,0,cameraOffset.z).normalize();
  const right=new THREE.Vector3(f.z,0,-f.x);
  const world=right.multiplyScalar(horizontal).addScaledVector(f,vertical);
  if(world.lengthSq()>1)world.normalize();
  return world;
}
export function moveVelocity(current,desired,dt,accel=23,decel=35){
  const damping=desired.lengthSq()>.0001?accel:decel;
  const n=Math.min(Math.max(dt,0),.05);
  current.x=THREE.MathUtils.damp(current.x,desired.x,damping,n);
  current.z=THREE.MathUtils.damp(current.z,desired.z,damping,n);
  if(Math.hypot(current.x,current.z)<.005)current.set(0,0,0);
  return current;
}
export function wrapRotation(current,desired,speed,dt){
  const delta=Math.atan2(Math.sin(desired-current),Math.cos(desired-current));
  return current+delta*(1-Math.exp(-speed*Math.min(.05,dt)));
}
export function canStandAt(rooms,x,z,tile){
  if(!rooms?.length)return false;
  const stride=19+5; // authored WIDTH + corridor gap
  const ix=Math.round(x/tile);
  const iz=Math.round(z/tile);
  if(iz<0||iz>=13)return false;
  const index=Math.floor((ix+0.5)/stride);
  for(const candidate of [index,index-1,index+1]){
    const room=rooms[candidate];
    if(!room)continue;
    const local=ix-room.index*stride;
    if(local>=0&&local<19&&room.layout.rows[iz]?.[local]!=='#'&&room.layout.rows[iz]?.[local]!==undefined)return true;
  }
  // Between two authored room sockets, their only walkable opening is z=5..7.
  if(iz>=5&&iz<=7)for(let i=0;i<rooms.length-1;i++){
    const left=i*stride+18,right=(i+1)*stride;
    if(ix>left&&ix<right)return true;
  }
  return false;
}
