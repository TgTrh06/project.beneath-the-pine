import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import { ACESFilmicToneMapping, Group, Mesh, MeshStandardMaterial, OrthographicCamera, PCFSoftShadowMap } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { appearanceIndex, wandererColors, type LodgeMember } from './lodgeState';
import { Environment, Rain } from './SceneEnvironment';
import type { DayPhase, Weather } from './environment';
import { SoloRest } from './SoloRest';

type Props = {
  solo?: boolean;
  attempt: number;
  phase: DayPhase; weather: Weather;
  members: LodgeMember[]; selected: string[]; animate: boolean; visible: boolean;
  onMember: (id: string) => void; onCompose?: () => void; onPacts: () => void;
  onReady: () => void; onFailure: () => void;
};

function Pebble({ at, scale, color, rotation }: { at: [number, number, number]; scale: [number, number, number]; color: string; rotation?: [number, number, number] }) {
  return <mesh position={at} scale={scale} rotation={rotation} castShadow><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color={color} roughness={.9} /></mesh>;
}

function Wanderer({ member, seat, chosen, animate, onClick }: { member: LodgeMember; seat: number; chosen: boolean; animate: boolean; onClick: () => void }) {
  const body = useRef<Group>(null);
  const head = useRef<Group>(null);
  const phase = appearanceIndex(member.accountId);
  const coat = wandererColors[phase];
  const angle = [0, 4, 2, 6, 1, 5, 3, 7][seat] * Math.PI / 4;
  const skin = ['#d7aa83', '#ae7e5e', '#e2bc94', '#b78b6e'][phase % 4];
  const hair = ['#3d3028', '#70513b', '#aa8054', '#4c3830'][phase % 4];
  useFrame(({ clock }) => {
    if (!animate) return;
    if (body.current) body.current.scale.y = 1 + Math.sin(clock.elapsedTime * 1.1 + phase) * .009;
    if (head.current) head.current.rotation.z = Math.sin(clock.elapsedTime * .35 + phase) * .035;
  });
  useEffect(() => { if (!animate) { if (body.current) body.current.scale.y = 1; if (head.current) head.current.rotation.z = 0; } }, [animate]);
  return <group position={[Math.sin(angle) * 2.8, .67, Math.cos(angle) * 2.8]} rotation={[0, angle + Math.PI, 0]} onClick={(event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); onClick(); }}>
    {chosen && <mesh position={[0, -.61, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.4, .47, 32]} /><meshBasicMaterial color="#f2d99a" /></mesh>}
    <group ref={body}>
      <Pebble at={[0, .32, 0]} scale={[.29, .4, .23]} color={coat} />
      <mesh position={[0, .13, 0]}><cylinderGeometry args={[.25, .33, .38, 16]} /><meshStandardMaterial color={coat} roughness={1} /></mesh>
      <Pebble at={[-.17, -.05, .22]} scale={[.12, .13, .32]} color="#45433c" />
      <Pebble at={[.17, -.05, .22]} scale={[.12, .13, .32]} color="#45433c" />
      {[-1, 1].map(side => <group key={side}>
        <Pebble at={[side * .17, -.28, .44]} scale={[.105, .28, .11]} color="#45433c" />
        <Pebble at={[side * .17, -.5, .5]} scale={[.13, .1, .19]} color="#3a2c25" />
        <Pebble at={[side * .3, .28, .09]} scale={[.11, .27, .13]} color={coat} rotation={[.45, 0, side * .16]} />
        <Pebble at={[side * .27, .1, .24]} scale={[.085, .085, .11]} color={skin} />
      </group>)}
      <mesh position={[0, .54, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.19, .065, 8, 20]} /><meshStandardMaterial color={phase % 2 ? '#d9bd7d' : '#c49a72'} /></mesh>
      <Pebble at={[.12, .35, .235]} scale={[.075, .23, .04]} color={phase % 2 ? '#d9bd7d' : '#c49a72'} />
      <group ref={head} position={[0, .75, 0]}>
        <Pebble at={[0, 0, 0]} scale={[.235, .26, .22]} color={skin} />
        <Pebble at={[0, .12, -.025]} scale={[.245, .19, .225]} color={hair} />
        <Pebble at={[-.23, -.01, 0]} scale={[.045, .065, .045]} color={skin} />
        <Pebble at={[.23, -.01, 0]} scale={[.045, .065, .045]} color={skin} />
        <Pebble at={[0, -.04, .214]} scale={[.038, .045, .035]} color={skin} />
        {[-1, 1].map(side => <Pebble key={side} at={[side * .082, .008, .202]} scale={[.019, .025, .014]} color="#332920" />)}
        {phase % 3 === 0 && <><Pebble at={[0, .22, -.01]} scale={[.25, .16, .24]} color={coat} /><Pebble at={[0, .39, -.01]} scale={[.075, .075, .075]} color="#dfcda1" /></>}
      </group>
    </group>
  </group>;
}

