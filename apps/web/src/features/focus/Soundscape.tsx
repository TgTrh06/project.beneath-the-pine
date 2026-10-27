import { useEffect, useRef, useState } from 'react';
import type { FocusPreset } from '@pyneath/contracts';
import { getPreferences } from '../../shared/api/api';
import { usePrivateDraft } from '../../shared/auth/usePrivateDraft';

export type SoundId = NonNullable<FocusPreset['soundscapeId']>;
export const soundNames: Record<SoundId, string> = {rain:'Mưa nhẹ',forest:'Rừng sớm',stream:'Suối chảy'};

export function Soundscape({sessionId, active, solo=false}: {sessionId:string;active:boolean;solo?:boolean}) {
  const [choice, setChoice] = usePrivateDraft<SoundId | null | undefined>(`session:${sessionId}:soundscape`,undefined,{persist:true});
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(35);
  const [error, setError] = useState('');
  const audio = useRef<HTMLAudioElement | null>(null);
  const touched = useRef(choice !== undefined);
  useEffect(() => {
    let mounted = true;
    void getPreferences().then(value => {
      if (mounted && !touched.current) setChoice(value.preferences.focusPreset?.soundscapeId ?? null);
    }).catch(() => { /* The controls remain usable when preferences are offline. */ });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (audio.current) audio.current.volume = volume / 100;
  }, [volume]);
  useEffect(() => {
    if (active) return;
    audio.current?.pause();
    audio.current = null;
    setPlaying(false);
  }, [active]);
  useEffect(() => () => { audio.current?.pause(); audio.current = null; }, []);

  const stop = () => { audio.current?.pause(); audio.current = null; setPlaying(false); };
  const play = async () => {
    if (!active || !choice) return;
    stop(); setError('');
    const player = new Audio(`/sounds/${choice}.ogg`);
    player.loop = true; player.volume = volume / 100;
    audio.current = player;
    try { await player.play(); if (audio.current === player) setPlaying(true); else player.pause(); }
    catch { if (audio.current === player) audio.current = null; setError('Chưa phát được âm thanh. Hãy thử lại sau khi kiểm tra âm lượng hoặc trình duyệt.'); }
  };
  return <section className="soundscape" aria-label="Âm thanh môi trường của riêng bạn">
    <h2>Âm thanh môi trường</h2>
    <p className="field-hint">{solo?'Chỉ phát trên thiết bị của bạn sau khi bấm Phát. Đổi thời tiết không đổi âm thanh hay dừng đồng hồ.':'Chỉ phát trên thiết bị của bạn sau khi bấm Phát. Không ảnh hưởng đồng hồ hay thành viên Camp.'}</p>
    <label>Chọn âm thanh<select value={choice ?? ''} disabled={!active} onChange={event => { touched.current = true; stop(); setChoice(event.target.value as SoundId || null); }}>
      <option value="">Không dùng âm thanh</option>{(Object.keys(soundNames) as SoundId[]).map(id => <option value={id} key={id}>{soundNames[id]}</option>)}
    </select></label>
    <label>Âm lượng {volume}%<input type="range" min="0" max="100" value={volume} disabled={!active} onChange={event => setVolume(Number(event.target.value))}/></label>
    <div className="button-row"><button type="button" className="secondary" disabled={!active || !choice || playing} onClick={() => void play()}>Phát âm thanh</button><button type="button" className="text-action" disabled={!playing} onClick={stop}>Dừng âm thanh</button></div>
    {error && <p role="alert">{error}</p>}
  </section>;
}
