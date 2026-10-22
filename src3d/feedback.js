// Responsive combat feedback using the existing Three.js renderer and the
// browser overlay. Keeps the camera 100% steady to avoid motion sickness.
import * as THREE from 'three';
export class CombatFeedback{
 constructor(camera,scene){
  this.camera=camera;this.scene=scene;this.labels=[];this.particles=[];this.flashes=new Map();
  this.root=document.createElement('div');this.root.id='combat-feedback';
  this.root.setAttribute('aria-hidden','true');document.body.appendChild(this.root);
  this.crosshair=document.createElement('div');this.crosshair.className='fracture-hitmarker';
  this.crosshair.textContent='✕';this.root.appendChild(this.crosshair);
  this.hitmarkerTime=0;this.hits=0;this.sparkGeometry=new THREE.SphereGeometry(.07,5,4);
 }
 hit(enemy,damage,critical=false){
  const text=document.createElement('div');text.className='fracture-damage'+(critical?' fracture-critical':'');
  text.textContent=(critical?'✦ ':'')+Math.round(damage);
  this.root.appendChild(text);
  this.labels.push({node:text,world:new THREE.Vector3(enemy.x,enemy.kind==='warden'?2.5:1.9,enemy.z),life:.7,max:.7});
  const aimTarget=new THREE.Vector3(enemy.x,1.15,enemy.z).project(this.camera);
  this.crosshair.style.left=((aimTarget.x+1)*.5*innerWidth)+'px';
  this.crosshair.style.top=((1-aimTarget.y)*.5*innerHeight)+'px';
  this.crosshair.classList.remove('active');void this.crosshair.offsetWidth;this.crosshair.classList.add('active');
  this.hitmarkerTime=.17;this.hits++;
  this.flash(enemy);
  this.sparks(enemy.x,enemy.z,critical);
 }
 flash(enemy){
  if(!enemy?.visual)return;
  const meshes=[];enemy.visual.traverse(obj=>{
   if(!obj.isMesh||!obj.material)return;
   const materials=Array.isArray(obj.material)?obj.material:[obj.material];
   for(let i=0;i<materials.length;i++){
    let material=materials[i];
    if(!material.emissive)continue;
    // Cloning avoids flashing every character that shares the cached GLB.
    if(!obj.userData.uniqueHitMaterial){
      obj.material=Array.isArray(obj.material)?obj.material.map(m=>m.clone()):obj.material.clone();
      obj.userData.uniqueHitMaterial=true;
    }
    material=Array.isArray(obj.material)?obj.material[i]:obj.material;
    meshes.push({mat:material,emissive:material.emissive.clone(),intensity:material.emissiveIntensity});
    material.emissive.setHex(0xffc48e);material.emissiveIntensity=1.5;
   }
  });
  if(meshes.length)this.flashes.set(enemy,{meshes,timer:.12});
 }
 sparks(x,z,critical){
  const count=critical?11:7,geo=this.sparkGeometry;
  for(let i=0;i<count;i++){
   const a=i/count*Math.PI*2,r=.55+((i*7)%6)*.07;
   const mat=new THREE.MeshBasicMaterial({color:critical?0xffd18c:0xffa47e,transparent:true,opacity:.95,depthWrite:false});
   const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,1.25,z);
   this.scene.add(mesh);
   this.particles.push({mesh,geo,vel:new THREE.Vector3(Math.cos(a)*r,1.5+((i*3)%5)*.26,Math.sin(a)*r),life:.28,max:.28});
  }
 }
 update(dt){
  const frame=Math.min(Math.max(0,dt),.05),w=innerWidth,h=innerHeight;
  for(const item of [...this.labels]){
   item.life-=frame;item.world.y+=frame*1.35;
   const p=item.world.clone().project(this.camera);
   item.node.style.left=((p.x+1)*.5*w)+'px';item.node.style.top=((1-p.y)*.5*h)+'px';
   item.node.style.opacity=String(Math.min(1,item.life/.22));
   if(item.life<=0||p.z>1){item.node.remove();this.labels.splice(this.labels.indexOf(item),1);}
  }
  this.hitmarkerTime=Math.max(0,this.hitmarkerTime-frame);
  if(!this.hitmarkerTime)this.crosshair.classList.remove('active');
  for(const [enemy,item] of [...this.flashes]){
   item.timer-=frame;
   if(item.timer<=0){
    for(const original of item.meshes){original.mat.emissive.copy(original.emissive);original.mat.emissiveIntensity=original.intensity;}
    this.flashes.delete(enemy);
   }
  }
  for(const p of [...this.particles]){
   p.life-=frame;
   p.mesh.position.addScaledVector(p.vel,frame*6);
   p.vel.y-=frame*13;
   p.mesh.material.opacity=Math.max(0,p.life/p.max);
   if(p.life<=0){this.scene.remove(p.mesh);p.mesh.material.dispose();this.particles.splice(this.particles.indexOf(p),1);}
  }
 }
 dispose(){
  for(const item of this.labels)item.node.remove();
  for(const p of this.particles){this.scene.remove(p.mesh);p.mesh.material.dispose();}
  for(const v of this.flashes.values())for(const original of v.meshes){
   original.mat.emissive.copy(original.emissive);original.mat.emissiveIntensity=original.intensity;
  }
  this.root.remove();this.sparkGeometry.dispose();this.labels=[];this.particles=[];this.flashes.clear();
 }
}
