export const LANES=[-1.65,0,1.65],GOAL=520;
export class Adventure {
 constructor(seed=42){this.seed=seed;this.reset()}
 random(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296}
 reset(){Object.assign(this,{mode:'ready',distance:0,time:0,lane:1,x:0,y:0,jumpT:-1,hearts:3,coins:0,invincible:0,slow:0,nextRow:64,nextDoctor:10,doctor:null,items:[],events:[],id:0});for(let at=14;at<60;at+=4)this.add('coin',1,at)}
 add(type,lane,at,height=0){const o={id:++this.id,type,lane,at,height,done:false};this.items.push(o);return o}
 start(){this.mode='playing'}
 move(dir){if(this.mode!=='playing')return;this.lane=Math.max(0,Math.min(2,this.lane+dir))}
 jump(){if(this.mode==='playing'&&this.jumpT<0){this.jumpT=0;this.events.push({type:'jump'})}}
 pause(){if(this.mode==='playing')this.mode='paused'}
 resume(){if(this.mode==='paused')this.mode='playing'}
 row(at){const safe=Math.floor(this.random()*3);for(let lane=0;lane<3;lane++){if(lane!==safe&&this.random()<.66)this.add(this.random()<.35?'cone':'crate',lane,at);else for(let d=0;d<3;d++)this.add('coin',lane,at+d*3,0)}return safe}
 tick(dt){if(this.mode!=='playing')return;dt=Math.min(Math.max(dt,0),.05);this.time+=dt;this.invincible=Math.max(0,this.invincible-dt);this.slow=Math.max(0,this.slow-dt);const speed=(7.6+Math.min(1.5,this.distance/320))*(this.slow>0?.57:1);const prev=this.distance;this.distance+=speed*dt;this.x+=(LANES[this.lane]-this.x)*(1-Math.exp(-16*dt));
 if(this.jumpT>=0){this.jumpT+=dt;this.y=1.7*Math.sin(Math.PI*Math.min(1,this.jumpT/.95));if(this.jumpT>=.95){this.jumpT=-1;this.y=0}}
 while(this.distance+90>this.nextRow){this.row(this.nextRow);this.nextRow+=25+this.random()*7}
 if(this.time>=this.nextDoctor){const lane=Math.floor(this.random()*3);let at=this.distance+30;while(this.items.some(o=>o.type!=='coin'&&Math.abs(o.at-at)<9))at+=10;this.doctor={born:this.time,lane,at,dropped:false};this.nextDoctor=this.time+14;this.events.push({type:'doctor',lane})}
 if(this.doctor){if(!this.doctor.dropped&&this.time-this.doctor.born>=2.5){this.doctor.dropped=true;this.add('banana',this.doctor.lane,this.doctor.at);this.events.push({type:'banana',lane:this.doctor.lane})}if(this.time-this.doctor.born>6)this.doctor=null}
 for(const o of this.items){if(o.done||o.at<prev-.7||o.at>this.distance+.6)continue;if(Math.abs(this.x-LANES[o.lane])>.62)continue;
  if(o.type==='coin'){if(Math.abs(this.y-o.height)<1.05){o.done=true;this.coins++;this.events.push({type:'coin'});}}
  else if(this.y<(o.type==='banana'?.35:.85)&&this.invincible===0){o.done=true;this.hearts--;this.invincible=2.6;this.slow=.65;this.events.push({type:'bump',kind:o.type});if(this.hearts<=0){this.mode='over';this.events.push({type:'over'});break}}
 }
 this.items=this.items.filter(o=>o.at>this.distance-10&&!o.done);if(this.distance>=GOAL&&this.mode==='playing'){this.mode='won';this.events.push({type:'won'})}
 }
 drain(){const e=this.events;this.events=[];return e}
}
