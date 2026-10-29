// Pure visual rewards: never changes lane, jump height, speed or collision state.
const TAU=Math.PI*2,FACE_YAW=TAU-(Math.PI+.94)+.43;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
export function celebrationPose(kind,phase){
 const p=Math.max(0,Math.min(1,phase));
 if(kind==='spin'){
  const yaw=p<.44?FACE_YAW*smooth(p/.44):p<.60?FACE_YAW:FACE_YAW+(TAU-FACE_YAW)*smooth((p-.60)/.40);
  return {yaw,greet:0,wave:0,lift:.075*Math.sin(Math.PI*p)};
 }
 if(kind==='greet'){
  const strength=p<.30?smooth(p/.30):p>.70?smooth((1-p)/.30):1;
  return {yaw:FACE_YAW*strength,greet:strength,wave:Math.sin(p*Math.PI*7)*strength,lift:0};
 }
 return {yaw:0,greet:0,wave:0,lift:0};
}
export class Celebration {
 constructor(){this.reset()}
 reset(){this.active=null;this.pending=null;this.elapsed=0;this.cooldown=0;this.cancelFrom=null;this.cancelTime=0}
 request(kind,streak=0){if(!['greet','spin'].includes(kind))return;if(this.pending?.kind==='greet'&&kind==='spin')return;this.pending={kind,streak,age:0}}
 cancel(){this.cancelFrom=this.sample();this.cancelTime=0;this.active=null;this.pending=null;this.cooldown=1.6}
 update(dt,safe=true){
  dt=Math.max(0,Math.min(.05,dt));this.cooldown=Math.max(0,this.cooldown-dt);
  if(this.cancelFrom){this.cancelTime+=dt;if(this.cancelTime>=.20)this.cancelFrom=null}
  if(this.active){this.elapsed+=dt;if(this.elapsed>=this.duration){this.active=null;this.elapsed=0}}
  if(this.pending){this.pending.age+=dt;if(this.pending.age>2.5)this.pending=null}
  if(!this.active&&!this.cancelFrom&&this.pending&&this.cooldown===0&&safe){
   const {kind,streak}=this.pending;this.active=kind;this.pending=null;this.elapsed=0;this.duration=kind==='spin'?1.38:1.65;this.cooldown=3.6;return {kind,streak};
  }
  return null;
 }
 sample(){
  if(this.cancelFrom){const k=1-smooth(this.cancelTime/.20),from=this.cancelFrom;return {yaw:Math.atan2(Math.sin(from.yaw),Math.cos(from.yaw))*k,greet:from.greet*k,wave:from.wave*k,lift:from.lift*k}}
  return celebrationPose(this.active,this.active?this.elapsed/this.duration:0);
 }
}