export function Marten({ animate }: { animate: boolean }) {
  const head = useRef<Group>(null);
  useFrame(({ clock }) => { if (animate && head.current) head.current.rotation.y = Math.sin(clock.elapsedTime * .3) * .13; });
  useEffect(() => { if (!animate && head.current) head.current.rotation.y = 0; }, [animate]);
  return <group position={[-2.7, .3, -2]} rotation={[0, -.7, 0]}>
    <Pebble at={[.06, 0, 0]} scale={[.35, .19, .23]} color="#80502f" />
    <Pebble at={[.35, -.02, -.12]} scale={[.38, .11, .13]} color="#684128" rotation={[0, -.6, 0]} />
    <group ref={head} position={[-.19, .14, .12]}>
      <Pebble at={[0, 0, 0]} scale={[.17, .17, .16]} color="#94623a" />
      <Pebble at={[0, -.075, .12]} scale={[.12, .085, .1]} color="#dfc799" />
      <Pebble at={[0, -.045, .21]} scale={[.03, .025, .025]} color="#39291f" />
      {[-1, 1].map(side => <group key={side}><Pebble at={[side * .13, .13, 0]} scale={[.075, .08, .055]} color="#80502f" /><Pebble at={[side * .075, .01, .142]} scale={[.017, .023, .013]} color="#2e251e" /></group>)}
    </group>
  </group>;
}

function Hearth({ animate }: { animate: boolean }) {
  const flames = useRef<Group>(null);
  const sparks = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!animate) return;
    if (flames.current) flames.current.children.forEach((child, i) => {
      child.scale.y = 1 + Math.sin(clock.elapsedTime * 3 + i * 2) * .15;
      child.rotation.z = Math.sin(clock.elapsedTime * 1.7 + i) * .08;
    });
    sparks.current?.children.forEach((child, i) => {
      const progress = (clock.elapsedTime * .12 + i / 9) % 1;
      child.position.set(Math.sin(i * 2.4 + progress * 3) * .3, .6 + progress * 2, Math.cos(i * 2.4) * .25);
      child.scale.setScalar(Math.sin(progress * Math.PI) * .018);
    });
  });
  return <group position={[0, .27, 0]}>
    <group ref={flames}>{[-2, -1, 0, 1, 2].map(n => <group key={n} position={[n * .14, 0, Math.abs(n) * .06]}>
      <mesh position={[0, .42, 0]} scale={[.2, .6 - Math.abs(n) * .11, .17]} rotation={[0, 0, -n * .1]}><coneGeometry args={[1, 2, 9]} /><meshBasicMaterial color={n % 2 ? '#f39836' : '#ffc665'} /></mesh>
      <mesh position={[0, .2, .09]} scale={[.1, .3, .1]}><coneGeometry args={[1, 2, 9]} /><meshBasicMaterial color="#ffedba" /></mesh>
    </group>)}</group>
    {animate && <group ref={sparks}>{Array.from({ length: 9 }, (_, i) => <mesh key={i} scale={0}><sphereGeometry args={[1, 5, 4]} /><meshBasicMaterial color="#ffd291" /></mesh>)}</group>}
  </group>;
}

export function WindBranches({ animate, weather }: { animate: boolean; weather: Weather }) {
  const branches = useRef<Group>(null);
  useFrame(({ clock }) => { if (animate && branches.current) branches.current.rotation.z = Math.sin(clock.elapsedTime * .45) * (weather==='rain'?.022:.012); });
  useEffect(()=>{if(!animate && branches.current)branches.current.rotation.z=0;},[animate]);
  return <group ref={branches} position={[-3.6, 9.7, -5.2]}>
    {[0, 1, 2, 3].map(i => <mesh key={i} position={[3.4 + i * 1.05, i * .15, 1.1]} rotation={[0, i, -.1]}><coneGeometry args={[1.7 - i * .1, 2.3, 9]} /><meshStandardMaterial color={i % 2 ? '#315540' : '#41634a'} roughness={1} /></mesh>)}
  </group>;
}

