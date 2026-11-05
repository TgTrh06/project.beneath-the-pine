import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { defaultForestArrangement, forestArrangementSchema, type ForestArrangement, type ForestThreshold, type PersonalForest, type PersonalMilestone } from '@pyneath/contracts';
import { getPersonalForest, getPreferences, saveForestArrangement } from '../../shared/api/api';
import { ForestPreview } from './ForestPreview';
import { formatTime } from '../../shared/time';
import { MartenIllustration } from '../../shared/components/marten/MartenIllustration';
import { forestReactionDuration, forestReactionReducer, forestReactions, initialForestReaction, type ForestReaction } from './forestReaction';
import './memory.css';

export const forestMemories: Record<ForestThreshold, { title: string; detail: string; arrival: string }> = {
  1: { title: 'Mầm cây đầu tiên', detail: 'Một mầm cây bên gốc thông, từ chặng đầu đã khép lại.', arrival: 'Khu rừng có thêm một mầm cây.' },
  3: { title: 'Một khoảng hoa', detail: 'Ba chặng đã khép lại. Một cụm hoa nhỏ ở lại bên mầm cây.', arrival: 'Một cụm hoa vừa nở bên mầm cây.' },
  7: { title: 'Ánh đèn thân quen', detail: 'Bảy chặng đã khép lại. Một chiếc đèn nhỏ đánh dấu góc rừng của bạn.', arrival: 'Góc rừng có thêm một ánh đèn.' },
};
type ForestState = {
  data: PersonalForest | null; loading: boolean; error: string;
  notice: PersonalMilestone | null;
  reaction: ForestReaction | null;
  setReactionAllowed: (allowed: boolean) => void;
  refresh: (sourceSessionId?: string) => Promise<void>;
  dismiss: () => void;
  arrangement: ForestArrangement | null; arrangementError: string;
  reloadArrangement: () => Promise<ForestArrangement>;
  saveArrangement: (draft: ForestArrangement) => Promise<ForestArrangement>;
};
const ForestContext = createContext<ForestState>({ data: null, loading: true, error: '', notice: null, reaction: null, setReactionAllowed: () => {}, refresh: async () => {}, dismiss: () => {}, arrangement: null, arrangementError: '', reloadArrangement: async () => defaultForestArrangement, saveArrangement: async () => defaultForestArrangement });
export const usePersonalForest = () => useContext(ForestContext);

/** Mounted once per authenticated account; never persist personal state in localStorage. */
export function PersonalForestProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PersonalForest | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [notice, setNotice] = useState<PersonalMilestone | null>(null);
  const [reactionState, dispatchReaction] = useReducer(forestReactionReducer, initialForestReaction);
  const reaction = reactionState.active;
  const setReactionAllowed = useCallback((allowed: boolean) => dispatchReaction({ type: 'availability', allowed }), []);
  useEffect(() => {
    if (!reaction) return;
    const timer = setTimeout(() => dispatchReaction({ type: 'expire', id: reaction.id }), Math.max(0, reaction.expiresAt - performance.now()));
    return () => clearTimeout(timer);
  }, [reaction]);
  const sequence = useRef(0), previous = useRef<PersonalForest | null>(null);
  const pendingSource = useRef<string | undefined>(undefined);
  const pendingReactionDeadline = useRef(0);
  const [arrangement, setArrangement] = useState<ForestArrangement | null>(null), [arrangementError, setArrangementError] = useState('');
  const acceptArrangement = useCallback((next: ForestArrangement) => {
    setArrangement(current => current && current.version > next.version ? current : next);
    setArrangementError('');
    return next;
  }, []);
  const reloadArrangement = useCallback(async () => {
    try { return acceptArrangement(forestArrangementSchema.parse((await getPreferences()).preferences.forestArrangement)); }
    catch (error) { setArrangementError('Chưa tải được cách sắp xếp góc rừng.'); throw error; }
  }, [acceptArrangement]);
  const saveArrangement = useCallback(async (draft: ForestArrangement) => acceptArrangement(await saveForestArrangement(draft)), [acceptArrangement]);
  const refresh = useCallback(async (sourceSessionId?: string) => {
    if (sourceSessionId) {
      dispatchReaction({ type: 'cancel', sourceSessionId });
      if (pendingSource.current !== sourceSessionId) pendingReactionDeadline.current = performance.now() + forestReactionDuration;
      pendingSource.current = sourceSessionId;
      setNotice(current => current?.sourceSessionId === sourceSessionId ? current : null);
    }
    const request = ++sequence.current;
    setLoading(true); setError('');
    try {
      const next = await getPersonalForest();
      if (request !== sequence.current) return;
      const arrival = next.milestones.find(item => item.sourceSessionId === pendingSource.current &&
        !previous.current?.milestones.some(known => known.threshold === item.threshold));
      if (arrival) {
        setNotice(arrival);
        const now = performance.now();
        dispatchReaction({ type: 'arrival', milestone: arrival, now, visible: document.visibilityState === 'visible', hasBaseline: previous.current !== null, fresh: now <= pendingReactionDeadline.current });
      }
      pendingSource.current = undefined;
      previous.current = next; setData(next);
    } catch {
      if (request === sequence.current) {
        pendingReactionDeadline.current = 0;
        setError('Chưa tải được dấu chân. Bạn vẫn có thể bắt đầu hoặc lưu điểm tiếp tục.');
      }
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const visible = () => {
      if (document.visibilityState === 'visible') void refresh();
      else setReactionAllowed(false);
    };
    document.addEventListener('visibilitychange', visible);
    return () => { sequence.current++; document.removeEventListener('visibilitychange', visible); };
  }, [refresh, setReactionAllowed]);
  useEffect(() => {
    const reload = () => { void reloadArrangement().catch(() => {}); };
    const visible = () => { if (document.visibilityState === 'visible') reload(); };
    reload(); document.addEventListener('visibilitychange', visible);
    return () => document.removeEventListener('visibilitychange', visible);
  }, [reloadArrangement]);
  return <ForestContext.Provider value={{ data, loading, error, notice, reaction, setReactionAllowed, refresh, dismiss: () => { setNotice(null); dispatchReaction({ type: 'cancel' }); }, arrangement, arrangementError, reloadArrangement, saveArrangement }}>{children}</ForestContext.Provider>;
}

