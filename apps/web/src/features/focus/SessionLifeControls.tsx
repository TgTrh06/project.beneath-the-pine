import { useState } from 'react';
import { lifeLevels, parseSessionLife, type SessionLife } from '../../shared/scene/forestActivity';

const key = 'pyneath:session-life';
export function useSessionLife(motion: boolean) {
  const [life, setLife] = useState(() => { try { return parseSessionLife(JSON.parse(localStorage.getItem(key) ?? 'null'), motion); } catch { return parseSessionLife(null, motion); } });
  function update(next: SessionLife) { setLife(next); try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Optional local preference. */ } }
  return [life, update] as const;
}
export function SessionLifeControls({ value, onChange, disabled }: { value: SessionLife; onChange: (value: SessionLife) => void; disabled: boolean }) {
  return <>
    <label>Sức sống khu rừng<select aria-label="Sức sống khu rừng" value={value.level} disabled={disabled} onChange={e => onChange({ ...value, level: e.target.value as SessionLife['level'] })}>{Object.entries(lifeLevels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    <label className="check-label"><input type="checkbox" checked={value.drift} disabled={disabled || value.level === 'still'} onChange={e => onChange({ ...value, drift: e.target.checked })}/>Góc nhìn trôi nhẹ</label>
  </>;
}
