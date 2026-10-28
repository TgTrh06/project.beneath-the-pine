import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ACESFilmicToneMapping, OrthographicCamera, PCFSoftShadowMap } from 'three';
import { Room, Marten, WindBranches } from '../camps/scene/LodgeCanvas';
import { Environment, Rain } from '../camps/scene/SceneEnvironment';
import type { DayPhase, Weather } from '../camps/scene/environment';

type Props = { phase: DayPhase; weather: Weather; animate: boolean; visible: boolean; attempt: number; onReady: () => void; onFailure: () => void };
function Viewpoint({ visible, onFailure }: Pick<Props, 'visible' | 'onFailure'>) {
  const { camera, size, gl, invalidate } = useThree();
  useEffect(() => {
    const cam = camera as OrthographicCamera;
    const narrow = size.width < 760;
    // The raised, distant camera keeps the whole foreground in front of its near plane.
    cam.position.set(narrow ? 19.6 : 30, narrow ? 19.5 : 19.9, 48);
    cam.lookAt(narrow ? -3.8 : -9, narrow ? 3 : 3.4, -4.5);
    cam.zoom = Math.min(size.width / (narrow ? 12 : 26), size.height / 14);
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

export default function ReturnCanvas(props: Props) {
  return <Canvas orthographic camera={{ near: .1, far: 100 }} dpr={[1, 1.5]} shadows frameloop={!props.visible ? 'never' : props.animate ? 'always' : 'demand'} gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }} onCreated={({ gl }) => { gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = 1.15; gl.shadowMap.type = PCFSoftShadowMap; gl.shadowMap.autoUpdate = false; gl.shadowMap.needsUpdate = true; }}>
    <Viewpoint visible={props.visible} onFailure={props.onFailure}/>
    <Environment phase={props.phase} weather={props.weather} animate={props.animate} solo viewDistanceOffset={45}/>
    <Rain weather={props.weather} animate={props.animate}/>
    <Suspense fallback={null}><Room solo onReady={props.onReady} attempt={props.attempt} weather={props.weather} animate={props.animate}/></Suspense>
    <Marten animate={props.animate} pose="stand"/>
    <WindBranches animate={props.animate} weather={props.weather}/>
  </Canvas>;
}
