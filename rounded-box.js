import {BoxGeometry,Vector3} from './vendor/build/three.module.js';
export class RoundedBoxGeometry extends BoxGeometry {
 constructor(w,h,d,segments=2,radius=.1){super(w,h,d,segments*2+1,segments*2+1,segments*2+1);const r=Math.min(radius,w/2,h/2,d/2),p=this.attributes.position,n=this.attributes.normal,v=new Vector3(),c=new Vector3(),delta=new Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);c.set(Math.max(-w/2+r,Math.min(w/2-r,v.x)),Math.max(-h/2+r,Math.min(h/2-r,v.y)),Math.max(-d/2+r,Math.min(d/2-r,v.z)));delta.subVectors(v,c).normalize();v.copy(c).addScaledVector(delta,r);p.setXYZ(i,v.x,v.y,v.z);n.setXYZ(i,delta.x,delta.y,delta.z)}p.needsUpdate=true;n.needsUpdate=true;this.computeBoundingSphere()}
}
