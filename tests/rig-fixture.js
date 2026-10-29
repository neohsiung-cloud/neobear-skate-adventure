import fs from 'node:fs';import * as THREE from '../vendor/build/three.module.js';
export function readRig(){const bytes=fs.readFileSync(new URL('../assets/neo.glb',import.meta.url)),len=bytes.readUInt32LE(12),j=JSON.parse(bytes.subarray(20,20+len)),bin=bytes.subarray(20+len+8);const joints=new Set(j.skins.flatMap(s=>s.joints));const nodes=j.nodes.map((n,i)=>{const o=joints.has(i)?new THREE.Bone():new THREE.Object3D();o.name=n.name||'';if(n.matrix)new THREE.Matrix4().fromArray(n.matrix).decompose(o.position,o.quaternion,o.scale);else{if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale)}return o});j.nodes.forEach((n,i)=>(n.children||[]).forEach(k=>nodes[i].add(nodes[k])));const root=new THREE.Group();j.scenes[j.scene||0].nodes.forEach(i=>root.add(nodes[i]));root.updateMatrixWorld(true);
 function accessor(i){
 const a=j.accessors[i],size={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type],types={5120:[1,'readInt8'],5121:[1,'readUInt8'],5122:[2,'readInt16LE'],5123:[2,'readUInt16LE'],5125:[4,'readUInt32LE'],5126:[4,'readFloatLE']},comp=types[a.componentType];
 let result=Array.from({length:a.count},()=>Array(size).fill(0));
 if(a.bufferView!==undefined){const view=j.bufferViews[a.bufferView],start=(view.byteOffset||0)+(a.byteOffset||0),stride=view.byteStride||size*comp[0];result=result.map((_,k)=>Array.from({length:size},(_,m)=>bin[comp[1]](start+k*stride+m*comp[0])))}
 if(a.sparse){const sp=a.sparse,iv=j.bufferViews[sp.indices.bufferView],vv=j.bufferViews[sp.values.bufferView],ic=types[sp.indices.componentType],io=(iv.byteOffset||0)+(sp.indices.byteOffset||0),vo=(vv.byteOffset||0)+(sp.values.byteOffset||0);for(let k=0;k<sp.count;k++){const index=bin[ic[1]](io+k*ic[0]);result[index]=Array.from({length:size},(_,m)=>bin[comp[1]](vo+(k*size+m)*comp[0]))}}
 return result;
 }

 return {j,bin,nodes,root,accessor};}
