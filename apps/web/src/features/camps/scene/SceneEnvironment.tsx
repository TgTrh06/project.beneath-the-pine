import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BufferGeometry, CatmullRomCurve3, Color, DirectionalLight, Float32BufferAttribute, Fog, Group, HemisphereLight, LineBasicMaterial, PointLight, Vector3, Mesh, MeshBasicMaterial } from 'three';
import { environmentTarget, type DayPhase, type Weather } from './environment';

export function Environment({ phase, weather, animate, solo = false, mirrored = false, viewDistanceOffset = 0 }: { phase: DayPhase; weather: Weather; animate: boolean; solo?: boolean; mirrored?: boolean; viewDistanceOffset?: number }) {
  const { scene, gl, invalidate } = useThree();
  const sun = useRef<DirectionalLight>(null), fill = useRef<DirectionalLight>(null), hemi = useRef<HemisphereLight>(null), fire = useRef<PointLight>(null);
  const lanterns = useRef<Group>(null), transition = useRef(0), shadowElapsed = useRef(0), initialized = useRef(false);
  const target = useMemo(() => {
    const p = environmentTarget(phase, weather);
    return { ...p, fogNear: p.fogNear + viewDistanceOffset, fogFar: p.fogFar + viewDistanceOffset, skyColor: new Color(p.sky), sunColor: new Color(p.sun), ambientColor: new Color(p.ambient), groundColor: new Color(p.ground), sunPosition: new Vector3(...p.position as [number, number, number]) };
  }, [phase, weather, viewDistanceOffset]);
  const currentFire = useRef(target.fire);
  function apply(a: number) {
    if (!sun.current || !fill.current || !hemi.current) return;
    (scene.background as Color).lerp(target.skyColor, a);
    const fog = scene.fog as Fog;
    fog.color.lerp(target.skyColor, a); fog.near += (target.fogNear - fog.near) * a; fog.far += (target.fogFar - fog.far) * a;
    sun.current.color.lerp(target.sunColor, a); sun.current.intensity += (target.power - sun.current.intensity) * a; sun.current.position.lerp(target.sunPosition, a);
    fill.current.intensity += (target.fill - fill.current.intensity) * a;
    hemi.current.color.lerp(target.ambientColor, a); hemi.current.groundColor.lerp(target.groundColor, a); hemi.current.intensity += (target.hemi - hemi.current.intensity) * a;
    currentFire.current += (target.fire - currentFire.current) * a;
    if (fire.current) fire.current.intensity = solo ? 0 : currentFire.current;
    lanterns.current?.children.forEach(child => { const light = child as PointLight; light.intensity += (target.lantern - light.intensity) * a; });
  }
  useEffect(() => {
    if (!animate || !initialized.current) { apply(1); gl.shadowMap.needsUpdate = true; transition.current = 0; }
    else transition.current = 8;
    initialized.current = true; invalidate();
  }, [target, animate, gl, invalidate]);
  useFrame(({ clock }, delta) => {
    if (!animate) return;
    if (transition.current > 0) {
      const dt = Math.min(delta, .1); transition.current = Math.max(0, transition.current - dt);
      apply(transition.current === 0 ? 1 : 1 - Math.exp(-dt * .65));
      shadowElapsed.current += dt;
      if (shadowElapsed.current > .25 || transition.current === 0) { gl.shadowMap.needsUpdate = true; shadowElapsed.current = 0; }
    }
    if (fire.current) fire.current.intensity = solo ? 0 : currentFire.current + Math.sin(clock.elapsedTime * 2) * 1.2;
  });
  return <>
    <color attach="background" args={['#1c3535']} /><fog attach="fog" args={['#1c3535', 22, 68]} />
    <hemisphereLight ref={hemi} args={['#b5d2cc', '#4d4b2e', 1.4]} />
    <directionalLight ref={sun} position={[-6, 20, -5]} color="#badcd6" intensity={2.2} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={18} shadow-camera-bottom={-12} shadow-camera-far={65} shadow-normalBias={.035} />
    <directionalLight ref={fill} position={[3,8,7]} color="#d9c9a0" intensity={1.1} />
    <pointLight ref={fire} position={[0,1.37,0]} color="#ffc078" intensity={30} distance={12} decay={2} />
    <group ref={lanterns} scale={[mirrored ? -1 : 1,1,1]}>{solo ? <pointLight position={[-.6,.7,-1.45]} color="#ffd69a" intensity={3} distance={7} /> : <><pointLight position={[-4.8,.6,-1]} color="#ffd69a" intensity={3} distance={5} /><pointLight position={[4.3,.6,2.2]} color="#ffd69a" intensity={3} distance={5} /></>}</group>
  </>;
}

export function Rain({ weather, animate }: { weather: Weather; animate: boolean }) {
  const material = useRef<LineBasicMaterial>(null), ripples = useRef<Group>(null), opacity = useRef(0), elapsed = useRef(0);
  const drops = useMemo(() => Array.from({length:220}, (_, i) => {
    let x = ((i * 7.137) % 30) - 13, z = ((i * 5.731) % 28) - 20;
    // Shelter the people and the ancient pine's immediate canopy footprint.
    if (Math.hypot(x,z) < 4.8 || Math.hypot(x+3.6,z+5.2) < 6.8) x += 12;
    return [x,z,(i*.713)%12];
  }), []);
  const geometry = useMemo(() => { const g = new BufferGeometry(); g.setAttribute('position',new Float32BufferAttribute(new Float32Array(drops.length*6),3)); return g; }, [drops]);
  const water = useMemo(() => {
    const curve = new CatmullRomCurve3([[23,.035,4],[12,.035,-1],[5.8,.035,-6],[3.9,.035,-10],[5,.035,-14],[2,.035,-20],[-3,.035,-35],[-8,.035,-60],[-12,.035,-89]].map(p=>new Vector3(...p)));
    return Array.from({length:14}, (_,i)=>curve.getPoint(.14+i*.025));
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => { if (!animate) { opacity.current=0; if(material.current)material.current.opacity=0; if(ripples.current)ripples.current.visible=false; } }, [animate]);
  useFrame((_, delta) => {
    if(!animate || !material.current)return;
    const dt=Math.min(delta,.1); elapsed.current+=dt;
    opacity.current += ((weather==='rain'?.38:0)-opacity.current)*(1-Math.exp(-dt*.65));
    material.current.opacity=opacity.current;
    if(ripples.current)ripples.current.visible=opacity.current>.005;
    if(opacity.current<.005)return;
    const positions=geometry.getAttribute('position');
    drops.forEach(([x,z,offset],i)=>{const y=12-((elapsed.current*5+offset)%12);positions.setXYZ(i*2,x,y,z);positions.setXYZ(i*2+1,x+.07,y+.4,z);});
    positions.needsUpdate=true;
    ripples.current?.children.forEach((child,i)=>{const mesh=child as Mesh,progress=(elapsed.current*.65+i*.173)%1;mesh.scale.setScalar(.08+progress*.3);(mesh.material as MeshBasicMaterial).opacity=(1-progress)*opacity.current;});
  });
  return <><lineSegments geometry={geometry} frustumCulled={false} renderOrder={1}><lineBasicMaterial ref={material} color="#b8d1d6" transparent opacity={0} depthWrite={false} /></lineSegments>
    <group ref={ripples} visible={false}>{water.map((p,i)=><mesh key={i} position={p} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.85,1,16]} /><meshBasicMaterial color="#9abcb8" transparent opacity={0} depthWrite={false} /></mesh>)}</group></>;
}
