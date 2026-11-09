import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ACESFilmicToneMapping, OrthographicCamera, PCFSoftShadowMap } from 'three';
import { Room, Marten, WindBranches } from '../../shared/scene/LodgeCanvas';
import { Environment, Rain } from '../../shared/scene/SceneEnvironment';
import { forestPlaces, type ForestPlace } from './forestPlaces';
import type { DayPhase, Weather } from '../../shared/scene/environment';
import { ForestLife } from '../../shared/scene/ForestLife';
import { MartenCompanion } from '../../shared/scene/MartenCompanion';
import type { SessionLife } from '../../shared/scene/forestActivity';

import { ForestGrowth } from "../memory/scene-api";
import type { ForestArrangement, ForestThreshold } from "@pyneath/contracts";
import { forestReactions, type ForestReaction } from '../memory/scene-api';

type Props = { growth?:ForestThreshold[]; arrangement?:ForestArrangement | null; reaction?:ForestReaction | null; place?:ForestPlace; life?:SessionLife; phase: DayPhase; weather: Weather; animate: boolean; visible: boolean; attempt: number; onReady: () => void; onFailure: () => void };
function Viewpoint({ visible, onFailure, place = 'return' }: Pick<Props, 'visible' | 'onFailure' | 'place'>) {
  const { camera, size, gl, invalidate } = useThree();
  useEffect(() => {
    const cam = camera as OrthographicCamera;
    const narrow = size.width < 760;
    // The raised, distant camera keeps the whole foreground in front of its near plane.
    cam.position.set(narrow ? 19.6 : 30, narrow ? 19.5 : 19.9, 48);
    const view=forestPlaces[place];
    cam.lookAt(...(narrow?[-3.8,3,-4.5]:view.target) as [number,number,number]);
    cam.zoom = Math.min(size.width / (narrow ? 12 : forestPlaces[place].span), size.height / 14);
    cam.updateProjectionMatrix(); invalidate();
  }, [camera, size.width, size.height, invalidate, place]);
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onFailure]);
  useEffect(() => { if (visible) invalidate(); }, [visible, invalidate]);
  return null;
}

export default function ReturnCanvas(props: Props) {
  const reaction = props.reaction && props.reaction.expiresAt > performance.now() ? forestReactions[props.reaction.threshold] : null;
  return <Canvas orthographic camera={{ near: .1, far: 100 }} dpr={props.life?.level==='gentle'?1:props.life?[1,1.25]:[1,1.5]} shadows frameloop={!props.visible ? 'never' : props.animate ? 'always' : 'demand'} gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }} onCreated={({ gl }) => { gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = 1.15; gl.shadowMap.type = PCFSoftShadowMap; gl.shadowMap.autoUpdate = false; gl.shadowMap.needsUpdate = true; }}>
    <Viewpoint place={props.place} visible={props.visible} onFailure={props.onFailure}/>
    <Environment phase={props.phase} weather={props.weather} animate={props.animate} solo viewDistanceOffset={45} living={!!props.life}/>
    <ForestGrowth earned={props.growth ?? []} arrangement={props.arrangement}/>
    <Rain weather={props.weather} animate={props.animate}/>
    <Suspense fallback={null}><Room solo onReady={props.onReady} attempt={props.attempt} weather={props.weather} animate={props.animate} life={props.life?.level}/></Suspense>
    {props.life?<><group position={[-2.7,.025,-2]} rotation={[0,-.7,0]}><MartenCompanion animate={props.animate} level={props.life.level}/></group><ForestLife animate={props.animate} level={props.life.level} drift={props.life.drift} phase={props.phase} weather={props.weather}/></>:<><Marten animate={props.animate} pose={reaction?.pose ?? 'stand'} action={reaction?.action} ambient={!reaction}/><WindBranches animate={props.animate} weather={props.weather}/></>}
  </Canvas>;
}
