import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoundedBoxGeometry} from './rounded-box.js';
import {enableFullSkin} from './multi-skin.js';
import {Adventure,LANES,GOAL} from './model.js';
import {buildSkateboard} from './skateboard.js';
import {makeSkatingPose,animateSkatingPose} from './stance.js';
import {GameMusic} from './music.js';
import {Celebration} from './celebration.js';
const $=s=>document.querySelector(s),root=$('#game'),state=new Adventure(),celebration=new Celebration();
let loaded=false,muted=false,toastUntil=0,doctorNoticeUntil=0,boneData=[],neo=null,clockTime=0,pendingIntro=false;
const voice=new Audio('assets/doctor-voice.mp3');voice.preload='auto';const music=new GameMusic(new Audio('assets/dream-town-bgm.mp3'));let audioCtx;
function chime(freq=660){if(muted)return;try{audioCtx??=new AudioContext();audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(freq*1.5,audioCtx.currentTime+.09);g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.16);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.17)}catch{}}
function toast(text,d=2.3){$('#toast').textContent=text;toastUntil=state.time+d;$('#toast').classList.add('show')}
const renderer=new THREE.WebGLRenderer({canvas:$('#world'),antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#43bfe9');scene.fog=new THREE.Fog('#80d9ef',48,112);
const camera=new THREE.PerspectiveCamera(48,1,.1,150);camera.position.set(0,5.8,9.8);camera.lookAt(0,-.5,-3.5);
scene.add(new THREE.HemisphereLight(0xfff4dc,0x718fa8,1.65));const sunlight=new THREE.DirectionalLight(0xffedcc,3.4);sunlight.position.set(-8,16,8);sunlight.castShadow=true;sunlight.shadow.mapSize.set(1024,1024);Object.assign(sunlight.shadow.camera,{left:-8,right:8,top:8,bottom:-10,near:.5,far:50});sunlight.shadow.normalBias=.04;sunlight.shadow.bias=-.0002;scene.add(sunlight);scene.add(sunlight.target);sunlight.target.position.set(0,0,-2);const rim=new THREE.DirectionalLight(0xb9edff,1.2);rim.position.set(6,8,-12);scene.add(rim);
const materials=new Map();function mat(color,extra={}){const key=color+JSON.stringify(extra);if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.53,...extra}));return materials.get(key)}
const boxGeo=new Map();function rounded(w,h,d,c,r=.1){const key=[w,h,d,r].join(',');if(!boxGeo.has(key))boxGeo.set(key,new RoundedBoxGeometry(w,h,d,2,r));const m=new THREE.Mesh(boxGeo.get(key),mat(c));m.castShadow=true;m.receiveShadow=true;return m}
function sphere(r,color){return new THREE.Mesh(new THREE.SphereGeometry(r,12,8),mat(color))}
function cyl(rt,rb,h,c){return new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,16),mat(c))}
function add(o,x,y,z,parent=scene){o.position.set(x,y,z);parent.add(o);return o}
// Road and repeating scenery move toward the rider; all gameplay stays in local coordinates.
const road=rounded(5.6,.3,125,'#efbc73',.14);add(road,0,-.19,-49);road.receiveShadow=true;
const pavingCanvas=document.createElement('canvas');pavingCanvas.width=512;pavingCanvas.height=512;const pc=pavingCanvas.getContext('2d');pc.fillStyle='#d29751';pc.fillRect(0,0,512,512);for(let row=0;row<4;row++)for(let col=-1;col<5;col++){const x=col*128+(row%2)*64;pc.fillStyle=['#edbd77','#eab36a','#f2c47f','#e7ad62'][(row+col+5)%4];pc.fillRect(x+2,row*128+2,124,124);pc.fillStyle='#f8d497';pc.fillRect(x+4,row*128+4,120,2)}const paving=new THREE.CanvasTexture(pavingCanvas);paving.colorSpace=THREE.SRGBColorSpace;paving.wrapS=paving.wrapT=THREE.RepeatWrapping;paving.repeat.set(2,24);paving.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());road.material=road.material.clone();road.material.color.set('#ffffff');road.material.map=paving;road.material.roughness=.84;
const trimL=rounded(.21,.2,125,'#fff6df',.06),trimR=trimL.clone();add(trimL,-2.87,-.01,-49);add(trimR,2.87,-.01,-49);
for(const x of [-.825,.825]){const line=new THREE.Mesh(new THREE.PlaneGeometry(.035,125),new THREE.MeshBasicMaterial({color:0xfdf7e6}));line.rotation.x=-Math.PI/2;add(line,x,.003,-49)}
const dashes=[];for(let n=0;n<32;n++){const m=rounded(.11,.012,1.1,'#fff8e5',.005);add(m,0,.014,-n*3.8);dashes.push(m)}
const ground=rounded(100,.5,130,'#4eb94f',.1);add(ground,0,-.6,-49);
// Soft toy-like houses, lollipop trees and cloud islands.
const scenery=[];let sr=319;function rand(){sr=(1664525*sr+1013904223)>>>0;return sr/4294967296}
const palette=['#ff795a','#3db8df','#ffce43','#a68be4','#50c6a2'];
for(let i=0;i<42;i++){
 const g=new THREE.Group(),side=i%2?-1:1;g.position.set(side*(4.7+rand()*4),0,-i*3.4);g.userData.baseZ=g.position.z;scene.add(g);scenery.push(g);
 if(i%3===0){const h=1.8+rand()*1.9;add(rounded(1.65,h,1.8,palette[i%5],.18),0,h/2,0,g);const roof=new THREE.Mesh(new THREE.ConeGeometry(1.5,.9,4),mat(i%2?'#e65e48':'#228db4'));roof.rotation.y=Math.PI/4;add(roof,0,h+.35,0,g);add(rounded(.43,.8,.07,'#fff4d9',.12),0,.4,.94,g);for(const x of [-.47,.47])add(rounded(.32,.4,.08,'#257f9f',.08),x,h-.65,.94,g)}else{const h=1.5+rand()*1.3;add(cyl(.12,.17,h,'#ad7549'),0,h/2,0,g);add(sphere(.8+rand()*.3,i%2?'#30ac58':'#55c646'),0,h+.25,0,g);add(sphere(.53,'#9cdd4a'),-.5,h+.5,.1,g);add(sphere(.5,'#75d64c'),.5,h+.4,.1,g)}
}
for(let i=0;i<16;i++){const c=new THREE.Group();for(let k=0;k<4;k++){const m=sphere(1.1+k%2*.5,'#fffaf2');m.scale.set(1.6,.6,1);add(m,k*1.2,Math.sin(k)*.3,0,c)}add(c,(i%2?1:-1)*(9+rand()*13),2+rand()*3,-i*8);scenery.push(c);c.userData.baseZ=c.position.z}
for(let i=0;i<4;i++){const color=['#ff816a','#ffd34f','#59cb86','#5caff0'][i];const rainbow=new THREE.Mesh(new THREE.TorusGeometry(12-i*.46,.19,8,64,Math.PI),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.65}));add(rainbow,0,.6,-82)}
// Actual NeoBear mesh and full original skin weights, no simultaneous facial targets.
const rider=new THREE.Group();rider.position.set(0,.077,3);scene.add(rider);
const boardTexture=new THREE.TextureLoader().load('assets/skateboard.jpg');boardTexture.colorSpace=THREE.SRGBColorSpace;boardTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
const boardGroup=buildSkateboard(boardTexture);rider.add(boardGroup);
new GLTFLoader().load('assets/neo.glb',g=>{
 neo=g.scene;rider.add(neo);
 neo.traverse(o=>{if(o.isSkinnedMesh){enableFullSkin(o);o.castShadow=true;o.receiveShadow=false;o.frustumCulled=false}if(o.morphTargetInfluences)o.morphTargetInfluences.fill(0);});
 boneData=makeSkatingPose(neo);
 loaded=true;$('#start').disabled=false;$('#start').textContent='踩上滑板，出发！';
},undefined,e=>{console.error('NeoBear model load failed',e);$('#loadError').hidden=false;$('#loadError').textContent='模型未载入，请使用“启动游戏.command”打开。';$('#start').textContent='等待模型载入'});
// Doctor uses the official rocket-backpack pose; this first prototype keeps him a billboard.
const doctor=new THREE.Group();scene.add(doctor);doctor.visible=false;const texture=new THREE.TextureLoader().load('assets/doctor-mobile.png');texture.colorSpace=THREE.SRGBColorSpace;const doctorSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));doctorSprite.scale.set(2.25,2.68,1);doctor.add(doctorSprite);
const flame=sphere(.25,'#ffb649');flame.scale.set(.65,1.7,.65);add(flame,-.6,-1,0,doctor);
const target=new THREE.Group();const ring=new THREE.Mesh(new THREE.RingGeometry(.47,.65,40),new THREE.MeshBasicMaterial({color:0xf6ac43,side:THREE.DoubleSide,transparent:true,opacity:.8}));ring.rotation.x=-Math.PI/2;target.add(ring);const cross=rounded(.06,.01,.9,'#f6ac43',.005);target.add(cross);target.visible=false;scene.add(target);
const finishGate=new THREE.Group();scene.add(finishGate);for(const x of [-2.5,2.5])add(rounded(.22,3.5,.25,'#fff5da',.1),x,1.75,0,finishGate);add(rounded(5.2,.75,.28,'#85c7bd',.14),0,3.5,0,finishGate);const signCanvas=document.createElement('canvas');signCanvas.width=640;signCanvas.height=120;const signCtx=signCanvas.getContext('2d');signCtx.fillStyle='#fff9df';signCtx.font='bold 56px sans-serif';signCtx.textAlign='center';signCtx.textBaseline='middle';signCtx.fillText('✦  彩虹小镇  ✦',320,60);const signTexture=new THREE.CanvasTexture(signCanvas);signTexture.colorSpace=THREE.SRGBColorSpace;add(new THREE.Mesh(new THREE.PlaneGeometry(4.5,.85),new THREE.MeshBasicMaterial({map:signTexture,transparent:true})),0,3.5,.16,finishGate);
const objects=new Map(),fx=[];
const coinGeo=new THREE.CylinderGeometry(.22,.22,.075,20);const coinMat=mat('#ffd153',{metalness:.3,roughness:.35});const coinInner=new THREE.TorusGeometry(.156,.018,5,18);const coinInnerMat=mat('#fff0a4');
function makeCoin(){const g=new THREE.Group(),c=new THREE.Mesh(coinGeo,coinMat);c.rotation.x=Math.PI/2;g.add(c);const t=new THREE.Mesh(coinInner,coinInnerMat);t.position.z=.045;g.add(t);return g}
function makeObstacle(type){const g=new THREE.Group();if(type==='banana'){
 const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.35,.05,.05),new THREE.Vector3(-.13,.24,0),new THREE.Vector3(0,.3,0),new THREE.Vector3(.22,.06,.18),new THREE.Vector3(.4,.02,.14)]);g.add(new THREE.Mesh(new THREE.TubeGeometry(curve,12,.075,6,false),mat('#ffda55')));for(let j=0;j<3;j++){const p=new THREE.Mesh(new THREE.ConeGeometry(.12,.43,6),mat('#ffe47c'));p.rotation.z=(j-1)*1.4;p.rotation.x=.5;add(p,(j-1)*.15,.11,0,g)}
 }else if(type==='crate'){
 add(rounded(.96,.74,.72,'#e9b691',.12),0,.37,0,g);add(rounded(.12,.76,.76,'#f9dfb3',.04),0,.38,0,g);add(rounded(1,.1,.75,'#f9dfb3',.03),0,.38,0,g);const star=sphere(.13,'#fff2cc');star.scale.z=.15;add(star,.28,.48,.38,g);
 }else{add(rounded(.84,.08,.72,'#ffe7c7',.04),0,.04,0,g);add(new THREE.Mesh(new THREE.ConeGeometry(.33,.8,16),mat('#f39779')),0,.45,0,g);add(cyl(.20,.24,.13,'#fff7df'),0,.43,0,g)}return g}
