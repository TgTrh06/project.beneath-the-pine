import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CatmullRomCurve3, Color, DoubleSide, Group, InstancedMesh, Mesh, MeshBasicMaterial, Object3D, SphereGeometry, ConeGeometry, PlaneGeometry, Vector3 } from 'three';
import type { DayPhase, Weather } from './environment';
import { clamp01, dampAngle, dampMotion, easeMotion, loopFade, motionDelta, motionWindow } from './motion';
import { activityStrength, forestEventAt, forestNoise, retimeForest, windAt, type LifeLevel } from './forestActivity';

type Props = { animate: boolean; level: LifeLevel; phase: DayPhase; weather: Weather; close?: boolean; drift?: boolean };
const streamPoints = [[23,.038,4],[12,.038,-1],[5.8,.038,-6],[3.9,.038,-10],[5,.038,-14],[2,.038,-20],[-3,.038,-35],[-8,.038,-60],[-12,.038,-89]];
type Visit = NonNullable<ReturnType<typeof forestEventAt>>;

/** Small pooled geometry, one visitor at a time, and elapsed visible time only. */
export function ForestLife({ animate, level, phase, weather, close=false, drift=false }: Props) {
  const { camera, size, invalidate } = useThree();
  const elapsed=useRef(0),eventClock=useRef(0),previousLevel=useRef<LifeLevel>(level==='gentle'?'gentle':'lively');
  const damp=useRef(weather==='rain'?1:0),lastOffset=useRef(new Vector3()),driftOffset=useRef(new Vector3());
  const shown=useRef<Visit|null>(null),fadeMaterials=useRef(new Map<Group,MeshBasicMaterial[]>());
  const channels=useRef({strength:activityStrength(level),wind:windAt(0,weather),population:0,dust:0,flies:0,visit:0,wingSpeed:10,wingPhase:0,mistHeight:.18});
  const leaves=useRef<InstancedMesh>(null), motes=useRef<InstancedMesh>(null), flies=useRef<InstancedMesh>(null), drips=useRef<InstancedMesh>(null), current=useRef<InstancedMesh>(null), foam=useRef<InstancedMesh>(null);
  const visitor=useRef<Group>(null), wings=useRef<(Group|null)[]>([]), bird=useRef<Group>(null), birdHead=useRef<Group>(null), birdWings=useRef<(Group|null)[]>([]), flock=useRef<Group>(null), cone=useRef<Group>(null), mist=useRef<Group>(null), clouds=useRef<Group>(null);
  const r=useMemo(()=>({
    sphere:new SphereGeometry(1,8,6), cone:new ConeGeometry(1,1,7), plane:new PlaneGeometry(1,1), dummy:new Object3D(), p:new Vector3(), d:new Vector3(), offset:new Vector3(),cloudColor:new Color(),
    stream:new CatmullRomCurve3(streamPoints.map(p=>new Vector3(...p))),
    leaf:new MeshBasicMaterial({color:'#ae9b63',side:DoubleSide}), dust:new MeshBasicMaterial({color:'#e8d9a3',transparent:true,opacity:.35,depthWrite:false}),
    fly:new MeshBasicMaterial({color:'#d4e794',transparent:true,opacity:.75,depthWrite:false}), drop:new MeshBasicMaterial({color:'#bedcda',transparent:true,opacity:.4,depthWrite:false}),
    water:new MeshBasicMaterial({color:'#8fc4b7',transparent:true,opacity:.23,depthWrite:false,side:DoubleSide}), foam:new MeshBasicMaterial({color:'#bbd2bc',transparent:true,opacity:.32,depthWrite:false}),
    bark:new MeshBasicMaterial({color:'#6a4a31'}), bird:new MeshBasicMaterial({color:'#a78b60'}), wing:new MeshBasicMaterial({color:'#4d5641'}), eye:new MeshBasicMaterial({color:'#20281e'}),
    butterfly:new MeshBasicMaterial({color:'#d9b26b',side:DoubleSide}), cloud:new MeshBasicMaterial({color:'#d5e1d1',transparent:true,opacity:.075,depthWrite:false}), fog:new MeshBasicMaterial({color:'#b8ccbf',transparent:true,opacity:.035,depthWrite:false})
  }),[]);
  useEffect(()=>()=>{for(const value of Object.values(r))if('dispose' in value)value.dispose();},[r]);
  // Each visitor owns its fade materials; the permanent twig stays opaque.
  useEffect(()=>{
    const originals: {mesh:Mesh;material:MeshBasicMaterial}[]=[];
    const owned:MeshBasicMaterial[]=[];
    for(const group of [visitor.current,bird.current,flock.current,cone.current])if(group){
      const cache=new Map<MeshBasicMaterial,MeshBasicMaterial>();
      group.traverse(object=>{if(object instanceof Mesh&&object.material instanceof MeshBasicMaterial){
        const original=object.material;let material=cache.get(original);
        if(!material){material=original.clone();material.transparent=true;material.depthWrite=false;cache.set(original,material);owned.push(material);}
        originals.push({mesh:object,material:original});object.material=material;
      }});
      fadeMaterials.current.set(group,[...cache.values()]);
    }
    return ()=>{for(const {mesh,material}of originals)mesh.material=material;owned.forEach(m=>m.dispose());fadeMaterials.current.clear();};
  },[r]);
  // The camera owner has just fitted its new viewport. Reapply exactly one retained offset.
  useEffect(()=>{
    lastOffset.current.set(0,0,0);camera.position.add(driftOffset.current);lastOffset.current.copy(driftOffset.current);invalidate();
  },[size.width,size.height,camera,invalidate]);
  useEffect(()=>()=>{camera.position.sub(lastOffset.current);},[camera]);
  useFrame((_,delta)=>{
    if(!animate)return;
    const dt=motionDelta(delta);elapsed.current+=dt;
    if(level!==previousLevel.current&&level!=='still'){
      eventClock.current=retimeForest(eventClock.current,previousLevel.current,level);previousLevel.current=level;
    }
    eventClock.current+=dt;
    const t=elapsed.current,c=channels.current,mobile=size.width<760;
    const night=phase==='night'||phase==='dusk',wet=weather==='rain';
    c.strength=dampMotion(c.strength,activityStrength(level),2,dt);
    c.wind=dampMotion(c.wind,windAt(t,weather),1.5,dt);
    c.population=dampMotion(c.population,level==='lively'?(mobile?18:34):(mobile?8:15),3,dt);
    c.dust=dampMotion(c.dust,night||wet?0:1,1.5,dt);
    c.flies=dampMotion(c.flies,night&&!wet?1:0,1.5,dt);
    damp.current=wet?dampMotion(damp.current,1,1,dt):Math.max(0,damp.current-dt/85);
    const candidate=forestEventAt(eventClock.current,previousLevel.current,phase,weather);
    const matching=candidate&&shown.current?.kind===candidate.kind&&shown.current.slot===candidate.slot;
    if(candidate&&(!shown.current||matching||c.visit<.001))shown.current={...candidate};
    else if(shown.current){shown.current.age+=dt;shown.current.progress=clamp01(shown.current.age/shown.current.duration);}
    const same=candidate&&shown.current?.kind===candidate.kind&&shown.current.slot===candidate.slot;
    c.visit=dampMotion(c.visit,same?1:0,6,dt);
    if(!candidate&&c.visit<.001)shown.current=null;
    const event=shown.current,root=close?-2.2:-3.6,zRoot=close?-2.3:-4.5;
    const count=mobile?18:34;
    const population=(i:number)=>easeMotion(c.population-i);
    function fade(group:Group|null,weight:number){
      if(!group)return;group.visible=weight>.001;
      for(const material of fadeMaterials.current.get(group)??[])material.opacity=weight;
    }
    function place(pool:InstancedMesh|null,i:number,x:number,y:number,z:number,sx:number,sy=sx,sz=sx,rx=0,ry=0,rz=0){
      if(!pool)return;r.dummy.position.set(x,y,z);r.dummy.scale.set(sx,sy,sz);r.dummy.rotation.set(rx,ry,rz);r.dummy.updateMatrix();pool.setMatrixAt(i,r.dummy.matrix);
    }
    if(leaves.current){
      leaves.current.count=count;
      const shower=event?.kind==='needles'?Math.sin(event.progress*Math.PI)*c.visit:0;
      for(let i=0;i<count;i++){
        const n=forestNoise(i+2),q=(t*(.035+n*.035)+n)%1,fall=Math.min(1,q/.84);
        const weight=motionWindow(q,0,.88,.07)*population(i),height=(1-fall)*(close?3.8:7);
        const width=close?3:10,x=root+(forestNoise(i+60)-.5)*width+Math.sin(t*.45+i)*.13+fall*c.wind*.8;
        place(leaves.current,i,x,height+.04,zRoot+(forestNoise(i+90)-.5)*width,weight*(.014+n*.015)*(1+shower*.4),weight*(.06+n*.05),.01,t*.7+i,t*.4+i,t*.5+i);
      }leaves.current.instanceMatrix.needsUpdate=true;
    }
    if(motes.current){
      motes.current.count=count;
      for(let i=0;i<count;i++){
        const n=forestNoise(i+13),q=((t*.035+n*4)%3)/3,weight=loopFade(q)*population(i)*c.dust;
        place(motes.current,i,root+Math.sin(t*.035+i*2.4)*(close?2:7),.25+q*3,zRoot+Math.cos(t*.026+i*1.7)*(close?2:7),(.008+n*.012)*(.6+Math.sin(t*.2+i)*.4)*weight);
      }motes.current.instanceMatrix.needsUpdate=true;
    }
    if(flies.current){
      flies.current.count=Math.floor(count*.65);
      for(let i=0;i<flies.current.count;i++){
        const glow=.35+.65*Math.pow(.5+.5*Math.sin(t*1.1+i*2.7),2),weight=population(i/.65)*c.flies;
        place(flies.current,i,root+Math.sin(t*.14+i*2.3)*(close?1.4:5),.25+(.5+.5*Math.sin(t*.21+i))*1.4,zRoot+Math.cos(t*.11+i*1.9)*(close?1.4:5),(.012+forestNoise(i)*.012)*glow*weight);
      }flies.current.instanceMatrix.needsUpdate=true;
    }
    if(drips.current){
      drips.current.count=mobile?12:24;
      for(let i=0;i<drips.current.count;i++){
        const q=(t*(.43+forestNoise(i))+forestNoise(i+6))%1,weight=loopFade(q,.08)*damp.current;
        place(drips.current,i,root+(forestNoise(i+40)-.5)*5,(1-q)*3.2,zRoot-1.8-forestNoise(i+80)*2,.009*weight,.06*weight,.009*weight);
      }drips.current.instanceMatrix.needsUpdate=true;
    }
    if(current.current&&foam.current){
      current.current.count=close?12:28;foam.current.count=close?5:12;
      for(let i=0;i<current.current.count;i++){
        const q=(.08+forestNoise(i+33)*.65-t*.006)%1,u=q<0?q+1:q,weight=loopFade(u,.035);
        r.stream.getPoint(u,r.p);r.stream.getTangent(u,r.d);const edge=(forestNoise(i+72)-.5)*.7;
        place(current.current,i,r.p.x+edge,r.p.y,r.p.z,.018*weight,(.22+forestNoise(i)*.35)*weight,1,-Math.PI/2,0,Math.atan2(r.d.x,-r.d.z));
      }
      for(let i=0;i<foam.current.count;i++){
        const u=(forestNoise(i+100)-t*.004+100)%1,weight=loopFade(u,.035);r.stream.getPoint(u,r.p);
        place(foam.current,i,r.p.x+.23,r.p.y+.006,r.p.z,.025*weight,.008*weight,.05*weight);
      }current.current.instanceMatrix.needsUpdate=true;foam.current.instanceMatrix.needsUpdate=true;
    }
    const insect=event?.kind==='butterfly';
    fade(visitor.current,insect?c.visit*motionWindow(event.age,0,event.duration,2):0);
    if(visitor.current&&insect){
      const a=event.age,perch=motionWindow(a,7,20,3);
      visitor.current.position.set((root+1.1+Math.sin(a*.43)*.6)*(1-perch)+(root+1.45)*perch,(night?.75+Math.sin(a*.7)*.15:.6+Math.sin(a*.48)*.3)*(1-perch)+.57*perch,(zRoot+.65+Math.cos(a*.31)*.45)*(1-perch)+(zRoot-.6)*perch);
      visitor.current.scale.setScalar(night?.65:1);
      visitor.current.rotation.y=dampAngle(visitor.current.rotation.y,perch>.9?.6:a*.35,5,dt);
      c.wingSpeed=dampMotion(c.wingSpeed,(night?17:10)*(1-perch)+1.5*perch,5,dt);c.wingPhase+=c.wingSpeed*dt;
      wings.current.forEach((w,i)=>{if(w)w.rotation.z=(i?1:-1)*(.3+(.5-.5*Math.cos(c.wingPhase*2))*1.05);});
    }
    const visiting=event?.kind==='bird';
    fade(bird.current,visiting?c.visit*motionWindow(event.age,0,event.duration,1.2):0);
    if(bird.current&&visiting){
      const a=event.age,entry=1-easeMotion(a/5),exit=easeMotion((a-26)/5),fly=entry+exit,hop=motionWindow(a,14,16,1);
      bird.current.position.set(root+1.45-entry*3+exit*4,.53+fly*2.5+hop*.1,zRoot-.6+entry*2-exit*3);
      bird.current.rotation.y=dampAngle(bird.current.rotation.y,.5+Math.sin(a*.28)*.2,6,dt);
      if(birdHead.current){birdHead.current.rotation.y=Math.sin(a*.8)*.4;birdHead.current.rotation.x=Math.sin(a*5)*.3*motionWindow(a,10,15,1.2);}
      birdWings.current.forEach((w,i)=>{if(w)w.rotation.z=(i?1:-1)*(.15+fly*Math.sin(a*16)*.8);});
    }
    const flying=event?.kind==='flock';
    fade(flock.current,flying?c.visit*motionWindow(event.age,0,event.duration,1.5):0);
    if(flock.current&&flying){
      flock.current.position.set(-14+event.progress*28,(close?2.3:4)+Math.sin(event.progress*Math.PI)*(close?.3:.8),close?-2:-14);flock.current.scale.setScalar(close?.45:.8);
      flock.current.children.forEach((g,i)=>{g.position.y=Math.sin(t*3+i)*.15;g.children.forEach((w,j)=>{w.rotation.z=(j?1:-1)*Math.sin(t*7+i)*.65;});});
    }
    const falling=event?.kind==='cone';
    fade(cone.current,falling?c.visit*motionWindow(event.age,0,event.duration,.45):0);
    if(cone.current&&falling){
      const a=event.age,bounce=Math.max(0,a-1.5),y=.08+(a<1.5?4.5*(1-(a/1.5)**2):Math.sin(bounce*7)**2*Math.exp(-bounce*2)*.3);
      cone.current.position.set(root-1.2+easeMotion(a/2)*.3,y,zRoot+1.2);cone.current.rotation.set(easeMotion(a/2)*4,0,easeMotion(a/2));
    }
    const fogTarget=weather==='fog'?.045:wet?.018:.01*damp.current;
    r.fog.opacity=dampMotion(r.fog.opacity,fogTarget,1.5,dt);c.mistHeight=dampMotion(c.mistHeight,weather==='fog'?.65:.18,1.5,dt);
    if(mist.current){mist.current.visible=r.fog.opacity>.0002;mist.current.children.forEach((g,i)=>{g.position.x=Math.sin(t*.016+i)*4;g.position.z=-11-i*5;g.scale.set(9,c.mistHeight,2);});}
    const cloudTarget=phase==='night'||weather==='fog'?0:weather==='clear'?.12:.055;
    r.cloud.opacity=dampMotion(r.cloud.opacity,cloudTarget,1.5,dt);r.cloud.color.lerp(r.cloudColor.set(night?'#b8b5a6':'#e0e8de'),-Math.expm1(-1.5*dt));
    if(clouds.current){clouds.current.visible=r.cloud.opacity>.0002;clouds.current.children.forEach((g,i)=>{const q=((t*.09+i*19)%65)/65;g.position.x=-22+q*65;g.position.z=-26-i*7;g.scale.setScalar(loopFade(q,.1));});}
    const range=close?.055:.16;
    r.offset.set(drift?Math.sin(t*.037)*range*c.strength:0,drift?Math.sin(t*.023)*range*.35*c.strength:0,drift?Math.sin(t*.019)*range*.3*c.strength:0);
    driftOffset.current.lerp(r.offset,-Math.expm1(-1.8*dt));
    camera.position.sub(lastOffset.current).add(driftOffset.current);lastOffset.current.copy(driftOffset.current);
  });
  const root=close?-2.2:-3.6,zRoot=close?-2.3:-4.5;
  const form=(p:[number,number,number],s:[number,number,number],material:MeshBasicMaterial)=><mesh geometry={r.sphere} material={material} position={p} scale={s}/>;
  return <group name="session-forest-life">
    <instancedMesh name="forest-needles" ref={leaves} args={[r.plane,r.leaf,34]} count={0} frustumCulled={false}/>
    <instancedMesh name="forest-dust" ref={motes} args={[r.sphere,r.dust,34]} count={0} frustumCulled={false}/>
    <instancedMesh name="forest-fireflies" ref={flies} args={[r.sphere,r.fly,34]} count={0} frustumCulled={false}/>
    <instancedMesh name="forest-drips" ref={drips} args={[r.sphere,r.drop,24]} count={0} frustumCulled={false}/>
    <instancedMesh name="forest-current" ref={current} args={[r.plane,r.water,28]} count={0} frustumCulled={false}/>
    <instancedMesh name="forest-foam" ref={foam} args={[r.sphere,r.foam,12]} count={0} frustumCulled={false}/>
    <group name="forest-butterfly" ref={visitor} visible={false}>
      {form([0,0,0],[.012,.065,.012],r.bark)}
      {[-1,1].map((side,i)=><group key={side} ref={g=>{wings.current[i]=g}}><mesh geometry={r.sphere} material={r.butterfly} position={[side*.065,.015,0]} scale={[.065,.09,.008]}/>{form([side*.035,.09,0],[.04,.05,.009],r.wing)}</group>)}
    </group>
    {/* A small grounded twig gives a visitor a physical perch beside the roots. */}
    <mesh geometry={r.cone} material={r.bark} position={[root+1.45,.25,zRoot-.6]} scale={[.026,.5,.026]}/>
    <mesh geometry={r.sphere} material={r.bark} position={[root+1.49,.42,zRoot-.6]} scale={[.12,.016,.018]} rotation={[0,0,.55]}/>
    {[-1,1].map(side=><mesh key={side} geometry={r.sphere} material={r.wing} position={[root+1.45+side*.075,.38+side*.07,zRoot-.6]} scale={[.065,.025,.035]} rotation={[0,0,side*.7]}/>)}
    <group name="forest-bird" ref={bird} visible={false}>
      {form([0,.07,0],[.075,.095,.12],r.bird)}
      <group ref={birdHead} position={[0,.16,.06]}>{form([0,0,0],[.055,.06,.06],r.bird)}{form([0,-.01,.07],[.022,.018,.04],r.bark)}{[-1,1].map(side=><mesh key={side} geometry={r.sphere} material={r.eye} position={[side*.043,.014,.036]} scale={.009}/>)}</group>
      {[-1,1].map((side,i)=><group key={side} ref={g=>{birdWings.current[i]=g}} position={[side*.045,.09,0]}>{form([side*.05,0,-.02],[.065,.023,.12],r.wing)}</group>)}
      {form([0,.06,-.135],[.035,.02,.1],r.wing)}
    </group>
    <group name="forest-flock" ref={flock} visible={false}>{Array.from({length:5},(_,i)=><group key={i} position={[i*.6,0,-Math.abs(i-2)*.5]}>{[-1,1].map(side=><mesh key={side} geometry={r.sphere} material={r.wing} position={[side*.15,0,0]} scale={[.18,.025,.07]}/>)}</group>)}</group>
    <group name="forest-cone" ref={cone} visible={false}>{form([0,0,0],[.07,.13,.07],r.bark)}{[0,1,2,3].map(i=><group key={i}>{[-1,1].map(side=><mesh key={side} geometry={r.cone} material={r.bark} position={[side*.04,-.07+i*.045,0]} scale={[.05,.045,.055]} rotation={[0,i,side*.8]}/>)}</group>)}</group>
    <group ref={mist} visible={false}>{[0,1,2].map(i=><mesh key={i} geometry={r.sphere} material={r.fog} position={[0,.22,-11-i*5]} scale={[9,.5,2]}/>)}</group>
    <group ref={clouds} visible={false}>{[0,1,2].map(i=><group key={i} position={[0,19+i,-26-i*7]}>{[0,1,2].map(j=><mesh key={j} geometry={r.sphere} material={r.cloud} position={[j*2,Math.sin(j)*.4,0]} scale={[3,1.2,2]}/>)}</group>)}</group>
  </group>;
}
