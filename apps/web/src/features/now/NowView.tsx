import type { FocusTimerStatus } from "../focus/focusTimer";
import type { HelpSuggestion, Task } from "../../shared/types/domain";

type NowViewProps = {
  task?: Task;
  focusStatus: FocusTimerStatus;
  format: string;
  helpSuggestion: HelpSuggestion | null;
  onCapture: () => void;
  onStart: (task: Task) => void;
  onPause: () => void;
  onComplete: () => void;
  onSmaller: (task: Task) => void;
  onAcceptHelp: () => void;
  onReset: () => void;
  onReturn: () => void;
};

export function NowView({ task, focusStatus, format, helpSuggestion, onCapture, onStart, onPause, onComplete, onSmaller, onAcceptHelp, onReset, onReturn }: NowViewProps) {
  const hasSession = focusStatus !== "idle";
  return <>
    <section className="hero">
      <p className="eyebrow">KHI MỌI THỨ ĐANG HƠI NHIỀU</p>
      <h1>Một bước nhỏ.<br /><span>Ngay lúc này.</span></h1>
      <p>Bạn không cần xử lý hết. Mình chỉ tìm một bước tiếp theo.</p>
    </section>
    <section className="feature-card next-action" aria-labelledby="next-action-title">
      <div className="card-heading">
        <p className="eyebrow">MỘT BƯỚC CÓ THỂ BẮT ĐẦU</p>
        {task && <span className="minutes">{task.minutes} phút là đủ</span>}
      </div>
      {task ? <>
        <h2 id="next-action-title">{task.title}</h2>
        <p>Không cần hoàn hảo. Hết thời gian, bạn có thể dừng hoặc tiếp tục.</p>
        {hasSession && <div className="session-summary">
          <span>{focusStatus === "running" ? "Đang tập trung" : focusStatus === "finished" ? "Hết thời gian gợi ý" : "Phiên đang tạm dừng"}</span>
          <span className="timer" aria-label={`Thời gian còn lại ${format}`}>{format}</span>
        </div>}
        {helpSuggestion?.taskId === task.id && <div className="notice">
          <strong>Gợi ý nhỏ hơn:</strong> {helpSuggestion.title}
          <div className="button-row"><button className="secondary" onClick={onAcceptHelp}>Dùng bước này</button></div>
        </div>}
        <div className="button-row">
          <button className="primary" onClick={() => focusStatus === "running" ? onPause() : onStart(task)}>
            {focusStatus === "running" ? "Tạm dừng" : hasSession ? "Quay lại phiên" : "Bắt đầu ngay"}<span aria-hidden="true"> →</span>
          </button>
          <button className="secondary" onClick={() => onSmaller(task)}>Vẫn bị kẹt</button>
          {hasSession && <button className="text-action" onClick={onComplete}>Đã xong</button>}
        </div>
      </> : <>
        <h2 id="next-action-title">Hiện không có việc nào cần chen vào.</h2>
        <p>Đặt xuống một điều đang chiếm tâm trí, khi bạn sẵn sàng.</p>
        <button className="primary" onClick={onCapture}>Trút bớt trong đầu <span aria-hidden="true">→</span></button>
      </>}
    </section>
    <section className="two-up supporting-actions" aria-label="Khi bạn cần một cách khác">
      <article className="capture-note">
        <p className="eyebrow">ĐẶT XUỐNG MỘT CHÚT</p>
        <h2>Đầu đang đầy?</h2>
        <p>Không cần viết đẹp hay sắp xếp trước.</p>
        <button className="text-action" onClick={onCapture}>Trút bớt trong đầu →</button>
      </article>
      <article className="reset-card">
        <p className="eyebrow">KHI KẾ HOẠCH VỠ</p>
        <h2>Hôm nay, nhẹ hơn.</h2>
        <p>Chọn lại điều còn thực tế với năng lượng hiện tại.</p>
        <div className="reset-actions">
          <button className="text-action" onClick={onReset}>Lập lại nhẹ nhàng →</button>
          <button className="text-action" onClick={onReturn}>Bắt đầu lại từ hôm nay</button>
        </div>
      </article>
    </section>
  </>;
}