function sparkle(x,y,z){for(let i=0;i<5;i++){const p=sphere(.045,'#ffdf64');p.position.set(x,y,z);scene.add(p);fx.push({mesh:p,life:.55,v:new THREE.Vector3((Math.random()-.5)*2,Math.random()*2,(Math.random()-.5)*2)})}}
function syncWorld(dt){
 paving.offset.y=state.distance/125*24;
 finishGate.position.z=3-(GOAL-state.distance);finishGate.visible=GOAL-state.distance<95;
 const reward=celebration.sample();rider.rotation.y=reward.yaw;
 rider.position.x=state.x;rider.position.y=.077+state.y+reward.lift+(state.mode==='playing'?Math.sin(state.time*6)*.012:0);const lean=THREE.MathUtils.clamp((LANES[state.lane]-state.x)*-.13,-.15,.15);rider.rotation.z=THREE.MathUtils.lerp(rider.rotation.z,lean,.2);boardGroup.rotation.x=state.y>.1?-.08*Math.sin(state.jumpT/.95*Math.PI):0;
 if(neo){neo.visible=!(state.invincible>0&&Math.floor(state.invincible*9)%2===0);animateSkatingPose(boneData,{time:state.time,jump:state.y,turn:lean,greet:reward.greet,wave:reward.wave});neo.traverse(o=>{if(o.morphTargetDictionary&&o.morphTargetInfluences)for(const key of ['Msml_l','Msml_r']){const i=o.morphTargetDictionary[key];if(i!==undefined)o.morphTargetInfluences[i]=.22*reward.greet}})}
 for(const o of state.items){if(o.at-state.distance>91)continue;let m=objects.get(o.id);if(!m){m=o.type==='coin'?makeCoin():makeObstacle(o.type);objects.set(o.id,m);scene.add(m)}m.position.set(LANES[o.lane],o.type==='coin'?.78+o.height:0,3-(o.at-state.distance));if(o.type==='coin'){m.rotation.y=clockTime*2.1;m.position.y+=Math.sin(clockTime*3+o.at)*.035}}
 const live=new Set(state.items.map(o=>o.id));for(const [id,m]of objects){if(!live.has(id)){scene.remove(m);objects.delete(id);if(m.children[0]?.geometry===coinGeo)sparkle(m.position.x,m.position.y,m.position.z)}}
 for(const m of dashes)m.position.z=7-((7-m.userData.z0+state.distance)%121.6); // assigned z0 below
 for(const g of scenery)g.position.z=12-((12-g.userData.baseZ+state.distance*.78)%145);
 if(state.doctor){doctor.visible=true;const age=state.time-state.doctor.born,entry=Math.min(1,age/.8),exit=Math.max(0,(age-4.7)/1.3);doctor.position.set(THREE.MathUtils.lerp(6,LANES[state.doctor.lane]+.5,entry)+exit*6,3.4+Math.sin(age*4)*.18,-9+Math.sin(age*.8));flame.scale.y=1.6+Math.sin(clockTime*20)*.3;target.visible=!state.doctor.dropped;target.position.set(LANES[state.doctor.lane],.025,3-(state.doctor.at-state.distance));ring.material.opacity=.35+.5*(.5+.5*Math.sin(clockTime*9))}else{doctor.visible=false;target.visible=false}
 for(let i=fx.length-1;i>=0;i--){const p=fx[i];p.life-=dt;p.mesh.position.addScaledVector(p.v,dt);p.v.y-=3*dt;p.mesh.scale.setScalar(Math.max(0,p.life/.55));if(p.life<=0){scene.remove(p.mesh);p.mesh.geometry.dispose();fx.splice(i,1)}}
 $('#coins').textContent=state.coins;$('#hearts').textContent='♥ '.repeat(state.hearts)+'♡ '.repeat(3-state.hearts);$('#progress').style.width=Math.min(100,state.distance/GOAL*100)+'%';$('#tutorial').hidden=state.mode!=='playing'||state.time>6;$('#doctorNotice').hidden=state.time>doctorNoticeUntil||!state.doctor||state.mode!=='playing';if(state.time>toastUntil)$('#toast').classList.remove('show');
}
for(const m of dashes)m.userData.z0=m.position.z;
function modal(kind){$('#modal').hidden=false;$('#resultCoins').hidden=kind==='paused';$('#modalIcon').textContent=kind==='won'?'✦':kind==='over'?'♥':'☁';$('#modalTitle').textContent=kind==='won'?'抵达彩虹小镇！':kind==='over'?'休息一下，再出发':'休息一下';$('#modalText').textContent=kind==='won'?'每一次勇敢的跳跃，都值得一颗星星。':kind==='over'?'已经很棒啦！下一趟会发现更多金币。':'小滑板会等你回来。';$('#resultCoins').textContent='★ '+state.coins+' 枚金币';$('#continue').textContent=kind==='paused'?'继续冒险':'再玩一趟';if(kind==='won'){for(let i=0;i<34;i++){const e=document.createElement('i');e.style.left=Math.random()*100+'%';e.style.top=-20+'px';e.style.background=['#ffd05b','#70c5b1','#f59b8c','#b7a8d9'][i%4];e.style.animationDelay=Math.random()*.8+'s';$('#confetti').append(e)}setTimeout(()=>$('#confetti').replaceChildren(),4000)}}
function pause(){if(state.mode!=='playing')return;state.pause();voice.pause();music.pause();audioCtx?.suspend();modal('paused')}
function resume(){state.resume();$('#modal').hidden=true;music.play();audioCtx?.resume();if(!muted&&voice.currentTime>0&&!voice.ended)voice.play().catch(()=>{})}
function begin(){state.reset();celebration.reset();objects.forEach(m=>scene.remove(m));objects.clear();fx.forEach(p=>scene.remove(p.mesh));fx.length=0;voice.pause();voice.currentTime=0;$('#cover').hidden=true;$('#modal').hidden=true;$('#hud').hidden=false;$('#controls').hidden=false;$('#toast').classList.remove('show');doctorNoticeUntil=-1;state.start();music.play(true);audioCtx?.resume()}
async function start(){
 if(!loaded||pendingIntro)return;pendingIntro=true;chime(440);
 const primeVoice=async()=>{voice.muted=true;try{await voice.play()}catch{}finally{voice.pause();voice.currentTime=0;voice.muted=muted}};
 await Promise.all([music.unlock(),primeVoice()]);pendingIntro=false;
 let seen=false;try{seen=!!sessionStorage.getItem('neo-intro')}catch{}
 if(!seen){pendingIntro=true;$('#intro').hidden=false;const v=$('#introVideo');v.muted=muted;const finish=()=>{if(!pendingIntro)return;pendingIntro=false;v.pause();$('#intro').hidden=true;try{sessionStorage.setItem('neo-intro','1')}catch{}begin()};v.onended=finish;v.onerror=finish;$('#skipIntro').onclick=finish;try{await v.play()}catch{finish()}}else begin();
}
$('#start').onclick=start;$('#pause').onclick=pause;$('#continue').onclick=()=>state.mode==='paused'?resume():begin();$('#home').onclick=()=>{voice.pause();music.pause();audioCtx?.suspend();state.mode='ready';celebration.reset();$('#modal').hidden=true;$('#hud').hidden=true;$('#controls').hidden=true;$('#cover').hidden=false;$('#doctorNotice').hidden=true;$('#tutorial').hidden=true;$('#toast').classList.remove('show')};
$('#sound').onclick=()=>{muted=!muted;voice.muted=muted;music.mute(muted);$('#introVideo').muted=muted;$('#sound').textContent=muted?'♪̸':'♫';$('#sound').setAttribute('aria-label',muted?'开启声音':'关闭声音');if(muted)audioCtx?.suspend();else audioCtx?.resume()};
for(const [sel,fn]of [['#left',()=>state.move(-1)],['#right',()=>state.move(1)],['#jump',()=>state.jump()]]){$(sel).addEventListener('click',e=>{if(e.detail===0)fn()});$(sel).addEventListener('pointerdown',e=>{e.preventDefault();fn();$(sel).classList.add('pressed');setTimeout(()=>$(sel).classList.remove('pressed'),130)})}
let touchStart=null;$('#world').addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY};$('#world').setPointerCapture(e.pointerId)});$('#world').addEventListener('pointerup',e=>{if(!touchStart)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;if(Math.abs(dx)>32&&Math.abs(dx)>Math.abs(dy))state.move(Math.sign(dx));else if(dy< -28)state.jump();touchStart=null});
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp',' ','Escape'].includes(e.key)){e.preventDefault();if(e.repeat)return;if(e.key==='ArrowLeft')state.move(-1);if(e.key==='ArrowRight')state.move(1);if(e.key==='ArrowUp'||e.key===' ')state.jump();if(e.key==='Escape'){if(state.mode==='playing')pause();else if(state.mode==='paused')resume()}}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();voice.pause();if(pendingIntro){$('#introVideo').pause()}}else if(pendingIntro)$('#introVideo').play().catch(()=>{})});
let last=performance.now();function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;clockTime+=dt;music.update(state.mode==='playing'?dt:0);if(state.mode==='playing'){state.tick(dt);for(const e of state.drain()){if(e.type==='coin')chime();if(e.type==='jump')chime(380);if(e.type==='doctor'){music.doctor();doctorNoticeUntil=state.time+3.7;if(!muted){voice.currentTime=0;voice.play().catch(()=>{})}}if(e.type==='celebrate')celebration.request(e.kind,e.streak);if(e.type==='bump'){celebration.cancel();toast(e.kind==='banana'?'哎呀，香蕉皮！换个方向试试':'没关系，再试试！');chime(180)}if(e.type==='won'||e.type==='over'){celebration.cancel();voice.pause();music.pause();modal(e.type)}}
 const safe=state.jumpT<0&&state.invincible===0&&!state.items.some(o=>o.type!=='coin'&&o.lane===state.lane&&o.at-state.distance>-.7&&o.at-state.distance<13);
 const started=celebration.update(dt,safe);if(started)toast(started.kind==='spin'?`连续 ${started.streak} 枚！转个圈！`:'跳得真棒！向你挥挥手！',1.6);
 }syncWorld(state.mode==='playing'?dt:0);renderer.render(scene,camera)}
function resize(){const w=root.clientWidth,h=root.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(24))*Math.max(1,.56/camera.aspect)));camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(root);resize();requestAnimationFrame(frame);