export function Room({ onReady, attempt, weather, animate, solo }: { onReady: () => void; attempt: number; weather: Weather; animate: boolean; solo?: boolean }) {
  const gltf = useLoader(GLTFLoader, `${solo?'/solo/pine-solo.glb':'/camp/pine-camp.glb'}${attempt ? `?retry=${attempt}` : ''}`);
  const room = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse(object => { if (object instanceof Mesh) { object.castShadow = true; object.receiveShadow = true;
      // The cached GLB is shared: weather only changes this instance's materials.
      object.material = Array.isArray(object.material) ? object.material.map(m=>m.clone()) : object.material.clone();
    } });
    return clone;
  }, [gltf]);
  const gl = useThree(state => state.gl);
  const invalidate = useThree(state => state.invalidate);
  const wet = useRef(weather === 'rain' ? 1 : 0);
  const surfaces = useMemo(() => {
    const result: { material: MeshStandardMaterial; color: MeshStandardMaterial['color']; roughness: number }[] = [];
    room.traverse(object => { if(object instanceof Mesh) for(const m of (Array.isArray(object.material)?object.material:[object.material])) {
      // Darken exposed earth, bridge and rocks; leave sheltered bark/people alone.
      if(m instanceof MeshStandardMaterial && ['645d44','263e35','865131','945e39','a66c42','657166'].includes(m.color.getHexString()))result.push({material:m,color:m.color.clone(),roughness:m.roughness});
    }});return result;
  }, [room]);
  function applyWet() { for(const s of surfaces){s.material.color.copy(s.color).multiplyScalar(1-.18*wet.current);s.material.roughness=s.roughness-.22*wet.current;} }
  useEffect(()=>{if(!animate){wet.current=weather==='rain'?1:0;applyWet();invalidate();}},[weather,animate,surfaces,invalidate]);
  useFrame((_,delta)=>{if(!animate)return;const next=weather==='rain'?1:0;if(Math.abs(next-wet.current)<.001)return;wet.current+=(next-wet.current)*(1-Math.exp(-Math.min(delta,.1)*.65));applyWet();});
  useEffect(()=>()=>{room.traverse(object=>{if(object instanceof Mesh)for(const m of (Array.isArray(object.material)?object.material:[object.material]))m.dispose();});},[room]);
  useEffect(() => { gl.shadowMap.needsUpdate = true; invalidate(); onReady(); }, [gl, invalidate, onReady]);
  return <primitive object={room} dispose={null} />;
}

function CameraAndLifecycle({ visible, onFailure, memberKey, solo }: Pick<Props, 'visible' | 'onFailure' | 'solo'> & { memberKey: string }) {
  const { camera, size, gl, invalidate } = useThree();
  useEffect(() => {
    const cam = camera as OrthographicCamera;
    // Keep every seat visible, including on a narrow touch viewport.
    cam.position.set(...(solo?[2.8,3.8,7.5]:[4.5,7.1,16]) as [number,number,number]);
    cam.lookAt(...(solo?[-2.25,size.height<550?.45:1.15,-2.2]:[-.4,1.7,-.5]) as [number,number,number]);
    cam.zoom = Math.min(size.width / (solo?(size.width<700?4.2:8):(size.width < 700 ? 9.7 : 17)), size.height / (solo?5.8:12));
    cam.updateProjectionMatrix(); invalidate();
  }, [camera, size.width, size.height, invalidate, solo]);
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onFailure]);
  useEffect(() => { if (visible) invalidate(); }, [visible, invalidate]);
  useEffect(() => { gl.shadowMap.needsUpdate = true; invalidate(); }, [gl, invalidate, memberKey]);
  return null;
}

export default function LodgeCanvas(props: Props) {
  return <div className="lodge-canvas" aria-hidden="true">
    <Canvas orthographic camera={{ near: .1, far: 80, zoom: 45 }} dpr={[1, 1.5]} shadows frameloop={!props.visible ? 'never' : props.animate ? 'always' : 'demand'} gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }} onCreated={({ gl }) => { gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = 1.15; gl.shadowMap.type = PCFSoftShadowMap; gl.shadowMap.autoUpdate = false; gl.shadowMap.needsUpdate = true; }} fallback={<span>Thiết bị đang dùng cảnh tĩnh.</span>}>
      <Environment phase={props.phase} weather={props.weather} animate={props.animate} solo={props.solo} />
      <Rain weather={props.weather} animate={props.animate} />
      <CameraAndLifecycle visible={props.visible} onFailure={props.onFailure} memberKey={props.members.map(member => member.accountId).join(':')} solo={props.solo} />
      <Suspense fallback={null}><Room onReady={props.onReady} attempt={props.attempt} weather={props.weather} animate={props.animate} solo={props.solo} /></Suspense>
      {!props.solo && <Hearth animate={props.animate} />}
      {!props.solo && <Marten animate={props.animate} />}
      <WindBranches animate={props.animate} weather={props.weather} />
      {props.solo ? <SoloRest animate={props.animate}/> : props.members.map((member, seat) => <Wanderer key={member.accountId} member={member} seat={seat} chosen={props.selected.includes(member.accountId)} animate={props.animate} onClick={() => props.onMember(member.accountId)} />)}
      {props.onCompose && <mesh position={[0, .6, 0]} onClick={event => { event.stopPropagation(); props.onCompose?.(); }}><cylinderGeometry args={[.85, .85, 1.2, 24]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>}
    </Canvas>
  </div>;
}
