import { useEffect, useRef, type KeyboardEvent } from "react";
import type { FocusTimerStatus } from "./focusTimer";
import { formatFocusTime } from "./focusTimer";

type FocusTask = { title: string; minutes: number };

export function FocusRoom({ task, seconds, status, saving, onPause, onResume, onDone, onStillStuck, onExit }: {
  task: FocusTask;
  seconds: number;
  status: FocusTimerStatus;
  saving: boolean;
  onPause: () => void;
  onResume: () => void;
  onDone: () => void;
  onStillStuck: () => void;
  onExit: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    exitRef.current?.focus();
    return () => previousFocus?.focus();
  }, []);

  const running = status === "running";
  const finished = status === "finished";
  const statusText = running ? "Đang tập trung" : finished ? "Hết thời gian gợi ý" : "Đã tạm dừng";

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") { event.preventDefault(); onExit(); return; }
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])");
    if (!focusable?.length) return;
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  return <div className="focus-room" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="focus-room-title" onKeyDown={handleKeyDown}>
    <div className="focus-room__header">
      <p className="eyebrow">PHIÊN TẬP TRUNG</p>
      <button className="link-button" ref={exitRef} onClick={onExit}>Rời phiên</button>
    </div>
    <div className="focus-room__body">
      <span className="minutes">{task.minutes} phút là đủ</span>
      <h1 id="focus-room-title">{task.title}</h1>
      <p className="focus-room__status" aria-live="polite">{statusText}</p>
      <output className="focus-room__timer" aria-label={`Còn lại ${formatFocusTime(seconds)}`}>{formatFocusTime(seconds)}</output>
      <p className="focus-room__hint">Bạn có thể dừng, đổi bước nhỏ hơn hoặc chỉ làm đến đây.</p>
      <div className="button-row focus-room__actions">
        {running ? <button className="secondary" onClick={onPause}>Tạm dừng</button> : <button className="primary" onClick={onResume}>{finished ? "Tiếp tục thêm một chút" : "Tiếp tục"}</button>}
        <button className="primary" disabled={saving} onClick={onDone}>Đã xong</button>
        <button className="text-action" disabled={saving} onClick={onStillStuck}>Vẫn bị kẹt</button>
      </div>
    </div>
  </div>;
}
