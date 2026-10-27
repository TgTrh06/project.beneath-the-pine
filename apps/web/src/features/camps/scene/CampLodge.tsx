import { CampPanel } from "./CampPanel";
import { readBrandValue } from '../../../shared/brandStorage';
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { SceneBoundary } from './SceneBoundary';
import { appearanceIndex, lodgeMembers, wandererColors, type LodgeMember } from './lodgeState';
import './lodge.css';
import { parseSettings, posterFor, resolveTime, resolveWeather, times, weathers, type TimeChoice, type WeatherChoice } from './environment';

const LodgeCanvas = lazy(() => import('./LodgeCanvas'));
const emptyMembers: LodgeMember[] = [];
const settingKey = 'pyneath:camp-scene';

function readSettings() {
  try {
    const value: unknown = JSON.parse(readBrandValue(localStorage, settingKey) ?? '{}');
    return parseSettings(value);
  } catch { /* Storage may be unavailable; scene settings are optional. */ }
  return parseSettings(null);
}

type Props = {
  members?: LodgeMember[];
  accountId: string;
  selected: string[];
  disabled: boolean;
  archived: boolean;
  onToggleMember: (id: string) => void;
  onCompose: () => void;
  onPacts: () => void;
  onManage?: () => void;
};

export function CampLodge({ members = emptyMembers, accountId, selected, disabled, archived, onToggleMember, onCompose, onPacts, onManage }: Props) {
  const [settings, setSettings] = useState(readSettings);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const phase = resolveTime(settings.time, new Date(now));
  const weather = resolveWeather(settings.weather, now);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [inspected, setInspected] = useState<string | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const people = lodgeMembers(members);
  const person = people.find(member => member.accountId === inspected);
  const animate = settings.motion && !reducedMotion && !archived && visible && pageVisible;
  const motionEnabled = settings.motion && !reducedMotion && !archived && !settings.light && !failed;
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => setFailed(true), []);

  useEffect(() => {
    if(!pageVisible || (settings.time !== 'auto' && settings.weather !== 'auto'))return;
    setNow(Date.now());
    const timer=window.setInterval(()=>setNow(Date.now()),30000);
    return ()=>window.clearInterval(timer);
  },[pageVisible,settings.time,settings.weather]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(preference.matches);
    sync(); preference.addEventListener('change', sync);
    const visibility = () => setPageVisible(document.visibilityState === 'visible');
    visibility(); document.addEventListener('visibilitychange', visibility);
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) setSettings(value => ({ ...value, light: true }));
    const observer = new IntersectionObserver(entries => {
      const intersects = entries.some(entry => entry.isIntersecting);
      setVisible(intersects);
      if (intersects) setEntered(true);
    });
    if (stage.current) observer.observe(stage.current);
    return () => { preference.removeEventListener('change', sync); document.removeEventListener('visibilitychange', visibility); observer.disconnect(); };
  }, []);

  // A slow or failed GPU must never hold the Camp form hostage.
  useEffect(() => {
    if (!entered || settings.light || ready || failed) return;
    const timer = window.setTimeout(() => setFailed(true), 20000);
    return () => window.clearTimeout(timer);
  }, [entered, settings.light, ready, failed, attempt]);

  function updateSettings(next: typeof settings) {
    setSettings(next);
    try { localStorage.setItem(settingKey, JSON.stringify(next)); } catch { /* Optional preference. */ }
  }

  function inspect(id: string) {
    setInspected(id);
    onToggleMember(id);
  }

  return <section className="camp-lodge" aria-label="Quây quần dưới cây tùng" data-time={phase} data-weather={weather} data-static={settings.light || failed || !ready}>
    <div className="lodge-stage" ref={stage}>
      <img className="lodge-poster" src={posterFor(phase)} onError={event=>{event.currentTarget.onerror=null;if(!event.currentTarget.src.endsWith('/camp/camp-poster.webp'))event.currentTarget.src='/camp/camp-poster.webp';}} alt="Khoảng rừng dưới cây tùng lớn, những chỗ ngồi quây quanh lửa trại." width="1600" height="1000" />
      <div className="lodge-static-weather" aria-hidden="true" />
      {entered && !settings.light && !failed && <SceneBoundary key={attempt} onFailure={onFailure}>
        <div className="lodge-render" style={{ opacity: ready ? 1 : 0, pointerEvents: ready ? 'auto' : 'none' }}><Suspense fallback={null}>
          <LodgeCanvas attempt={attempt} phase={phase} weather={weather} members={people} selected={selected} animate={animate} visible={visible && pageVisible} onMember={inspect} onCompose={archived || disabled ? undefined : onCompose} onPacts={onPacts} onReady={onReady} onFailure={onFailure} />
        </Suspense></div>
      </SceneBoundary>}

    </div>
    <details className="camp-scene-settings"><summary>Hiển thị</summary><div className="lodge-controls">
      <label>Thời điểm<select value={settings.time} onChange={e=>updateSettings({...settings,time:e.target.value as TimeChoice})}>{Object.entries(times).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <label>Thời tiết<select value={settings.weather} onChange={e=>updateSettings({...settings,weather:e.target.value as WeatherChoice})}>{Object.entries(weathers).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <p className="lodge-environment-note">{times[phase]} · {weathers[weather]}<br />Thời tiết mô phỏng{settings.weather==='auto'?' · đổi mỗi 20 phút':''}.</p>
      <button type="button" className="text-action" aria-pressed={settings.light} onClick={() => { setReady(false); updateSettings({ ...settings, light: !settings.light }); }}>Chế độ nhẹ{settings.light ? ' · Bật' : ''}</button>
      <button type="button" className="text-action" aria-pressed={motionEnabled} disabled={settings.light || reducedMotion || archived || failed} onClick={() => updateSettings({ ...settings, motion: !settings.motion })}>Chuyển động · {motionEnabled ? 'Bật' : 'Tắt'}</button>
    </div></details>
    <div className="camp-bottom-overlay"><p className="camp-gathering-caption">Có mặt cùng nhau là đủ.</p>
    <nav className="camp-dock" aria-label="Thao tác trong Camp">
      {!archived && <button type="button" className="camp-start" disabled={disabled} onClick={onCompose}>Hẹn một chặng <span aria-hidden="true">↗</span></button>}
      <button type="button" onClick={() => setRosterOpen(true)}>Thành viên <span className="camp-count">{people.length}</span></button>
      <button type="button" onClick={onPacts}>Bảng hẹn</button>
      {onManage && <button type="button" onClick={onManage}>Quản lý</button>}
    </nav>
    <p className="lodge-status field-hint" role="status">{failed ? <>Cảnh 3D chưa mở được. Bạn vẫn có thể dùng Camp. <button type="button" className="text-action" onClick={() => { setFailed(false); setReady(false); setAttempt(value => value + 1); updateSettings({ ...settings, light: false }); }}>Thử lại cảnh 3D</button></> : settings.light ? 'Đang dùng cảnh tĩnh để tiết kiệm tài nguyên.' : !ready ? 'Đang mở khoảng rừng… Bạn vẫn có thể hẹn một chặng.' : reducedMotion ? 'Chuyển động đã tắt theo cài đặt thiết bị.' : archived ? 'Camp đã lưu trữ. Những cuộc hẹn vẫn ở bảng hẹn.' : 'Nhân vật đại diện thành viên, không biểu thị ai đang online.'}</p>
    </div>
    {person && !rosterOpen && <p className="camp-selection-note" role="status">{person.displayName ?? "Wanderer"}{selected.includes(person.accountId) ? " · Đã chọn để hẹn" : " · Thành viên Camp"}</p>}
    {rosterOpen && <CampPanel title="Những người quanh lửa" onClose={() => setRosterOpen(false)}><div className="lodge-roster-heading"><h3>Những người trong Camp</h3><span>{people.length}/8</span></div>
    <p className="field-hint lodge-presence-note">Nhân vật đại diện cho thành viên, không biểu thị ai đang online.</p>
    <ul className="lodge-roster">{people.map(member => {
      const mine = member.accountId === accountId;
      const chosen = selected.includes(member.accountId);
      return <li key={member.accountId}><button type="button" disabled={disabled || mine} aria-pressed={chosen} onClick={() => inspect(member.accountId)} aria-label={`${member.displayName ?? 'Wanderer'}${mine ? ', bạn' : ''}${chosen ? ', đã chọn' : ''}`}>
        <span className="lodge-member-mark" style={{ backgroundColor: `color-mix(in srgb, ${wandererColors[appearanceIndex(member.accountId)]} 72%, white)` }} aria-hidden="true">{chosen ? '✓' : (member.displayName?.trim().slice(0, 1) ?? 'W')}</span>
        <span><strong>{member.displayName ?? 'Wanderer'}</strong><small>{mine ? 'Bạn' : member.role === 'owner' ? 'Chủ nhóm' : 'Thành viên'}{chosen ? ' · Đã chọn' : ''}</small></span>
      </button></li>;
    })}</ul>
    {person && <p className="field-hint" role="status">{person.displayName ?? 'Wanderer'} · {person.role === 'owner' ? 'Chủ nhóm' : 'Thành viên'}{person.accountId === accountId ? ' · Bạn' : selected.includes(person.accountId) ? ' · Đã chọn để hẹn Pact.' : archived ? '' : ' · Chưa chọn để hẹn Pact.'}</p>}
    {people.length === 1 && <p className="field-hint">Lửa trại đã sẵn sàng. Mời thêm một người quen để hẹn chặng đầu tiên.</p>}
    {!archived && <button type="button" className="primary" disabled={disabled} onClick={() => { setRosterOpen(false); onCompose(); }}>Tiếp tục hẹn{selected.length ? ` · ${selected.length} người` : ""}</button>}
    </CampPanel>}
  </section>;
}
