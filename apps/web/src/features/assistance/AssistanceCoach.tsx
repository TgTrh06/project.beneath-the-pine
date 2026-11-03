import { useRef, useState } from 'react';
import type { AssistanceCapability, AssistanceResponse } from '@pyneath/contracts';
import { recordAssistanceInteraction, requestAssistance } from '../../shared/api/api';
import './assistance.css';

const enabled = import.meta.env.VITE_ASSISTANCE_DEMO === 'true';

export function AssistanceCoach({ capability, value, onChoose, disabled = false }: {
  capability: AssistanceCapability;
  value: string;
  onChoose: (value: string) => void;
  disabled?: boolean;
}) {
  const [result, setResult] = useState<AssistanceResponse | null>(null);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(false);
  const currentValue = useRef(value);
  const edited = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const proposalInput = useRef<HTMLTextAreaElement>(null);
  currentValue.current = value;
  if (!enabled) return null;

  const track = (action: 'viewed' | 'selected' | 'edited' | 'discarded', response = result) => {
    if (response?.status !== 'suggestion' || !response.suggestionId) return;
    void recordAssistanceInteraction({ capability, suggestionId: response.suggestionId, action }).catch(() => undefined);
  };
  const ask = async () => {
    if (active.current || disabled || !value.trim()) return;
    active.current = true;
    setPending(true); setError(''); setResult(null);
    const sent = value.trim();
    let focusProposal = false;
    try {
      const response = await requestAssistance(capability === 'assisted_start'
        ? { capability, description: sent }
        : { capability, context: sent });
      if (currentValue.current.trim() !== sent) return;
      setResult(response);
      if (response.status === 'suggestion') {
        setDraft(response.output.activationStep ?? response.output.openSeedDraft ?? '');
        edited.current = false;
        focusProposal = true;
        track('viewed', response);
      }
    } catch {
      setError('Chưa thể tạo gợi ý. Nội dung bạn đã nhập vẫn ở đây; hãy thử lại hoặc tự viết tiếp.');
    } finally {
      active.current = false; setPending(false);
      requestAnimationFrame(() => (focusProposal ? proposalInput.current : trigger.current)?.focus());
    }
  };
  const dismiss = () => { track('discarded'); setResult(null); setDraft(''); requestAnimationFrame(() => trigger.current?.focus()); };
  const choose = () => {
    if (!draft.trim()) return;
    track('selected'); setResult(null); onChoose(draft.trim());
  };
  return <section className="assistance-coach" aria-label={capability === 'assisted_start' ? 'Gợi ý bước bắt đầu' : 'Gợi ý điểm tiếp tục'}>
    <p className="field-hint">Bản demo: chỉ nhập dữ liệu giả. Nếu dịch vụ AI đang bật, yêu cầu này gửi nội dung vừa nhập tới OpenAI để tạo gợi ý. OpenAI không dùng dữ liệu API để huấn luyện theo mặc định; log chống lạm dụng có thể giữ nội dung tối đa 30 ngày.</p>
    <button ref={trigger} type="button" className="text-action" disabled={disabled || pending || !value.trim()} onClick={() => void ask()}>{pending ? 'Đang tạo gợi ý…' : capability === 'assisted_start' ? 'Gợi ý một bước 3–10 phút' : 'Gợi ý câu quay lại'}</button>
    {pending && <p role="status">Đang tạo bản nháp. Bạn vẫn có thể tự viết tiếp.</p>}
    {error && <p role="alert">{error}</p>}
    {result?.status !== 'suggestion' && result?.output.message && <p role="status">{result.output.message}</p>}
    {result?.status === 'suggestion' && <div className="assistance-coach__proposal" aria-live="polite">
      <label>Bản nháp gợi ý<textarea ref={proposalInput} value={draft} maxLength={capability === 'assisted_start' ? 280 : 500} onChange={event => { setDraft(event.target.value); if (!edited.current) { edited.current = true; track('edited'); } }} /></label>
      {result.output.estimatedMinutes && <p className="field-hint">Bước gợi ý: khoảng {result.output.estimatedMinutes} phút. Thời lượng Focus bạn đã chọn không thay đổi.</p>}
      <div className="button-row"><button type="button" className="secondary" disabled={!draft.trim()} onClick={choose}>Dùng bản nháp</button><button type="button" className="text-action" onClick={dismiss}>Bỏ gợi ý</button></div>
    </div>}
  </section>;
}
