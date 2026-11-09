// Quintic endpoints have zero velocity and acceleration: useful at rest, landings and loops.
export const clamp01 = (x:number) => Math.max(0,Math.min(1,x));
export function easeMotion(x:number) { const t=clamp01(x);return t*t*t*(t*(t*6-15)+10); }
export const motionDelta = (delta:number) => Number.isFinite(delta)?Math.max(0,Math.min(delta,.05)):0;
export function dampMotion(current:number,target:number,rate:number,dt:number) { return current+(target-current)*(-Math.expm1(-rate*dt)); }
export function dampAngle(current:number,target:number,rate:number,dt:number) { return current+Math.atan2(Math.sin(target-current),Math.cos(target-current))*(-Math.expm1(-rate*dt)); }
export function motionWindow(t:number,start:number,end:number,ramp:number) { return easeMotion((t-start)/ramp)*(1-easeMotion((t-end+ramp)/ramp)); }
export const loopFade = (phase:number,ramp=.1) => motionWindow(phase,0,1,ramp);
export function blinkMotion(seconds:number,period=5.7,duration=.24) {
  const phase=((seconds%period)+period)%period;
  return 1-.94*motionWindow(phase,period-duration,period,duration*.5);
}
export function strollAt(progress:number) {
  const p=clamp01(progress),u=easeMotion(p),a=u*Math.PI*2;
  return {x:.23*(1-Math.cos(a)),z:.18*Math.sin(a),heading:Math.atan2(.23*Math.sin(a),.18*Math.cos(a)),weight:motionWindow(p,0,1,.16)};
}
export type CompanionMotion = {walk:number;stride:number;sniff:number;yawn:number;groom:number};
