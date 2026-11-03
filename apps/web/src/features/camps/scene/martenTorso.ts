import {BufferGeometry,CatmullRomCurve3,Color,Float32BufferAttribute,Vector3} from 'three';
import {martenTorsoParts,type MartenShape} from './martenPoses';
/** A continuous skin through the four anatomical control volumes. All profiles share topology. */
export function createMartenTorso(kind:MartenShape['torso']){
 const parts=martenTorsoParts[kind],upright=kind==='upright',centres=parts.map(p=>new Vector3(...p.p));
 const start=centres[0].clone().sub(centres[1]).normalize().multiplyScalar((upright?parts[0].s[1]:parts[0].s[2])*.8).add(centres[0]);
 const end=centres[3].clone().sub(centres[2]).normalize().multiplyScalar((upright?parts[3].s[1]:parts[3].s[2])*.8).add(centres[3]);
 const curve=new CatmullRomCurve3([start,...centres,end]),radii=new CatmullRomCurve3([new Vector3(.015,.015,0),...parts.map(p=>new Vector3(p.s[0]*.94,(upright?p.s[2]:p.s[1])*.94,0)),new Vector3(.015,.015,0)]);
 const vertices:number[]=[],colors:number[]=[],indices:number[]=[],rows=40,sides=24,reference=upright?new Vector3(0,0,1):new Vector3(0,1,0);
 const back=new Color('#69482f'),fur=new Color('#80583b'),belly=new Color('#ad885b');
 for(let j=0;j<=rows;j++){const t=j/rows,c=curve.getPoint(t),d=curve.getTangent(t),n=new Vector3().crossVectors(d,reference).normalize(),b=new Vector3().crossVectors(n,d).normalize(),r=radii.getPoint(t);
  for(let k=0;k<=sides;k++){const angle=k*Math.PI*2/sides,p=c.clone().addScaledVector(n,Math.cos(angle)*r.x).addScaledVector(b,Math.sin(angle)*r.y);vertices.push(p.x,p.y,p.z);const shade=upright?-Math.sin(angle):Math.sin(angle),color=fur.clone().lerp(shade>0?back:belly,Math.abs(shade)**2*(shade>0?.65:.55));colors.push(color.r,color.g,color.b);if(j<rows&&k<sides){const a=j*(sides+1)+k;indices.push(a,a+sides+1,a+1,a+1,a+sides+1,a+sides+2);}}
 }

 // Short tapered locks follow the coat from shoulders toward the hips.
 // Fixed sampling gives every pose family identical morph topology.
 for(let row=5;row<=35;row+=2)for(let col=0;col<24;col+=3){
  const t=(row+.45*Math.sin(row*7+col))/rows,angle=(col+.8*Math.sin(row*4+col))*Math.PI*2/sides;
  const c=curve.getPoint(t),d=curve.getTangent(t),n=new Vector3().crossVectors(d,reference).normalize(),b=new Vector3().crossVectors(n,d).normalize(),r=radii.getPoint(t);
  const outward=n.clone().multiplyScalar(Math.cos(angle)).addScaledVector(b,Math.sin(angle)).normalize(),across=new Vector3().crossVectors(d,outward).normalize();
  const root=c.clone().addScaledVector(n,Math.cos(angle)*r.x).addScaledVector(b,Math.sin(angle)*r.y),start=vertices.length/3;
  const shade=upright?-Math.sin(angle):Math.sin(angle),color=fur.clone().lerp(shade>0?back:belly,Math.abs(shade)**2*(shade>0?.65:.55)).multiplyScalar(.99+.02*(.5+.5*Math.sin(row*3+col)));
  // Rounded overlapping locks with short swept tips, rather than long spines.
  for(let ring=0;ring<4;ring++){const u=ring/3,width=[.035,.04,.025,.003][ring]*(.8+.35*(.5+.5*Math.sin(row*13+col*7))),centre=root.clone().addScaledVector(outward,-.012+.046*Math.sin(u*Math.PI/2)).addScaledVector(d,u*.065);
   for(let k=0;k<=6;k++){const a=k*Math.PI/3,p=centre.clone().addScaledVector(across,Math.cos(a)*width).addScaledVector(d,Math.sin(a)*width*.75);vertices.push(p.x,p.y,p.z);colors.push(color.r,color.g,color.b);if(ring<3&&k<6){const i=start+ring*7+k;indices.push(i,i+1,i+7,i+1,i+8,i+7);}}}

 }
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));g.setAttribute('color',new Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
