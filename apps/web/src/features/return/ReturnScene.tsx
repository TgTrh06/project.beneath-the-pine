import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { ForestAppearance } from '../../app/ForestAppearance';
import { SceneBoundary } from '../camps/scene/SceneBoundary';
import { parseSettings, resolveTime, resolveWeather, times, weathers, type SceneSettings, type TimeChoice, type WeatherChoice } from '../camps/scene/environment';

const Forest = lazy(() => import('./ReturnCanvas'));
const key = 'pyneath:return-scene';
function readSettings() { try { return parseSettings(JSON.parse(localStorage.getItem(key) ?? '{}')); } catch { return parseSettings(null); } }

export function ReturnScene({ children }: { children: (controls: ReactNode) => ReactNode }) {
  const [settings, setSettings] = useState(readSettings);
  const [reduced, setReduced] = useState(true), [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0), [now, setNow] = useState(Date.now);
  const phase = resolveTime(settings.time, new Date(now)), weather = resolveWeather(settings.weather, now);
  const staticScene = settings.light || reduced || failed;
  const animate = settings.motion && !staticScene && visible;
  const onReady = useCallback(() => setReady(true), []), onFailure = useCallback(() => setFailed(true), []);
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
    if (staticScene || ready) return;
    const timer = setTimeout(onFailure, 20000); return () => clearTimeout(timer);
  }, [staticScene, ready, attempt, onFailure]);
  function update(next: SceneSettings) { setSettings(next); try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Optional preference. */ } }
  const controls = <ForestAppearance>
    <label>Thời điểm<select aria-label="Thời điểm" value={settings.time} onChange={e => update({ ...settings, time: e.target.value as TimeChoice })}>{Object.entries(times).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label>Thời tiết<select aria-label="Thời tiết" value={settings.weather} onChange={e => update({ ...settings, weather: e.target.value as WeatherChoice })}>{Object.entries(weathers).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <p className="field-hint">Thời tiết mô phỏng{settings.weather === 'auto' ? ' · đổi mỗi 20 phút' : ''}.</p>
    <button type="button" className="secondary" aria-pressed={settings.light} onClick={() => { setReady(false); update({ ...settings, light: !settings.light }); }}>Chế độ nhẹ · {settings.light ? 'Bật' : 'Tắt'}</button>
    <button type="button" className="secondary" aria-pressed={animate} disabled={staticScene} onClick={() => update({ ...settings, motion: !settings.motion })}>Chuyển động · {animate ? 'Bật' : 'Tắt'}</button>
    <p role="status" className="field-hint">{reduced ? 'Cảnh tĩnh theo cài đặt giảm chuyển động của thiết bị.' : failed ? <>Đang dùng cảnh tĩnh. <button className="text-action" onClick={() => { setFailed(false); setReady(false); setAttempt(n => n + 1); update({ ...settings, light: false }); }}>Thử lại 3D</button></> : settings.light ? 'Đang dùng cảnh tĩnh.' : !ready ? 'Đang mở khu rừng…' : ''}</p>
  </ForestAppearance>;
  return <>
    <div className="return-world" aria-hidden="true" data-ready={ready} data-weather={weather} data-static={staticScene || !ready}>
      <picture><source media="(max-width: 759px)" srcSet={`/return/forest-${phase}-mobile.webp`}/><img src={`/return/forest-${phase}.webp`} alt="" width="1600" height="1000"/></picture>
      {!staticScene && <SceneBoundary key={attempt} onFailure={onFailure}><div className="return-world-render" style={{ opacity: ready ? 1 : 0 }}><Suspense fallback={null}><Forest phase={phase} weather={weather} animate={animate} visible={visible} attempt={attempt} onReady={onReady} onFailure={onFailure}/></Suspense></div></SceneBoundary>}
      <div className="return-world-weather"/>
    </div>
    {children(controls)}
  </>;
}
