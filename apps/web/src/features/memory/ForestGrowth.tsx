import type { ForestArrangement, ForestThreshold } from '@pyneath/contracts';
import { arrangedForest } from './forestArrangement';

/** A fixed-size patch: no animation loop, random drops, light source or asset download. */
export function ForestGrowth({ earned, arrangement, origin = [1.2, .12, -1.7], namespace = 'personal' }: { earned: readonly ForestThreshold[]; arrangement?: ForestArrangement | null; origin?: [number, number, number]; namespace?: 'personal' | 'camp' }) {
  const items = arrangedForest(earned, arrangement);
  if (!items.length) return null;
  return <group name={`${namespace}-forest-growth`} position={origin}>
    {items.map(({ threshold, position: [x, z] }) => <group key={threshold} name={`${namespace}-forest-item-${threshold}`} position={[x,0,z]}>
    {threshold === 1 && <group>
    <mesh position={[0,.3,0]}><cylinderGeometry args={[.035,.05,.6,6]}/><meshStandardMaterial color="#6d8151"/></mesh>
    <mesh position={[-.14,.42,0]} rotation={[0,0,.65]} scale={[.29,.12,.17]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#8fa86a"/></mesh>
    <mesh position={[.12,.6,0]} rotation={[0,0,-.7]} scale={[.25,.13,.16]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#a4b77d"/></mesh>
    </group>}
    {threshold === 3 && <group name={`${namespace}-forest-flowers`}>
      {[[.05,.12,0],[-.2,.16,-.16],[.15,.1,.25]].map(([x,y,z],index) => <group key={index} position={[x,y,z]}>
        <mesh position={[0,.08,0]}><cylinderGeometry args={[.018,.025,.2,5]}/><meshStandardMaterial color="#6d8151"/></mesh>
        <mesh position={[0,.2,0]} rotation={[Math.PI/2,0,index]} scale={[1,1,.45]}><icosahedronGeometry args={[.13,0]}/><meshStandardMaterial color={index===1?'#d5b07a':'#e0ccb0'}/></mesh>
      </group>)}
    </group>}
    {threshold === 7 && <group name={`${namespace}-forest-lantern`}>
      <mesh position={[0,.6,0]}><cylinderGeometry args={[.035,.045,1.2,6]}/><meshStandardMaterial color="#795c3e"/></mesh>
      <mesh position={[.13,1.17,0]}><boxGeometry args={[.32,.055,.055]}/><meshStandardMaterial color="#795c3e"/></mesh>
      <mesh position={[.25,.92,0]}><boxGeometry args={[.24,.32,.24]}/><meshStandardMaterial color="#e1bb75" emissive="#d9a447" emissiveIntensity={.35}/></mesh>
      {[.73,1.11].map(y=><mesh key={y} position={[.25,y,0]}><boxGeometry args={[.32,.065,.32]}/><meshStandardMaterial color="#795c3e"/></mesh>)}
    </group>}
    </group>)}
  </group>;
}
