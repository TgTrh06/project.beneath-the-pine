import { useState, type Dispatch, type SetStateAction } from 'react';
import type { FocusPreset } from '@beneath-the-pine/contracts';
import { getPreferences, updatePreferences } from '../../shared/api/api';
import { useResource } from '../../shared/api/useResource';
import { ErrorMessage, type Duration } from '../../shared/components/ui';
import { soundNames, type SoundId } from '../focus/Soundscape';

export function PresetFocus({duration, setDuration, sound, setSound}: {
  duration:Duration; setDuration:Dispatch<SetStateAction<Duration>>;
  sound:SoundId | null; setSound:Dispatch<SetStateAction<SoundId | null>>;
}) {
  const resource = useResource(getPreferences);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const preset = resource.data?.preferences.focusPreset;
  const usePreset = (value:FocusPreset) => { setDuration(value.durationMinutes); setSound(value.soundscapeId); setMessage('Đã điền thời lượng và âm thanh. Bạn vẫn có thể sửa trước khi bắt đầu.'); };
  const save = async () => {
    if (saving) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const result = await updatePreferences({focusPreset:{durationMinutes:duration,soundscapeId:sound}});
      resource.setData(result); setMessage('Đã lưu lựa chọn thường dùng.');
    } catch (failure) { setError((failure as Error).message); }
    finally { setSaving(false); }
  };
  return <div className="focus-preset">
    <label>Âm thanh cho phiên<select value={sound ?? ''} onChange={event => setSound(event.target.value as SoundId || null)}>
      <option value="">Không dùng âm thanh</option>{(Object.keys(soundNames) as SoundId[]).map(id => <option key={id} value={id}>{soundNames[id]}</option>)}
    </select></label>
    <p className="field-hint">Âm thanh chỉ phát khi bạn bấm Phát trong phiên.</p>
    <ErrorMessage message={resource.error} retry={resource.reload}/>
    {preset && <button type="button" className="secondary" onClick={() => usePreset(preset)}>Dùng lựa chọn thường dùng: {preset.durationMinutes} phút · {preset.soundscapeId ? soundNames[preset.soundscapeId] : 'không âm thanh'}</button>}
    <button type="button" className="text-action" disabled={saving} onClick={() => void save()}>{saving ? 'Đang lưu…' : 'Lưu thời lượng và âm thanh này làm preset'}</button>
    <ErrorMessage message={error}/>{message && <p role="status" className="field-hint">{message}</p>}
  </div>;
}
