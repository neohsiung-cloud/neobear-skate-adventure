import * as THREE from './vendor/build/three.module.js';
export const BOARD={width:.42,length:1.00,top:.155,wheelRadius:.075};
export function buildSkateboard(texture=null){
 const {width:w,length:l}=BOARD,r=w/2,c=l/2-r,shape=new THREE.Shape();shape.moveTo(-r,-c);shape.absarc(0,-c,r,Math.PI,Math.PI*2,false);shape.lineTo(r,c);shape.absarc(0,c,r,0,Math.PI,false);shape.closePath();
 const geo=new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelThickness:.009,bevelSize:.009,bevelSegments:2,steps:1,curveSegments:18});geo.rotateX(-Math.PI/2);geo.translate(0,.102,0);
 const p=geo.attributes.position,uv=geo.attributes.uv;
 for(let i=0;i<p.count;i++){const z=p.getZ(i),kick=.057*Math.pow(Math.max(0,(Math.abs(z)-.29)/.26),2);p.setY(i,p.getY(i)+kick);uv.setXY(i,.5+p.getX(i)/w*.289,.5-z/l*.94)}geo.computeVertexNormals();geo.computeBoundingBox();
 const group=new THREE.Group(),paint=new THREE.MeshStandardMaterial({color:0xffffff,map:texture,roughness:.42}),edge=new THREE.MeshStandardMaterial({color:'#3c302e',roughness:.55});const deck=new THREE.Mesh(geo,[paint,edge]);deck.castShadow=true;deck.receiveShadow=true;deck.name='OriginalArt_SkateDeck';group.add(deck);
 const axleMat=new THREE.MeshStandardMaterial({color:'#546472',metalness:.65,roughness:.32}),wheelMat=new THREE.MeshStandardMaterial({color:'#ffda27',roughness:.36}),hubMat=new THREE.MeshStandardMaterial({color:'#fff3ab',metalness:.1,roughness:.4});
 for(const z of [-.28,.28]){const axle=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.41,12),axleMat);axle.rotation.z=Math.PI/2;axle.position.set(0,.006,z);group.add(axle);for(const x of [-.21,.21]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.075,20),wheelMat);wheel.rotation.z=Math.PI/2;wheel.position.set(x,0,z);wheel.castShadow=true;group.add(wheel);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.079,12),hubMat);hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);group.add(hub)}}
 return group;
}
