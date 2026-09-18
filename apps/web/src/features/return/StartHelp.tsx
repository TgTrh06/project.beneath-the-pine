import { useId, useRef, useState } from "react";
import { Dialog } from "../../shared/components/ui";

const examples = ["Mở tài liệu cần đọc.", "Viết một câu đầu tiên.", "Đọc lại email cần trả lời."];

export function StartHelp({ value, onChoose }: { value: string; onChoose: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const apply = (text: string) => { setPending(null); setOpen(false); onChoose(text); };
  return <div className="start-help">
    <button ref={trigger} type="button" className="text-action" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>Chưa biết bắt đầu từ đâu?</button>
    {open && <section id={id} aria-label="Hướng dẫn bắt đầu">
      <ol><li>Chọn một việc đang vướng.</li><li>Thu nhỏ thành việc có thể bắt đầu trong vài phút.</li><li>Viết hành động đầu tiên vào ô nhập.</li></ol>
      <p className="field-hint">Ví dụ có sẵn — bạn có thể sửa lại cho phù hợp.</p>
      <ul>{examples.map(text => <li key={text}><span>{text}</span><button type="button" className="text-action" aria-label={`Dùng ví dụ: ${text}`} onClick={() => value.trim() && value !== text ? setPending(text) : apply(text)}>Dùng ví dụ này</button></li>)}</ul>
      <button type="button" className="text-action" onClick={() => { setOpen(false); trigger.current?.focus(); }}>Đóng hướng dẫn</button>
    </section>}
    {pending !== null && <Dialog title="Thay nội dung đang viết?" onClose={() => setPending(null)}><p>Nội dung trong ô nhập sẽ được thay bằng ví dụ:</p><p>{pending}</p><div className="button-row"><button type="button" className="primary" onClick={() => apply(pending)}>Thay bằng ví dụ</button><button type="button" className="secondary" onClick={() => setPending(null)}>Giữ nội dung của tôi</button></div></Dialog>}
  </div>;
}
