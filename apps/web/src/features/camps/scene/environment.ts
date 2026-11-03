export const times = { auto: 'Theo giờ thiết bị', dawn: 'Bình minh', day: 'Ban ngày', dusk: 'Hoàng hôn', night: 'Ban đêm' };
export const weathers = { auto: 'Tự đổi', clear: 'Quang', cloudy: 'Nhiều mây', rain: 'Mưa nhẹ', fog: 'Sương' };
export type TimeChoice = keyof typeof times;
export type WeatherChoice = keyof typeof weathers;
export type DayPhase = Exclude<TimeChoice, 'auto'>;
export type Weather = Exclude<WeatherChoice, 'auto'>;
export type SceneSettings = { light: boolean; motion: boolean; time: TimeChoice; weather: WeatherChoice };
export function parseSettings(value: unknown): SceneSettings {
  const s = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return { light: s.light === true, motion: s.motion !== false,
    time: typeof s.time === 'string' && Object.hasOwn(times, s.time) ? s.time as TimeChoice : 'auto',
    weather: typeof s.weather === 'string' && Object.hasOwn(weathers, s.weather) ? s.weather as WeatherChoice : 'clear' };
}
export function resolveTime(choice: TimeChoice, date: Date): DayPhase {
  if (choice !== 'auto') return choice;
  const hour = date.getHours() + date.getMinutes() / 60;
  return hour >= 5 && hour < 7 ? 'dawn' : hour >= 7 && hour < 17 ? 'day' : hour >= 17 && hour < 19 ? 'dusk' : 'night';
}
// A repeatable 20-minute rhythm, independent of real weather or location.
export function resolveWeather(choice: WeatherChoice, now: number): Weather {
  if (choice !== 'auto') return choice;
  const sequence: Weather[] = ['clear', 'cloudy', 'rain', 'cloudy', 'fog', 'clear'];
  return sequence[((Math.floor(now / 1_200_000) % sequence.length) + sequence.length) % sequence.length];
}
const phases = {
  dawn: { sky: '#acb7a1', sun: '#ffca86', ambient: '#dde2c5', ground: '#706345', power: 2.3, fill: .65, hemi: 1.8, fire: 20, lantern: 2, position: [-14, 9, 2] },
  day: { sky: '#b7d1c4', sun: '#fff0c7', ambient: '#e2f0de', ground: '#7a8060', power: 3.5, fill: .7, hemi: 2.5, fire: 10, lantern: .4, position: [-9, 22, 8] },
  dusk: { sky: '#585b59', sun: '#ffa766', ambient: '#c4c9ba', ground: '#5b4934', power: 2.3, fill: .65, hemi: 1.4, fire: 30, lantern: 3, position: [-15, 8, -3] },
  night: { sky: '#102b34', sun: '#93bfd3', ambient: '#86a7b4', ground: '#293c37', power: 1, fill: .3, hemi: .8, fire: 34, lantern: 4, position: [-6, 20, -5] },
};
export function environmentTarget(phase: DayPhase, weather: Weather) {
  const p = phases[phase], overcast = weather === 'cloudy' || weather === 'rain';
  return { ...p, power: p.power * (weather === 'rain' ? .25 : weather === 'cloudy' ? .45 : weather === 'fog' ? .55 : 1),
    hemi: p.hemi * (weather === 'rain' ? .8 : 1), sky: overcast ? (phase === 'night' ? '#172d38' : '#718e90') : p.sky,
    sun: overcast ? '#c0d4d5' : p.sun, fogNear: weather === 'fog' ? 9 : weather === 'rain' ? 16 : phase === 'dawn' ? 18 : 22,
    fogFar: weather === 'fog' ? 37 : weather === 'rain' ? 48 : 68 };
}
export function posterFor(phase: DayPhase) { return `/camp/camp-poster-${phase}.webp`; }
