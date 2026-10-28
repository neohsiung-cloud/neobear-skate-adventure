import * as THREE from './vendor/build/three.module.js';
// Preserve all glTF JOINTS_n / WEIGHTS_n sets in WebGL2. Extra influences are
// packed into a vertex texture, avoiding the vertex-attribute-count limit.
export function enableFullSkin(mesh) {
 if(!mesh.isSkinnedMesh)return;
 const g=mesh.geometry,sets=[];
 for(let j=1;g.hasAttribute('joints_'+j)&&g.hasAttribute('weights_'+j);j++)sets.push([g.getAttribute('joints_'+j),g.getAttribute('weights_'+j)]);
 if(!sets.length)return;
 const pairs=sets.length*2,count=g.getAttribute('position').count,width=1024,height=Math.ceil(count*pairs/width),data=new Float32Array(width*height*4);
 for(let v=0;v<count;v++)for(let j=0;j<sets.length;j++){
  const [ind,wei]=sets[j],is=[ind.getX(v),ind.getY(v),ind.getZ(v),ind.getW(v)],ws=[wei.getX(v),wei.getY(v),wei.getZ(v),wei.getW(v)];
  const k=(v*pairs+j*2)*4;data.set([is[0],ws[0],is[1],ws[1],is[2],ws[2],is[3],ws[3]],k);
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.FloatType);texture.needsUpdate=true;texture.minFilter=THREE.NearestFilter;texture.magFilter=THREE.NearestFilter;
 const prelude=`
#ifdef USE_SKINNING
uniform highp sampler2D neoExtraSkin;
mat4 neoExtraSkinMatrix(){
 mat4 result=mat4(0.0);int start=gl_VertexID*${pairs};
 for(int j=0;j<${pairs};j++){int idx=start+j;vec4 s=texelFetch(neoExtraSkin,ivec2(idx%${width},idx/${width}),0);if(s.y>0.0)result+=getBoneMatrix(s.x)*s.y;if(s.w>0.0)result+=getBoneMatrix(s.z)*s.w;}
 return result;
}
#endif
`;
 function patch(mat){
  mat.onBeforeCompile=shader=>{
   shader.uniforms.neoExtraSkin={value:texture};
   shader.vertexShader=shader.vertexShader.replace('void main() {',prelude+'\nvoid main() {');
   shader.vertexShader=shader.vertexShader.replace('#include <skinbase_vertex>','#include <skinbase_vertex>\n#ifdef USE_SKINNING\nmat4 neoExtra=neoExtraSkinMatrix();\n#endif');
   shader.vertexShader=shader.vertexShader.replace('#include <skinnormal_vertex>',THREE.ShaderChunk.skinnormal_vertex.replace('skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;','skinMatrix += neoExtra;\nskinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;'));
   shader.vertexShader=shader.vertexShader.replace('#include <skinning_vertex>',THREE.ShaderChunk.skinning_vertex.replace('transformed = ( bindMatrixInverse * skinned ).xyz;','skinned += neoExtra * skinVertex;\ntransformed = ( bindMatrixInverse * skinned ).xyz;'));
  };
  mat.customProgramCacheKey=()=>`neoFullSkin${pairs}`;return mat;
 }
 mesh.material=Array.isArray(mesh.material)?mesh.material.map(m=>patch(m.clone())):patch(mesh.material.clone());
 mesh.customDepthMaterial=patch(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}));
 mesh.userData.extraSkinSets=sets.length;
}
