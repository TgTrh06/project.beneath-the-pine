import type { StuckMode } from '@pyneath/contracts';
import { assistanceDisclosure, assistanceLabels } from './assistanceState';
import { useAssistance, type AssistanceOptions } from './useAssistance';
import './assistance.css';

export function AssistanceCoach(props: AssistanceOptions) {
  const { capability, value, disabled = false, breakDisabled = false, onTakeBreak, onValueChange } = props;
  const { available, config, mode, setMode, visibleResult, draft, pending, error, trigger, proposalInput, ask, dismiss, choose, takeBreak, editDraft } = useAssistance(props);
  if (!available || !config) return null;
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
        <label>Bản nháp gợi ý<textarea ref={proposalInput} value={draft} maxLength={capability === 'open_seed_draft' ? 500 : 280} onChange={event => editDraft(event.target.value)} /></label>
        {visibleResult.output.estimatedMinutes && <p className="field-hint">Bước gợi ý: khoảng {visibleResult.output.estimatedMinutes} phút. Thời lượng Focus bạn đã chọn không thay đổi.</p>}
        <button type="button" className="secondary" disabled={disabled || !draft.trim()} onClick={choose}>Dùng bản nháp</button>
      </>}
      <button type="button" className="text-action" onClick={dismiss}>Bỏ gợi ý</button>
    </div>}
  </section>;
}
