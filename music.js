export class GameMusic {
 constructor(audio){this.audio=audio;audio.loop=true;audio.preload='auto';audio.volume=0;this.active=false;this.muted=false;this.duck=0}
 async unlock(){this.audio.muted=true;try{await this.audio.play()}catch{}finally{this.audio.pause();this.audio.currentTime=0;this.audio.muted=this.muted}}
 play(restart=false){this.active=true;if(restart){this.audio.currentTime=0;this.duck=0;this.audio.volume=0;}if(!this.muted)this.audio.play().catch(()=>{})}
 pause(){this.active=false;this.audio.pause()}
 mute(value){this.muted=value;this.audio.muted=value;if(value)this.audio.pause();else if(this.active)this.audio.play().catch(()=>{})}
 doctor(){this.duck=2.75}
 update(dt){this.duck=Math.max(0,this.duck-dt);const target=this.active&&!this.muted?(this.duck>0?.07:.26):0;this.audio.volume+=(target-this.audio.volume)*(1-Math.exp(-4*dt))}
}