/** An inline, static view also carries progression when WebGL or motion is unavailable. */
export function ForestMemoryMark({ threshold }: { threshold: ForestThreshold | 0 }) {
  return <svg className="forest-memory-mark" viewBox="0 0 160 84" fill="none" aria-hidden="true">
    <path d="M12 72Q80 57 148 72" stroke="currentColor" strokeWidth="2" opacity=".5"/>
    {threshold >= 1 && <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M60 66V40M60 48C42 48 39 34 42 30C55 29 61 39 60 48ZM60 42C59 29 67 19 78 20C80 31 72 42 60 42Z" fill="currentColor" fillOpacity=".16"/>
    </g>}
    {threshold >= 3 && <g stroke="currentColor" strokeWidth="2">
      <path d="M87 65V48M99 66V54"/>
      <path d="M87 39C81 30 75 40 82 45C72 49 81 57 87 50C93 57 102 49 92 45C99 40 93 30 87 39ZM99 49C95 42 89 49 95 53C89 58 96 63 99 58C104 64 110 56 104 53C110 48 103 43 99 49Z" fill="currentColor" fillOpacity=".22"/>
    </g>}
    {threshold >= 7 && <g stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
      <path d="M118 68V24Q118 16 126 17Q134 18 132 27M124 31H140L137 51H127L124 31ZM128 27H136L140 31H124L128 27Z"/>
      <path d="M132 35V45" strokeWidth="4"/>
    </g>}
    {threshold === 0 && <path d="m59 64 8-4 7 3m18 0 5-3 5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>}
  </svg>;
}

export function ForestArrival() {
  const { notice, dismiss } = usePersonalForest();
  if (!notice) return null;
  return <div className="forest-arrival">
    <MartenIllustration className="forest-arrival-marten" pose={forestReactions[notice.threshold].pose}/>
    <div><p role="status">{forestMemories[notice.threshold].arrival}</p>
      <a href="#memory" onClick={dismiss}>Xem dấu chân</a></div>
  </div>;
}

export function PersonalForestSummary() {
  const { data, loading, error, refresh, arrangement } = usePersonalForest();
  useEffect(() => { void refresh(); }, [refresh]);
  const latest = data?.milestones.at(-1);
  return <section className="personal-forest-summary" aria-label="Góc rừng của bạn">
    <ForestArrival/>
    {data && <div className="personal-forest-summary-row">
      {arrangement ? <ForestPreview earned={data.milestones.map(item => item.threshold)} arrangement={arrangement}/> : <ForestMemoryMark threshold={latest?.threshold ?? 0}/>}
      <div><p>{latest ? forestMemories[latest.threshold].title : 'Một góc rừng đang đợi bạn.'}</p>
        <a href="#memory">Xem dấu chân của bạn</a></div>
    </div>}
    {loading && !data && <p role="status" className="field-hint">Đang mở dấu chân…</p>}
    {error && <p className="field-hint">{error} <button className="text-action" disabled={loading} onClick={() => void refresh()}>Tải lại dấu chân</button></p>}
  </section>;
}

export function PersonalForestJournal() {
  const { data, error, loading, refresh, arrangement } = usePersonalForest();
  useEffect(() => { void refresh(); }, [refresh]);
  const latest = data?.milestones.at(-1);
  return <section className="personal-forest-journal" aria-labelledby="personal-forest-title">
    <div className="personal-forest-heading"><div><p className="eyebrow">GÓC RỪNG CỦA BẠN</p><h2 id="personal-forest-title">Những điều ở lại.</h2></div>
      {data && <ForestMemoryMark threshold={latest?.threshold ?? 0}/>}</div>
    <p className="field-hint">Mỗi chặng đã khép lại đều có chỗ ở đây. Nghỉ bao lâu, khu rừng vẫn giữ những dấu chân của bạn.</p>
    {loading && !data && <p role="status">Đang mở dấu chân…</p>}
    {error && <p role="status">{error} <button className="text-action" disabled={loading} onClick={() => void refresh()}>Tải lại dấu chân</button></p>}
    {data && <>
      <p className="field-hint">{data.completedSessions === 0 ? 'Dấu chân đầu tiên sẽ xuất hiện khi một chặng khép lại.' : `${data.completedSessions} chặng đã khép lại · Chỉ riêng bạn.`}</p>
      <ol className="forest-milestones">{([1, 3, 7] as const).map(threshold => {
        const milestone = data.milestones.find(item => item.threshold === threshold);
        return <li key={threshold} data-earned={Boolean(milestone)}>
          <ForestMemoryMark threshold={threshold}/><div><h3>{forestMemories[threshold].title}</h3>
            {milestone ? <><p>{forestMemories[threshold].detail}</p><p className="field-hint">Đã lưu · <time dateTime={milestone.recordedAt}>{formatTime(milestone.recordedAt)}</time>{arrangement && <> · {arrangement.hidden.includes(threshold) ? 'Đang cất' : 'Đang hiện trong rừng'}</>}</p></>
              : <p className="field-hint">Sẽ xuất hiện sau {threshold} chặng khép lại, bất cứ khi nào bạn sẵn sàng.</p>}
          </div>
        </li>;
      })}</ol>
    </>}
  </section>;
}
