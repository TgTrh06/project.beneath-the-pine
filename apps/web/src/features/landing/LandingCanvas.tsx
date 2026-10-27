import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ACESFilmicToneMapping, BufferGeometry, CatmullRomCurve3, Group, Mesh, MeshBasicMaterial, OrthographicCamera, PCFSoftShadowMap, Vector3 } from 'three';
import { Marten, Room, WindBranches } from '../camps/scene/LodgeCanvas';
import { Environment, Rain } from '../camps/scene/SceneEnvironment';
import type { DayPhase, Weather } from '../camps/scene/environment';

type Props = { phase: DayPhase; weather: Weather; animate: boolean; visible: boolean; attempt: number; onReady: () => void; onFailure: () => void };

function Viewpoint({ onFailure, visible }: Pick<Props, 'onFailure' | 'visible'>) {
  const { camera, size, gl, invalidate } = useThree();
  useEffect(() => {
    const cam = camera as OrthographicCamera;
    const narrow = size.width < 760;
    // Pull back along the view direction so tall portrait frustums stay above the ground.
    cam.position.set(9, 24, 77);
    cam.lookAt(narrow ? 1 : 0, narrow ? 5 : 4, -7);
    cam.zoom = Math.min(size.width / (narrow ? 18 : 29), size.height / 22);
    cam.updateProjectionMatrix(); invalidate();
  }, [camera, size.width, size.height, invalidate]);
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onFailure]);
  useEffect(() => { if (visible) invalidate(); }, [visible, invalidate]);
  return null;
}

function Current({ animate }: { animate: boolean }) {
  const streaks = useRef<Group>(null);
  const stream = useMemo(() => new CatmullRomCurve3([[23,.045,4],[12,.045,-1],[5.8,.045,-6],[3.9,.045,-10],[5,.045,-14],[2,.045,-20],[-3,.045,-35],[-8,.045,-60],[-12,.045,-89]].map(p => new Vector3(...p))), []);
  useFrame(({ clock }) => {
    if (!animate) return;
    streaks.current?.children.forEach((child, i) => {
      const t = (i / 16 + clock.elapsedTime * .004) % 1;
      const p = stream.getPoint(t), tangent = stream.getTangent(t);
      child.position.copy(p); child.rotation.z = Math.atan2(tangent.x, tangent.z);
      (child as Mesh<BufferGeometry, MeshBasicMaterial>).material.opacity = Math.sin(t * Math.PI) * .3;
    });
  });
  return <group ref={streaks} visible={animate}>{Array.from({ length: 16 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.035,.65]} /><meshBasicMaterial color="#c1daca" transparent opacity={0} depthWrite={false} /></mesh>)}</group>;
}

export default function LandingCanvas(props: Props) {
  return <Canvas orthographic camera={{ near: .1, far: 260 }} dpr={[1, 1.5]} shadows frameloop={!props.visible ? 'never' : props.animate ? 'always' : 'demand'} gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }} onCreated={({ gl }) => { gl.toneMapping = ACESFilmicToneMapping; gl.shadowMap.type = PCFSoftShadowMap; gl.shadowMap.autoUpdate = false; }} fallback={<span>Cảnh rừng tĩnh</span>}>
    <Viewpoint onFailure={props.onFailure} visible={props.visible} />
    <Environment phase={props.phase} weather={props.weather} animate={props.animate} solo mirrored viewDistanceOffset={58} />
    <group scale={[-1,1,1]}>
      <Rain weather={props.weather} animate={props.animate} />
      <Suspense fallback={null}><Room solo onReady={props.onReady} attempt={props.attempt} weather={props.weather} animate={props.animate} /></Suspense>
      <WindBranches animate={props.animate} weather={props.weather} />
      <Marten animate={props.animate} />
      <Current animate={props.animate} />
    </group>
  </Canvas>;
}
