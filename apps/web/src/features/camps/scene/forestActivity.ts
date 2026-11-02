import type { DayPhase, Weather } from './environment';

export type LifeLevel = 'still' | 'gentle' | 'lively';
export type SessionLife = { level: LifeLevel; drift: boolean };
export const lifeLevels = { still: 'Tĩnh', gentle: 'Êm', lively: 'Sinh động' } as const;
export function parseSessionLife(value: unknown, motion = true): SessionLife {
  const s = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return { level: s.level === 'still' || s.level === 'gentle' || s.level === 'lively' ? s.level : motion ? 'lively' : 'still', drift: s.drift === true };
}
export const activityStrength = (level: LifeLevel) => level === 'lively' ? 1 : level === 'gentle' ? .45 : 0;
export function forestNoise(n: number) { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
export function windAt(t: number, weather: Weather) {
  const swell = Math.pow(.5 + .5 * Math.sin(t * .071 + Math.sin(t * .023)), 3);
  return (.28 + swell * .72) * (weather === 'rain' ? 1.35 : 1);
}
export type ForestEvent = 'butterfly' | 'bird' | 'needles' | 'flock' | 'cone';
const events: ForestEvent[] = ['butterfly', 'bird', 'needles', 'butterfly', 'flock', 'bird', 'needles', 'butterfly', 'bird', 'cone', 'flock', 'needles'];
const durations: Record<ForestEvent, number> = { butterfly: 27, bird: 31, needles: 17, flock: 14, cone: 8 };
const eventSpan = (level:LifeLevel) => level==='gentle'?91:53;
const martenScale = (level:LifeLevel) => level==='gentle'?1.65:1;
export function retimeMarten(seconds:number,from:LifeLevel,to:LifeLevel) {
  return from==='still'||to==='still'?seconds:seconds*martenScale(to)/martenScale(from);
}
// Active visit age is unchanged; only the remainder of a quiet gap is lengthened/shortened.
export function retimeForest(seconds:number,from:LifeLevel,to:LifeLevel) {
  if(from===to||from==='still'||to==='still')return seconds;
  const oldSpan=eventSpan(from),nextSpan=eventSpan(to),slot=Math.floor(seconds/oldSpan),local=seconds-slot*oldSpan;
  const round=Math.floor(slot/events.length),rotation=round===0?0:Math.floor(forestNoise(round+123)*events.length);
  const end=3+forestNoise(slot+7)*9+durations[events[(slot+rotation)%events.length]];
  return slot*nextSpan+(local<=end?local:end+(local-end)/(oldSpan-end)*(nextSpan-end));
}
// A bounded slot has at most one visitor. Gaps and visit lengths vary without timers or backlog.
export function forestEventAt(seconds: number, level: LifeLevel, phase: DayPhase, weather: Weather) {
  if (level === 'still') return null;
  const t = Math.max(0, seconds), span = eventSpan(level), slot = Math.floor(t / span);
  const round = Math.floor(slot / events.length), rotation = round === 0 ? 0 : Math.floor(forestNoise(round + 123) * events.length);
  const kind = events[(slot + rotation) % events.length], start = 3 + forestNoise(slot + 7) * 9;
  const age = t % span - start, duration = durations[kind];
  if (age < 0 || age >= duration) return null;
  if ((weather === 'rain' && kind !== 'needles' && kind !== 'cone') || (phase === 'night' && (kind === 'bird' || kind === 'flock'))) return null;
  return { kind, age, duration, progress: age / duration, slot };
}
export type MartenAction = 'sleep' | 'rest' | 'listen' | 'look' | 'stretch' | 'groom' | 'sniff' | 'walk' | 'yawn';
const moments: [MartenAction, number][] = [['sleep',44],['rest',16],['listen',8],['yawn',5],['stretch',8],['sniff',8],['walk',18],['look',10],['groom',9],['rest',22],['sleep',55],['stretch',7],['look',9],['sleep',48]];
export function martenMomentAt(seconds: number, level: LifeLevel) {
  if (level === 'still') return { action: 'sleep' as MartenAction, progress: 0 };
  const scale = martenScale(level);
  const total = moments.reduce((sum, [, duration]) => sum + duration * scale, 0);
  let t = Math.max(0, seconds) % total;
  for (const [action, duration] of moments) { const d = duration * scale; if (t < d) return { action, progress: t / d }; t -= d; }
  return { action: 'sleep' as MartenAction, progress: 0 };
}
