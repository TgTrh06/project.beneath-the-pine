import { useEffect, useId, useRef, type ReactNode } from "react";
export type Duration = 5 | 10 | 25 | 50;
export function DurationPicker({ value, onChange }: { value: Duration; onChange: (value: Duration) => void }) {
  return <fieldset className="duration-picker"><legend>Khoảng tập trung</legend><div>{([5, 10, 25, 50] as const).map(minutes => <button type="button" className="choice" key={minutes} aria-pressed={value === minutes} onClick={() => onChange(minutes)}>{minutes} phút</button>)}</div></fieldset>;
}
export function ErrorMessage({ message, retry }: { message: string; retry?: () => void }) {
  return message ? <div className="notice error-notice" role="alert">{message}{retry && <button className="text-action" onClick={retry}>Thử lại</button>}</div> : null;
}
export function Dialog({ title, children, onClose, kind }: { title: string; children: ReactNode; onClose: () => void; kind?: "menu" }) {
  const ref = useRef<HTMLDialogElement>(null); const id = useId();
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow; const dialog = ref.current!; dialog.showModal(); document.body.style.overflow = "hidden"; return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus(); }; }, []);
  return <dialog className={kind === "menu" ? "pine-dialog pine-dialog-menu" : "pine-dialog"} ref={ref} aria-labelledby={id} onCancel={event => { event.preventDefault(); onClose(); }}><div className="dialog-heading"><h2 id={id}>{title}</h2><button className="secondary" onClick={onClose} aria-label="Đóng">×</button></div>{children}</dialog>;
}
