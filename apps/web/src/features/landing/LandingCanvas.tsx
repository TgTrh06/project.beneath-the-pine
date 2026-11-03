import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ACESFilmicToneMapping, PerspectiveCamera, PCFSoftShadowMap, Group } from 'three';
import { Room } from '../camps/scene/LodgeCanvas';
import { Environment, Rain } from '../camps/scene/SceneEnvironment';
import { LandingSky } from './LandingSky';
import type { DayPhase, Weather } from '../camps/scene/environment';

type Props = { phase: DayPhase; weather: Weather; animate: boolean; visible: boolean; attempt: number; onReady: () => void; onFailure: () => void };

function Viewpoint({ onFailure, visible }: Pick<Props, 'onFailure' | 'visible'>) {
  const { camera, size, gl, invalidate } = useThree();
  useEffect(() => {
    const cam = camera as PerspectiveCamera;
    const narrow = size.width < 760;
    // At the foot of the Pine, looking almost vertically into the forest canopy.
    cam.fov = narrow ? 66 : 64;
    cam.position.set(narrow ? -1.3 : -.6, 1.8, narrow ? 1 : .5);
    cam.lookAt(narrow ? -4.8 : -6.2, 31, -6.5);
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

function PineMotion({ children, animate, weather }: { children: React.ReactNode; animate: boolean; weather: Weather }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    const crown = group.current?.getObjectByName('pine-crown');
    if (crown) crown.rotation.z = animate ? Math.sin(clock.elapsedTime * .35) * (weather === 'rain' ? .004 : .002) : 0;
  });
  return <group ref={group}>{children}</group>;
}

export default function LandingCanvas(props: Props) {
  return <Canvas camera={{ near: .1, far: 160, fov: 42 }} dpr={[1, 1.5]} shadows frameloop={!props.visible ? 'never' : props.animate ? 'always' : 'demand'} gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }} onCreated={({ gl }) => { gl.toneMapping = ACESFilmicToneMapping; gl.shadowMap.type = PCFSoftShadowMap; gl.shadowMap.autoUpdate = false; }} fallback={<span>Cảnh rừng tĩnh</span>}>
    <Viewpoint onFailure={props.onFailure} visible={props.visible} />
    <Environment phase={props.phase} weather={props.weather} animate={props.animate} solo naturalOnly pinePortrait />
    <LandingSky phase={props.phase} weather={props.weather} animate={props.animate} />
    <group>
      <Rain waterRipples={false} weather={props.weather} animate={props.animate} />
      <PineMotion animate={props.animate} weather={props.weather}><Suspense fallback={null}><Room landing onReady={props.onReady} attempt={props.attempt} weather={props.weather} animate={props.animate} /></Suspense></PineMotion>
    </group>
  </Canvas>;
}
