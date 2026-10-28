import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { SceneBoundary } from '../camps/scene/SceneBoundary';
import { canopyPoster } from '../camps/scene/canopySky';
import { ThemeSelect } from '../../shared/theme/ThemeSelect';
import { readBrandValue } from '../../shared/brandStorage';
import { parseSettings, resolveTime, resolveWeather, times, weathers, type SceneSettings, type TimeChoice, type WeatherChoice } from '../camps/scene/environment';

const Forest = lazy(() => import('./LandingCanvas'));
const key = 'pyneath:landing-scene';
function readSettings() { try { return parseSettings(JSON.parse(readBrandValue(localStorage, key) ?? '{}')); } catch { return parseSettings(null); } }

export function LandingScene({ children }: { children: (controls: ReactNode) => ReactNode }) {
  const panel = useRef<HTMLDetailsElement>(null);
  const [settings, setSettings] = useState(readSettings);
  const [reduced, setReduced] = useState(true), [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0), [now, setNow] = useState(Date.now);
  const phase = resolveTime(settings.time, new Date(now)), weather = resolveWeather(settings.weather, now);
  const animate = settings.motion && !reduced && visible;
  const onReady = useCallback(() => setReady(true), []), onFailure = useCallback(() => setFailed(true), []);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (panel.current?.open && event.target instanceof Node && !panel.current.contains(event.target)) panel.current.open = false;
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  useEffect(() => {
    const pref = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReduced(pref.matches), visibility = () => setVisible(document.visibilityState === 'visible');
    motion(); visibility();
    pref.addEventListener('change', motion); document.addEventListener('visibilitychange', visibility);
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) setSettings(s => ({ ...s, light: true }));
    return () => { pref.removeEventListener('change', motion); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (!visible || (settings.time !== 'auto' && settings.weather !== 'auto')) return;
    setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer);
  }, [visible, settings.time, settings.weather]);
  useEffect(() => {
    if (settings.light || ready || failed) return;
    const timer = setTimeout(onFailure, 20000); return () => clearTimeout(timer);
  }, [settings.light, ready, failed, attempt, onFailure]);
  function update(next: SceneSettings) { setSettings(next); try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Optional preference. */ } }
  const controls = <div className="lp-atmosphere">
      <details ref={panel} onKeyDown={event => {
        if (event.key === 'Escape' && panel.current?.open) {
          event.stopPropagation(); panel.current.open = false; panel.current.querySelector('summary')?.focus();
        }
      }}><summary aria-label="Không khí khu rừng">
        <svg className="lp-atmosphere-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <g className="lp-atmosphere-sun" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="21" cy="11" r="4" fill="#e1b77b" stroke="none" />
            <path d="M21 3V1.5M27 5l1-1M29 11h1.5M27 17l1 1M15 5l-1-1" />
          </g>
          <path d="m12 6-6 9h3l-6 9h18l-6-9h3L12 6Z" fill="#294b39" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M12 24v5M6 29h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="lp-atmosphere-tooltip" aria-hidden="true">Không khí khu rừng</span>
      </summary><div className="lp-atmosphere-controls">
        <h2>Không khí khu rừng</h2>
        <ThemeSelect />
        <label>Thời điểm<select value={settings.time} onChange={e => update({ ...settings, time: e.target.value as TimeChoice })}>{Object.entries(times).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Thời tiết<select value={settings.weather} onChange={e => update({ ...settings, weather: e.target.value as WeatherChoice })}>{Object.entries(weathers).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <p>{times[phase]} · {weathers[weather]}<br />Thời tiết mô phỏng{settings.weather === 'auto' ? ' · đổi mỗi 20 phút' : ''}.</p>
        <button type="button" aria-pressed={settings.light} onClick={() => { setReady(false); update({ ...settings, light: !settings.light }); }}>Chế độ nhẹ · {settings.light ? 'Bật' : 'Tắt'}</button>
        <button type="button" aria-pressed={animate && !settings.light && !failed} disabled={reduced || settings.light || failed} onClick={() => update({ ...settings, motion: !settings.motion })}>Chuyển động · {animate && !settings.light && !failed ? 'Bật' : 'Tắt'}</button>
        {reduced && <p>Chuyển động đã tắt theo cài đặt thiết bị.</p>}
      <p className="lp-scene-status" role="status">{failed ? <>Đang dùng cảnh tĩnh. <button onClick={() => { setFailed(false); setReady(false); setAttempt(n => n + 1); update({ ...settings, light: false }); }}>Thử lại 3D</button></> : settings.light ? 'Đang dùng cảnh tĩnh.' : !ready ? 'Đang mở khu rừng…' : ''}</p>
      </div></details>
    </div>;
  return <>
    <div className="lp-world" aria-hidden="true" data-ready={ready} data-weather={weather} data-static={settings.light || failed || !ready}>
      <picture><source media="(max-width: 759px)" srcSet={canopyPoster(phase, weather, true)} /><img src={canopyPoster(phase, weather)} alt="" width="1600" height="1000" fetchPriority="high" /></picture>
      {!settings.light && !failed && <SceneBoundary key={attempt} onFailure={onFailure}><div className="lp-world-render" style={{ opacity: ready ? 1 : 0 }}><Suspense fallback={null}><Forest phase={phase} weather={weather} animate={animate} visible={visible} attempt={attempt} onReady={onReady} onFailure={onFailure} /></Suspense></div></SceneBoundary>}
      <div className="lp-world-weather" />
    </div>
    {children(controls)}
  </>;
}
