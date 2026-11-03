import { useEffect, useId, useState, type Dispatch, type SetStateAction } from 'react';
import { putSeed } from '../../shared/api/api';
import { ErrorMessage } from '../../shared/components/ui';

type Props = {
  microstep: string;
  setMicrostep: Dispatch<SetStateAction<string>>;
  seedDraft: string;
  setSeedDraft: Dispatch<SetStateAction<string>>;
  breakUntil: number | null;
  setBreakUntil: Dispatch<SetStateAction<number | null>>;
  pact: boolean;
  connection: string;
  onPresence: (value: 'active' | 'break') => void;
  onFinish: () => void;
  embedded?: boolean;
};

export function StuckRecovery({ microstep, setMicrostep, seedDraft, setSeedDraft, breakUntil, setBreakUntil, pact, connection, onPresence, onFinish, embedded=false }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(Date.now);
  const panelId = useId();
  useEffect(() => {
    if (breakUntil === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [breakUntil]);

  const startBreak = () => {
    if (pact && connection !== 'live') {
      setError('Chưa đồng bộ được phiên. Hãy đồng bộ lại trước khi báo đang nghỉ.');
      return;
    }
    setError(''); setMessage('');
    if (pact) onPresence('break');
    const startedAt = Date.now();
    setNow(startedAt);
    setBreakUntil(startedAt + 120000);
  };
  const endBreak = () => {
    if (pact && connection !== 'live') {
      setError('Chưa đồng bộ được phiên. Hãy đồng bộ lại trước khi báo trở lại.');
      return;
    }
    if (pact) onPresence('active');
    setBreakUntil(null);
    setError(''); setMessage('Bạn có thể tiếp tục bằng một bước nhỏ.');
  };
  const saveSeed = async () => {
    if (busy || !seedDraft.trim()) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await putSeed(seedDraft.trim());
      setSeedDraft('');
      setMessage('Đã lưu điểm tiếp tục riêng cho bạn. Phiên vẫn đang chạy.');
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return <div className="stuck-recovery">
    {!embedded&&<button type="button" className="text-action" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}>Mình đang bị kẹt</button>}
    {(open||embedded) && <section id={panelId} aria-label="Chọn bước tiếp theo khi bị kẹt">
      <h2>Một bước tiếp theo là đủ.</h2>
      <label>Thu nhỏ việc trước mắt thành một hành động<textarea value={microstep} maxLength={280} onChange={event => setMicrostep(event.target.value)} placeholder="Ví dụ: mở tài liệu và đọc đoạn đầu"/></label>
      <p className="field-hint">{embedded?'Bản nháp này chỉ nằm trong tab của bạn.':'Bản nháp này chỉ nằm trong tab của bạn, không hiện cho Camp.'}</p>
      <div className="button-row"><button type="button" className="secondary" onClick={startBreak} disabled={breakUntil !== null}>Nghỉ ngắn 2 phút</button>
        <button type="button" className="secondary" onClick={onFinish}>Kết thúc và checkout</button></div>
      {breakUntil !== null && <div role="status"><p>{now < breakUntil ? `Còn ${Math.ceil((breakUntil - now) / 1000)} giây nghỉ. Đồng hồ Focus vẫn chạy.` : 'Khoảng nghỉ đã hết. Bạn có thể trở lại khi sẵn sàng.'}</p><button type="button" className="text-action" onClick={endBreak}>Trở lại tập trung</button></div>}
      <label>Lưu một điểm tiếp tục riêng cho lần sau<textarea value={seedDraft} maxLength={500} onChange={event => setSeedDraft(event.target.value)} /></label>
      <p className="field-hint">{seedDraft.length}/500 ký tự · Lưu Seed không khép phiên.</p>
      <button type="button" className="secondary" disabled={busy || !seedDraft.trim()} onClick={() => void saveSeed()}>{busy ? 'Đang lưu…' : 'Lưu Open Seed'}</button>
      <ErrorMessage message={error}/>
      {message && <p role="status">{message}</p>}
    </section>}
  </div>;
}
