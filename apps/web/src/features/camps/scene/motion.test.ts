import {describe,expect,it} from 'vitest';
import {blinkMotion,dampMotion,easeMotion,loopFade,motionDelta,strollAt} from './motion';
import {forestEventAt,martenMomentAt,retimeForest,retimeMarten} from './forestActivity';

describe('continuous forest motion',()=>{
 it('preserves active visit and companion progress across repeated intensity changes',()=>{
  for(let t=0;t<900;t+=.37){
   const mapped=retimeForest(t,'lively','gentle'),a=forestEventAt(t,'lively','day','clear'),b=forestEventAt(mapped,'gentle','day','clear');
   expect(b?.kind).toBe(a?.kind);if(a&&b)expect(b.age).toBeCloseTo(a.age,8);
   expect(retimeForest(mapped,'gentle','lively')).toBeCloseTo(t,8);
   const m=martenMomentAt(t,'lively'),n=martenMomentAt(retimeMarten(t,'lively','gentle'),'gentle');
   expect(n.action).toBe(m.action);expect(n.progress).toBeCloseTo(m.progress,8);
  }
 });
 it('has stationary walk endpoints and a closed, bounded route',()=>{
  const start=strollAt(0),end=strollAt(1),epsilon=.0001;
  expect(start.x).toBe(0);expect(start.z).toBe(0);expect(end.x).toBeCloseTo(0,10);expect(end.z).toBeCloseTo(0,10);
  expect(Math.hypot(strollAt(epsilon).x,strollAt(epsilon).z)/epsilon).toBeLessThan(.00001);
  expect(Math.hypot(strollAt(1-epsilon).x,strollAt(1-epsilon).z)/epsilon).toBeLessThan(.00001);
  for(let p=0;p<=1;p+=.001){const s=strollAt(p);expect(s.x).toBeGreaterThanOrEqual(0);expect(s.x).toBeLessThanOrEqual(.46);expect(Math.abs(s.z)).toBeLessThanOrEqual(.18);}
 });
 it('fades hidden wrap endpoints and keeps pulses continuous',()=>{
  expect(loopFade(0)).toBe(0);expect(loopFade(1)).toBe(0);expect(loopFade(.5)).toBe(1);
  expect(easeMotion(.0001)/.0001).toBeLessThan(.00001);
  for(const t of [0,5.46,5.58,5.7,6.7])expect(Math.abs(blinkMotion(t+.00001)-blinkMotion(t-.00001))).toBeLessThan(.001);
 });
 it('uses time-based damping without catch-up after a suspended frame',()=>{
  const run=(fps:number)=>{let x=0;for(let i=0;i<fps*2;i++)x=dampMotion(x,1,3,1/fps);return x;};
  expect(run(30)).toBeCloseTo(run(60),12);expect(run(60)).toBeCloseTo(run(120),12);
  expect(motionDelta(30)).toBe(.05);expect(motionDelta(-1)).toBe(0);expect(motionDelta(NaN)).toBe(0);
 });
});
