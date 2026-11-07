import { useEffect, useRef, useState } from 'react';
import { assistanceConfigSchema, assistanceResponseSchema, type AssistanceCapability, type AssistanceConfig, type AssistanceRequest, type AssistanceResponse, type StuckMode } from '@pyneath/contracts';
import { getAssistanceConfig, recordAssistanceInteraction, requestAssistance } from '../../shared/api/api';
import './assistance.css';

const enabled = import.meta.env.VITE_ASSISTANCE_DEMO === 'true';
export const assistanceLabels = {
  assisted_start: 'Gợi ý một bước 3–10 phút', open_seed_draft: 'Gợi ý câu quay lại', stuck_recovery: 'Gợi ý cách tiếp tục'
};
export function makeAssistanceRequest(capability: AssistanceCapability, value: string, stuckMode: StuckMode): AssistanceRequest {
  const text = value.trim();
  return capability === 'assisted_start' ? { capability, description: text }
    : capability === 'open_seed_draft' ? { capability, context: text }
    : { capability, currentStep: text, stuckMode };
}
export function assistanceDisclosure(processing: AssistanceConfig['processing']) {
  return processing === 'self_hosted'
    ? 'Bản demo: chỉ nhập dữ liệu giả. Nội dung vừa nhập được gửi đến máy chủ Pyneath để tạo gợi ý.'
    : 'Bản demo: chỉ nhập dữ liệu giả. Yêu cầu này gửi nội dung vừa nhập tới OpenAI để tạo gợi ý. OpenAI không dùng dữ liệu API để huấn luyện theo mặc định; log chống lạm dụng có thể giữ nội dung tối đa 30 ngày.';
}

export function AssistanceCoach({ capability, value, onChoose, disabled = false, onTakeBreak, breakDisabled = false, onValueChange }: {
  capability: AssistanceCapability; value: string; onChoose: (value: string) => void;
  disabled?: boolean; onTakeBreak?: () => void; breakDisabled?: boolean;
  onValueChange?: (value: string) => void;
}) {
  const [config, setConfig] = useState<AssistanceConfig | null>(null);
  const [mode, setMode] = useState<StuckMode>('too_large');
  const [result, setResult] = useState<AssistanceResponse | null>(null);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(false);
  const mounted = useRef(true);
  const edited = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const proposalInput = useRef<HTMLTextAreaElement>(null);
  const signature = JSON.stringify(makeAssistanceRequest(capability, value, mode));
  const current = useRef(signature);
  const revision = useRef(0);
  if (current.current !== signature) { revision.current++; current.current = signature; }
  const [resultRevision, setResultRevision] = useState(-1);
  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    if (enabled) void getAssistanceConfig().then(value => {
      if (!cancelled) setConfig(assistanceConfigSchema.parse(value));
    }).catch(() => { if (!cancelled) setConfig(null); });
    return () => { cancelled = true; mounted.current = false; };
  }, []);
  if (!enabled || !config?.enabled || !config.capabilities.includes(capability)) return null;
  const visibleResult = resultRevision === revision.current ? result : null;

  const track = (action: 'viewed' | 'selected' | 'edited' | 'discarded', response = visibleResult) => {
    if (response?.status === 'suggestion' && response.suggestionId) void recordAssistanceInteraction({ capability, suggestionId: response.suggestionId, action }).catch(() => undefined);
  };
  const ask = async () => {
    if (active.current || disabled || !value.trim()) return;
    active.current = true; setPending(true); setError(''); setResult(null);
    const sentRevision = revision.current;
    let focusProposal = false;
    try {
      const response = assistanceResponseSchema.parse(await requestAssistance(makeAssistanceRequest(capability, value, mode)));
      if (!mounted.current || revision.current !== sentRevision) return;
      if (response.output.capability !== capability) throw new Error('Capability mismatch');
      setResult(response); setResultRevision(sentRevision);
      if (response.status === 'suggestion') {
        setDraft(response.output.activationStep ?? response.output.openSeedDraft ?? response.output.recoveryStep ?? '');
        edited.current = false; focusProposal = response.output.recoveryAction !== 'take_break'; track('viewed', response);
      }
    } catch {
      if (mounted.current && revision.current === sentRevision) setError('Chưa thể tạo gợi ý. Nội dung bạn đã nhập vẫn ở đây; hãy thử lại hoặc tự viết tiếp.');
    } finally {
      active.current = false;
      if (mounted.current) {
        setPending(false);
        if (revision.current === sentRevision) requestAnimationFrame(() => (focusProposal ? proposalInput.current : trigger.current)?.focus());
      }
    }
  };
  const dismiss = () => { track('discarded'); setResult(null); setDraft(''); requestAnimationFrame(() => trigger.current?.focus()); };
  const choose = () => {
    if (!draft.trim() || disabled || !visibleResult) return;
    track('selected'); setResult(null); onChoose(draft.trim());
  };
  const takeBreak = () => {
    if (!onTakeBreak || disabled || breakDisabled || !visibleResult) return;
    track('selected'); setResult(null); onTakeBreak();
  };
  return <section className="assistance-coach" aria-label={assistanceLabels[capability]}>
    <p className="field-hint">{assistanceDisclosure(config.processing)}</p>
    {capability === 'stuck_recovery' && onValueChange && <label>Việc đang vướng<textarea value={value} maxLength={280} onChange={event => onValueChange(event.target.value)} placeholder="Mô tả bước bạn đang muốn tiếp tục" /></label>}
    {capability === 'stuck_recovery' && <label>Điều gì đang làm bạn mắc kẹt?<select value={mode} onChange={event => setMode(event.target.value as StuckMode)} disabled={disabled}>
      <option value="too_large">Việc đang quá lớn</option><option value="unclear_next_step">Chưa rõ bước tiếp theo</option>
      <option value="distracted">Khó giữ tập trung</option><option value="low_energy">Đang ít năng lượng</option>
    </select></label>}
    <button ref={trigger} type="button" className="text-action" disabled={disabled || pending || !value.trim()} onClick={() => void ask()}>{pending ? 'Đang tạo gợi ý…' : assistanceLabels[capability]}</button>
    {pending && <p role="status">Đang tạo bản nháp. Bạn vẫn có thể tự viết tiếp.</p>}
    {error && <p role="alert">{error}</p>}
    {visibleResult?.status !== 'suggestion' && visibleResult?.output.message && <p role="status">{visibleResult.output.message}</p>}
    {visibleResult?.status === 'suggestion' && <div className="assistance-coach__proposal" aria-live="polite">
      {visibleResult.output.recoveryAction === 'take_break' ? <>
        <p>Bạn có thể nghỉ ngắn 2 phút. Đồng hồ Focus vẫn chạy.</p>
        <button type="button" className="secondary" disabled={disabled || breakDisabled || !onTakeBreak} onClick={takeBreak}>Nghỉ 2 phút</button>
      </> : <>
        <label>Bản nháp gợi ý<textarea ref={proposalInput} value={draft} maxLength={capability === 'open_seed_draft' ? 500 : 280} onChange={event => { setDraft(event.target.value); if (!edited.current) { edited.current = true; track('edited'); } }} /></label>
        {visibleResult.output.estimatedMinutes && <p className="field-hint">Bước gợi ý: khoảng {visibleResult.output.estimatedMinutes} phút. Thời lượng Focus bạn đã chọn không thay đổi.</p>}
        <button type="button" className="secondary" disabled={disabled || !draft.trim()} onClick={choose}>Dùng bản nháp</button>
      </>}
      <button type="button" className="text-action" onClick={dismiss}>Bỏ gợi ý</button>
    </div>}
  </section>;
}
