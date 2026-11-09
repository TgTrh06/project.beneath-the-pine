import type { DayPhase, Weather } from './environment';

// Shared by the visible solar disc and the landing's directional light.
export const canopySunDirection = [.0648, .9946, .081] as const;

export function canopySkyPalette(phase: DayPhase, weather: Weather) {
  const palette = {
    dawn: { zenith: '#719ecb', horizon: '#f5c8a3', cloud: '#ffe5ca', shade: '#a6aabd', sun: '#ffe0a0' },
    day: { zenith: '#348ee3', horizon: '#badff6', cloud: '#ffffff', shade: '#b3c8df', sun: '#fff2c3' },
    dusk: { zenith: '#526da6', horizon: '#edab91', cloud: '#f4c6bc', shade: '#7d809e', sun: '#ffd092' },
    night: { zenith: '#10233f', horizon: '#284661', cloud: '#60788e', shade: '#243950', sun: '#fff2c3' },
  }[phase];
  const overcast = weather === 'cloudy' || weather === 'rain', fog = weather === 'fog';
  return {
    ...palette,
    ...(overcast || fog ? {
      zenith: phase === 'night' ? '#182a3d' : weather === 'rain' ? '#697f94' : '#a8becd',
      horizon: phase === 'night' ? '#283d4c' : '#cad7dc',
      cloud: phase === 'night' ? '#4c6273' : '#dde5e9',
      shade: phase === 'night' ? '#253746' : '#859bad',
    } : {}),
    coverage: fog ? .32 : overcast ? .37 : .54,
    sunVisibility: phase === 'night' || weather !== 'clear' ? 0 : 1,
  };
}

export function canopyPoster(phase: DayPhase, weather: Weather, mobile = false) {
  return `/landing/forest-${phase}${weather === 'clear' ? '' : '-overcast'}${mobile ? '-mobile' : ''}.webp`;
}
