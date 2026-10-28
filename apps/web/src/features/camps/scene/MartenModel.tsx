import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Mesh, Quaternion, SphereGeometry, MeshStandardMaterial, Vector3, BufferGeometry, Float32BufferAttribute, CatmullRomCurve3 } from 'three';
import { resolveMartenPose, martenShapes, martenTorsoParts, type MartenPose } from './martenPoses';
import { createMartenFurTuft } from './martenFur';
import { createMartenTorso } from './martenTorso';
export type { MartenPose } from './martenPoses';
type V=[number,number,number];
const colors={fur:'#80583b',back:'#69482f',cheek:'#98704b',bib:'#dfc38a',belly:'#ad885b',paw:'#4d392a',nose:'#29221e',ear:'#c49b74',eye:'#181c18',shine:'#fff1d4',whisker:'#c9b58e'};

export function MartenModel({animate,pose='sit',sleeping=false,ambient=false}:{animate:boolean;pose?:MartenPose;sleeping?:boolean;ambient?:boolean}){
 const body=useRef<Group>(null),head=useRef<Group>(null),neck=useRef<Mesh>(null),paws=useRef<(Group|null)[]>([]),legs=useRef<(Mesh|null)[]>([]),eyes=useRef<(Group|null)[]>([]),ears=useRef<(Group|null)[]>([]);
 const elapsed=useRef(0),initialized=useRef(false),shadowElapsed=useRef(0);
 const gl=useThree(state=>state.gl);
 useEffect(()=>{gl.shadowMap.needsUpdate=true;},[gl,animate,pose,sleeping]);
 const tailCurve=useMemo(()=>new CatmullRomCurve3(martenShapes[pose].tail.map(p=>new Vector3(...p))),[]);
 const tailGeometry=useMemo(()=>{const g=new BufferGeometry(),indices=[];g.setAttribute('position',new Float32BufferAttribute(new Float32Array(33*17*3),3));for(let j=0;j<32;j++)for(let k=0;k<16;k++){const a=j*17+k;indices.push(a,a+17,a+1,a+1,a+17,a+18);}g.setIndex(indices);return g;},[]);
 const tailVectors=useMemo(()=>({p:new Vector3(),d:new Vector3(),n:new Vector3(),b:new Vector3(),v:new Vector3(),up:new Vector3(0,1,0)}),[]);
 const torsoResources=useMemo(()=>{
  const profiles={long:createMartenTorso('long'),upright:createMartenTorso('upright'),curled:createMartenTorso('curled')},geometry=profiles.long.clone();
  const slice=(start:number,end:number)=>{const part=new BufferGeometry();for(const name of ['position','normal','color'])part.setAttribute(name,geometry.getAttribute(name));part.setIndex(Array.from(geometry.index!.array).slice(start,end));return part;};
  return {profiles,geometry,skin:slice(0,40*24*6),coat:slice(40*24*6,geometry.index!.count),material:new MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.96})};
 },[]);
 const resources=useMemo(()=>({geometry:new SphereGeometry(1,20,14),furGeometry:createMartenFurTuft(),materials:Object.fromEntries(Object.entries(colors).map(([key,color])=>[key,new MeshStandardMaterial({color,roughness:.96})]))}),[]);
 useEffect(()=>()=>{tailGeometry.dispose();Object.values(torsoResources.profiles).forEach(g=>g.dispose());torsoResources.geometry.dispose();torsoResources.skin.dispose();torsoResources.coat.dispose();torsoResources.material.dispose();resources.geometry.dispose();resources.furGeometry.dispose();Object.values(resources.materials).forEach(m=>m.dispose());},[resources]);
 const vectors=useMemo(()=>({a:new Vector3(),b:new Vector3(),d:new Vector3(),up:new Vector3(0,1,0),q:new Quaternion()}),[]);
 const form=(p:V,s:V,c:keyof typeof colors,r:V=[0,0,0])=><mesh geometry={resources.geometry} material={resources.materials[c]} position={p} scale={s} rotation={r} castShadow receiveShadow/>;
 function link(mesh:Mesh|null,a:Vector3,b:Vector3,width:number,alpha:number){if(!mesh)return;vectors.d.subVectors(b,a);vectors.q.setFromUnitVectors(vectors.up,vectors.d.clone().normalize());mesh.position.lerp(vectors.d.copy(a).add(b).multiplyScalar(.5),alpha);mesh.quaternion.slerp(vectors.q,alpha);mesh.scale.lerp(vectors.d.set(width,Math.max(.01,a.distanceTo(b)*.62),width),alpha);}
 useFrame((_,delta)=>{
  if(animate){elapsed.current+=Math.min(delta,.05);shadowElapsed.current+=Math.min(delta,.05);if(shadowElapsed.current>.25){gl.shadowMap.needsUpdate=true;shadowElapsed.current=0;}}
  const t=elapsed.current,selected=resolveMartenPose(pose,sleeping,ambient,animate,t);
  const shape=martenShapes[selected],parts=martenTorsoParts[shape.torso],asleep=shape.eyes===0;
  const alpha=!initialized.current||!animate?1:1-Math.exp(-Math.min(delta,.05)*3.5);
  initialized.current=true;
  const breath=animate?Math.sin(t*(asleep?1.35:1.9))*.007:0;
  if(body.current){body.current.position.lerp(vectors.a.set(...shape.body),alpha);body.current.scale.lerp(vectors.a.set(shape.scale[0],shape.scale[1]*(1+breath),shape.scale[2]),alpha);vectors.q.setFromEuler(body.current.rotation.clone().set(...shape.rotation));body.current.quaternion.slerp(vectors.q,alpha);}
  const profile=torsoResources.profiles[shape.torso];
  for(const name of ['position','color']){const dest=torsoResources.geometry.getAttribute(name),source=profile.getAttribute(name);for(let i=0;i<dest.array.length;i++)dest.array[i]+=(source.array[i]-dest.array[i])*alpha;dest.needsUpdate=true;}
  torsoResources.geometry.computeVertexNormals();torsoResources.geometry.computeBoundingSphere();torsoResources.skin.boundingSphere=torsoResources.geometry.boundingSphere;torsoResources.coat.boundingSphere=torsoResources.geometry.boundingSphere;
  body.current?.updateMatrix();
  if(head.current){head.current.position.lerp(vectors.a.set(...shape.head),alpha);const yaw=animate&&!asleep?Math.sin(t*.31)*.045:0;const groom=animate&&selected==='groom'?Math.sin(t*3)*.055:0;vectors.q.setFromEuler(head.current.rotation.clone().set(shape.headRotation[0]+groom,shape.headRotation[1]+yaw,shape.headRotation[2]));head.current.quaternion.slerp(vectors.q,alpha);}
  const blink=animate&&!asleep&&t%5.7>5.48?Math.max(.05,Math.abs((t%5.7-5.59)/.11)):1;
  eyes.current.forEach(e=>{if(e)e.scale.y+=((asleep?.06:shape.eyes*blink)-e.scale.y)*alpha;});
  ears.current.forEach((e,i)=>{if(e)e.rotation.z=animate&&!asleep?Math.sin(t*.7+i*2)*.035:0;});
  paws.current.forEach((p,i)=>{const target=shape.paws[i];if(!p)return;p.position.lerp(vectors.a.set(target[0],target[1]+(animate&&selected==='groom'&&i===1?Math.sin(t*3)*.015:0),target[2]),alpha);const part=parts[i<2?0:3];vectors.a.set((i%2?1:-1)*part.s[0]*.7,part.p[1]-.16,part.p[2]);if(body.current)vectors.a.applyMatrix4(body.current.matrix);link(legs.current[i],vectors.a,vectors.b.copy(p.position),i<2?.038:.052,alpha);});
  tailCurve.points.forEach((p,i)=>{const target=shape.tail[i];p.lerp(tailVectors.p.set(target[0]+(animate&&!asleep?Math.sin(t*.6+i*.3)*.009:0),target[1],target[2]),alpha);});
  const positions=tailGeometry.getAttribute('position');
  for(let j=0;j<=32;j++){const u=j/32;tailCurve.getPoint(u,tailVectors.p);tailCurve.getTangent(u,tailVectors.d);tailVectors.n.crossVectors(tailVectors.d,tailVectors.up).normalize();tailVectors.b.crossVectors(tailVectors.n,tailVectors.d).normalize();const radius=.117*Math.pow(1-u,.7)+.006;
   for(let k=0;k<=16;k++){const a=k*Math.PI*2/16;tailVectors.v.copy(tailVectors.p).addScaledVector(tailVectors.n,Math.cos(a)*radius*(1+.008*Math.sin(u*77+a*3))).addScaledVector(tailVectors.b,Math.sin(a)*radius*(1+.008*Math.sin(u*77+a*3)));positions.setXYZ(j*17+k,tailVectors.v.x,tailVectors.v.y,tailVectors.v.z);}}
  positions.needsUpdate=true;tailGeometry.computeVertexNormals();tailGeometry.computeBoundingSphere();
  if(head.current&&body.current){vectors.a.set(...parts[0].p).applyMatrix4(body.current.matrix);link(neck.current,vectors.a,vectors.b.copy(head.current.position),.075,alpha);}
 });
 return <group dispose={null}>
  <group ref={body}><mesh geometry={torsoResources.skin} material={torsoResources.material} castShadow receiveShadow/><mesh geometry={torsoResources.coat} material={torsoResources.material}/></group>
  <mesh ref={neck} geometry={resources.geometry} material={resources.materials.fur} castShadow/>
  {Array.from({length:4},(_,i)=><group key={i}><mesh ref={e=>{legs.current[i]=e}} geometry={resources.geometry} material={resources.materials.fur} castShadow/><group ref={e=>{paws.current[i]=e}}>{form([0,0,.02],[.052,.035,.084],'paw')}{[0,1,2].map(k=><group key={k}>{form([-.028+k*.028,-.005,.077],[.014,.016,.018],'paw')}{form([-.028+k*.028,-.006,.091],[.005,.005,.013],'belly')}</group>)}</group></group>)}
  <mesh geometry={tailGeometry} material={resources.materials.back} castShadow receiveShadow/>
  <group ref={head}>
   {form([0,-.075,-.015],[.098,.145,.09],'fur')}
   {/* Irregular bib lobes stay on the neck, following the head as it turns. */}
   {[-1,0,1].map(i=><group key={i}>{form([i*.036,-.105,.063],[.045,.065-Math.abs(i)*.012,.035],'bib')}</group>)}
   {/* Small swept locks soften the cheeks and bib silhouette. */}
   {[-1,1].map(side=><group key={side}>
    {[0,1,2,3].map(i=><mesh key={i} geometry={resources.furGeometry} material={resources.materials.cheek} position={[side*(.093-i*.006),-.005-i*.018,.015+i*.014]} scale={[.045,.034+i*.004,.035]} rotation={[.1,side*.3,side*(1.8+i*.14)]} castShadow/>)}
    {[0,1,2].map(i=><mesh key={i} geometry={resources.furGeometry} material={resources.materials.bib} position={[side*(.025+i*.019),-.14+i*.013,.075]} scale={[.039,.04,.025]} rotation={[.2,0,side*(2.5+i*.12)]} castShadow/>)}
   </group>)}
   {form([0,0,0],[.117,.112,.123],'cheek')}{form([0,-.028,.1],[.082,.062,.11],'belly')}{form([0,-.018,.192],[.035,.025,.024],'nose')}{form([-.009,-.008,.211],[.008,.005,.004],'shine')}{form([0,-.064,.159],[.039,.005,.024],'paw')}
   {[-1,1].map((side,i)=><group key={side}>
    <group ref={e=>{ears.current[i]=e}} position={[side*.092,.091,-.025]}>{form([0,0,0],[.054,.061,.028],'back')}{form([0,.003,.023],[.032,.039,.009],'ear')}{form([0,.012,.025],[.021,.024,.007],'belly')}</group>
    {form([side*.069,.038,.087],[.038,.025,.022],'back')}
    <group ref={e=>{eyes.current[i]=e}} position={[side*.069,.024,.101]}>{form([0,0,0],[.023,.027,.014],'eye')}{form([-.006,.009,.013],[.006,.007,.004],'shine')}</group>
    {[0,1,2].map(k=><group key={k} rotation={[0,0,side*(.08+k*.1)]}>{form([side*(.085+k*.006),-.035+k*.012,.156],[.068,.0014,.0014],'whisker')}</group>)}
   </group>)}
  </group>
 </group>;
}
