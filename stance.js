import * as THREE from './vendor/build/three.module.js';
export const STANCE={yaw:Math.PI+.94,scale:1.38,height:.139};
// All rotations are relative to the source bind pose, transformed through each
// joint's rest-world orientation. Head and hands remain separate from torso lean.
export function makeSkatingPose(neo){
 neo.rotation.y=STANCE.yaw;neo.scale.setScalar(STANCE.scale);neo.position.y=STANCE.height;neo.updateMatrixWorld(true);
 const neoWorld=neo.getWorldQuaternion(new THREE.Quaternion()),records=[];
 neo.traverse(b=>{if(b.isBone)records.push({bone:b,base:b.quaternion.clone(),world:b.getWorldQuaternion(new THREE.Quaternion())})});
 const charAxis=(x,y,z)=>new THREE.Vector3(x,y,z).applyQuaternion(neoWorld);
 const rotation=(d,axis,angle)=>d.bone.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(axis.clone().applyQuaternion(d.world.clone().invert()),angle));
 for(const d of records){const n=d.bone.name;d.bone.quaternion.copy(d.base);
  if(n==='Shoulder_L')rotation(d,charAxis(0,0,1),-.56);
  if(n==='Shoulder_R')rotation(d,charAxis(0,0,1),.70);
  if(n==='Elbow_L')rotation(d,charAxis(0,0,1),-.15);
  if(n==='Elbow_R')rotation(d,charAxis(0,0,1),.20);
  if(n.startsWith('Hip_'))rotation(d,charAxis(1,0,0),-.29);
  if(n.startsWith('Knee_'))rotation(d,charAxis(1,0,0),.59);
  if(n.startsWith('Ankle_'))rotation(d,charAxis(1,0,0),-.30);
  if(n==='BackA_M')rotation(d,new THREE.Vector3(1,0,0),-.09);
  if(n==='Chest_M')rotation(d,new THREE.Vector3(1,0,0),-.12);
  if(n==='Head_M'){rotation(d,new THREE.Vector3(0,1,0),-.43);rotation(d,new THREE.Vector3(1,0,0),.06)}
  d.posed=d.bone.quaternion.clone();
 }
 neo.updateMatrixWorld(true);return records;
}
export function animateSkatingPose(records,{time=0,jump=0,turn=0,greet=0,wave=0}={}){
 for(const d of records){d.bone.quaternion.copy(d.posed);let axis,angle=0;if(d.bone.name==='Chest_M'){axis=new THREE.Vector3(1,0,0);angle=-.018*Math.sin(time*4)-jump*.045}if(d.bone.name==='Head_M'){axis=new THREE.Vector3(0,0,1);angle=-turn*.17}if(axis)d.bone.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(axis.applyQuaternion(d.world.clone().invert()),angle));
  if(greet>0){
   const axis=new THREE.Vector3(0,0,1).applyAxisAngle(new THREE.Vector3(0,1,0),STANCE.yaw).applyQuaternion(d.world.clone().invert());
   const a=d.bone.name==='Shoulder_R'?-1.75*greet:d.bone.name==='Elbow_R'?-.45*greet:d.bone.name==='Wrist_R'?.30*wave:0;
   if(a)d.bone.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(axis,a));
  }}
}
