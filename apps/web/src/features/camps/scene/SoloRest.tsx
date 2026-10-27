import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Quaternion, Vector3 } from 'three';

function Form({at,scale,color,rotation=[0,0,0]}:{at:[number,number,number];scale:[number,number,number];color:string;rotation?:[number,number,number]}) {
  return <mesh position={at} scale={scale} rotation={rotation} castShadow receiveShadow><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={color} roughness={.9}/></mesh>;
}
function Limb({from,to,radius,color}:{from:[number,number,number];to:[number,number,number];radius:number;color:string}) {
  const a=new Vector3(...from),b=new Vector3(...to),d=b.clone().sub(a);
  return <mesh position={a.add(b).multiplyScalar(.5)} quaternion={new Quaternion().setFromUnitVectors(new Vector3(0,1,0),d.clone().normalize())} castShadow receiveShadow><capsuleGeometry args={[radius,Math.max(.01,d.length()-radius*2),6,12]}/><meshStandardMaterial color={color} roughness={.9}/></mesh>;
}

export function SoloRest({animate}:{animate:boolean}) {
  const torso=useRef<Group>(null),head=useRef<Group>(null),marten=useRef<Group>(null);
  useFrame(({clock})=>{
    if(!animate)return;
    if(torso.current)torso.current.scale.y=1+Math.sin(clock.elapsedTime*.85)*.006;
    if(head.current)head.current.rotation.y=-.25+Math.sin(clock.elapsedTime*.17)*.04;
    if(marten.current)marten.current.scale.y=1+Math.sin(clock.elapsedTime*1.2)*.012;
  });
  useEffect(()=>{if(!animate){if(torso.current)torso.current.scale.y=1;if(head.current)head.current.rotation.y=-.25;if(marten.current)marten.current.scale.y=1;}},[animate]);
  const coat='#597666',pants='#454d47',skin='#d7aa83';
  return <>
    <group position={[-2.6,.11,-2.65]} rotation={[0,.08,0]}>
      <Form at={[0,.18,0]} scale={[.32,.19,.28]} color={coat}/>
      {/* One knee loosely raised, the other leg extended along the ground. */}
      <Limb from={[-.16,.2,.1]} to={[-.28,.25,.61]} radius={.14} color={pants}/>
      <Limb from={[-.28,.25,.61]} to={[-.35,.13,1.13]} radius={.11} color={pants}/>
      <Form at={[-.35,.09,1.24]} scale={[.14,.12,.23]} color="#3a2c25" rotation={[0,-.12,0]}/>
      <Limb from={[.16,.2,.08]} to={[.34,.43,.52]} radius={.145} color={pants}/>
      <Limb from={[.34,.43,.52]} to={[.43,.11,.91]} radius={.11} color={pants}/>
      <Form at={[.44,.08,1.02]} scale={[.14,.11,.22]} color="#3a2c25" rotation={[0,.22,0]}/>
      <group ref={torso}>
        <Form at={[0,.5,-.07]} scale={[.3,.39,.24]} color={coat} rotation={[-.17,0,0]}/>
        <Limb from={[-.27,.69,-.08]} to={[-.35,.4,.16]} radius={.105} color={coat}/>
        <Limb from={[-.35,.4,.16]} to={[-.27,.33,.49]} radius={.085} color={coat}/>
        <Form at={[-.27,.32,.54]} scale={[.085,.06,.12]} color={skin}/>
        <Limb from={[.27,.69,-.08]} to={[.4,.43,.12]} radius={.105} color={coat}/>
        <Limb from={[.4,.43,.12]} to={[.34,.49,.44]} radius={.085} color={coat}/>
        <Form at={[.34,.48,.5]} scale={[.085,.06,.12]} color={skin}/>
        <mesh position={[0,.79,-.12]} rotation={[Math.PI/2,0,0]} castShadow><torusGeometry args={[.185,.06,8,20]}/><meshStandardMaterial color="#d9bd7d" roughness={1}/></mesh>
        <Form at={[.09,.61,.155]} scale={[.065,.19,.035]} color="#d9bd7d"/>
        <group ref={head} position={[0,1,-.14]} rotation={[-.16,-.25,-.065]}>
          <Form at={[0,0,0]} scale={[.235,.26,.22]} color={skin}/>
          <Form at={[0,.13,-.025]} scale={[.245,.19,.225]} color="#70513b"/>
          {[-1,1].map(side=><Form key={side} at={[side*.23,-.01,0]} scale={[.045,.065,.045]} color={skin}/>)}
          <Form at={[0,-.035,.214]} scale={[.035,.04,.035]} color={skin}/>
          {[-1,1].map(side=><Form key={side} at={[side*.082,.012,.204]} scale={[.018,.018,.012]} color="#332920"/>)}
          <Form at={[0,.23,-.015]} scale={[.25,.15,.24]} color={coat}/>
          <Form at={[0,.39,-.015]} scale={[.065,.065,.065]} color="#dfcda1"/>
        </group>
      </group>
    </group>
    {/* Curled tail, paws and lowered head keep Marten settled beside the legs. */}
    <group position={[-1.55,.2,-1.95]} rotation={[0,1.05,0]}>
      <group ref={marten}>
        <Form at={[.04,0,0]} scale={[.34,.18,.24]} color="#80502f"/>
        <Form at={[.31,-.055,.03]} scale={[.2,.11,.28]} color="#684128" rotation={[0,-.5,0]}/>
        <Form at={[.08,-.075,.22]} scale={[.3,.095,.13]} color="#684128"/>
        <Form at={[-.23,-.09,.21]} scale={[.12,.07,.14]} color="#94623a"/>
        <group position={[-.22,.01,.08]} rotation={[.2,-.15,-.12]}>
          <Form at={[0,0,0]} scale={[.165,.145,.155]} color="#94623a"/>
          <Form at={[0,-.04,.12]} scale={[.115,.07,.09]} color="#dfc799"/>
          <Form at={[0,-.025,.2]} scale={[.027,.022,.025]} color="#39291f"/>
          {[-1,1].map(side=><group key={side}><Form at={[side*.12,.1,-.02]} scale={[.065,.07,.05]} color="#80502f"/><Form at={[side*.075,.012,.137]} scale={[.03,.008,.012]} color="#39291f" rotation={[0,0,side*.12]}/></group>)}
        </group>
      </group>
    </group>
  </>;
}
