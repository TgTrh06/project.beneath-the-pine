import type { StuckMode } from '@pyneath/contracts';
import { assistanceDisclosure, assistanceLabels } from './assistanceState';
import { useAssistance, type AssistanceOptions } from './useAssistance';
import './assistance.css';

export function AssistanceCoach(props: AssistanceOptions) {
  const { capability, value, disabled = false, breakDisabled = false, onTakeBreak, onValueChange } = props;
  const { available, config, toolsConfig, context, contextPending, contextError, selectedTools, loadContext, toggleTool,
    mode, setMode, visibleResult, draft, pending, error, trigger, proposalInput, ask, dismiss, choose, takeBreak, editDraft } = useAssistance(props);
  if (!available || !config) return null;
  return <section className="assistance-coach" aria-label={assistanceLabels[capability]}>
    <p className="field-hint">{assistanceDisclosure(config.processing, toolsConfig?.provider)}</p>
    {toolsConfig?.enabled && <fieldset className="assistance-coach__context">
      <legend>Ngữ cảnh cho gợi ý (không bắt buộc)</legend>
      <p className="field-hint">Chỉ mục được bạn chọn bên dưới mới có thể gửi tới dịch vụ AI khi bấm yêu cầu gợi ý. AI chỉ đọc; không tự lưu hoặc đổi phiên.</p>
      <button type="button" className="text-action" disabled={disabled || contextPending || pending} onClick={() => void loadContext()}>{contextPending ? 'Đang đọc ngữ cảnh…' : context ? 'Đọc lại ngữ cảnh' : 'Xem ngữ cảnh của tôi'}</button>
      {contextPending && <p role="status">Đang đọc từ Pyneath; chưa gửi tới dịch vụ AI.</p>}
      {contextError && <p role="alert">{contextError}</p>}
      {context?.tools.map(tool => <div key={tool.name} className="assistance-coach__context-item">
        <label><input type="checkbox" checked={selectedTools.includes(tool.name)} disabled={disabled || contextPending}
          onChange={event => toggleTool(tool.name, event.target.checked)} />Cho phép gửi {tool.name === 'get_current_focus_context' ? 'phiên hiện tại' : 'Open Seed của tôi'}</label>
        {tool.name === 'get_current_focus_context' ? tool.data ? <p>
          {tool.data.kind === 'solo' ? 'Solo' : 'Pact'} · {tool.data.durationMinutes} phút · Đang diễn ra · {({ active: 'Đang tập trung', break: 'Đang nghỉ', disconnected: 'Mất kết nối' } as const)[tool.data.presence]}<br />
          Kết thúc: {new Date(tool.data.endsAt).toLocaleString('vi-VN')}<br />
          Việc của tôi: {tool.data.intention ?? 'Chưa nhập nội dung'}
        </p> : <p>Không có phiên đang diễn ra.</p>
          : <p>{tool.data?.text ?? 'Chưa có Open Seed.'}</p>}
      </div>)}
      {context && <p className="field-hint">Quyền dùng ngữ cảnh hết hạn sau 5 phút. Nếu nội dung đã đổi, hãy đọc lại và chọn lại.</p>}
    </fieldset>}
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
