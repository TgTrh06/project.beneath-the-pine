import {describe,it,expect} from 'vitest';
import {createMartenTorso} from './martenTorso';
describe('Marten continuous torso profiles',()=>{
 it('shares topology so pose transitions can blend safely',()=>{const profiles=['long','upright','curled'].map(kind=>createMartenTorso(kind as 'long'|'upright'|'curled'));try{for(const p of profiles){expect(p.getAttribute('position').count).toBe(profiles[0].getAttribute('position').count);expect(Array.from(p.index!.array).every((value,index)=>value===profiles[0].index!.array[index])).toBe(true);}}finally{profiles.forEach(p=>p.dispose());}});
 it('produces finite surfaces, colours and usable normals for each pose family',()=>{for(const kind of ['long','upright','curled'] as const){const p=createMartenTorso(kind);try{for(const name of ['position','normal','color'])expect(Array.from(p.getAttribute(name).array).every(Number.isFinite)).toBe(true);const normals=p.getAttribute('normal');let minimum=Infinity;for(let i=0;i<normals.count;i++)minimum=Math.min(minimum,Math.hypot(normals.getX(i),normals.getY(i),normals.getZ(i)));expect(minimum).toBeGreaterThan(.9);}finally{p.dispose();}}});
});
