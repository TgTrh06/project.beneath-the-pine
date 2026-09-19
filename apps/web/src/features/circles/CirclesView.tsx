import "./circles.css";
import { useRef, useState } from "react";
import { createCircle, listCircles } from "../../shared/api/api";
import { useResource } from "../../shared/api/useResource";
import { ErrorMessage } from "../../shared/components/ui";
export function CirclesView({ onOpen }: { onOpen: (id: string) => void; onNotice: (text: string) => void }) {
  const pending = useRef(false); const [open,setOpen] = useState(false);
  const resource = useResource(listCircles); const [name,setName] = useState(""); const [busy,setBusy] = useState(false); const [error,setError] = useState(""); const [uncertain,setUncertain] = useState(false);
  return <div className="circles-page"><section className="page-intro"><p className="eyebrow">CIRCLE RIÊNG</p><h1>Làm việc riêng.<br/>Có mặt cùng nhau.</h1><p>Một nhóm nhỏ với những người bạn đã biết. Nội dung công việc vẫn riêng tư.</p></section>
    <section className="circle-list"><h2>Circle của bạn</h2><ErrorMessage message={resource.error} retry={resource.reload}/>{resource.loading ? <p role="status">Đang tìm nhóm của bạn…</p> : resource.data && (resource.data.circles.length ? <ul className="row-list">{resource.data.circles.map(circle => <li key={circle.id}><button className="text-action" onClick={() => onOpen(circle.id)}>{circle.name}</button><p className="field-hint">{circle.memberCount}/8 người · {circle.status === "archived" ? "Đã lưu trữ" : circle.myRole === "owner" ? "Bạn quản lý nhóm" : "Thành viên"}</p></li>)}</ul> : <p>Chưa có Circle. Bạn có thể tạo nhóm hoặc mở link mời từ một người quen.</p>)}</section>
    <button className="secondary" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Đóng form tạo nhóm" : "Tạo Circle"}</button>
    {open && <form className="circle-panel" onSubmit={e => { e.preventDefault(); if (pending.current) return; pending.current = true; setBusy(true); setError(""); void createCircle(name.trim()).then(value => onOpen(value.circle.id)).catch(async failure => { setError(failure.message); setUncertain(true); await resource.reload(); }).finally(() => { pending.current = false; setBusy(false); }); }}><h2>Tạo một Circle</h2><label>Tên nhóm<input autoFocus disabled={busy} value={name} required maxLength={80} onChange={e => setName(e.target.value)}/></label><p className="field-hint">{name.length}/80 ký tự</p><ErrorMessage message={error}/>{uncertain && <p>Hãy kiểm tra danh sách phía trên trước khi tạo lại. Yêu cầu trước có thể đã được xử lý.<button type="button" className="text-action" onClick={() => setUncertain(false)}>Đã kiểm tra, cho phép tạo lại</button></p>}<button className="primary" disabled={busy || uncertain || !name.trim()}>{busy ? "Đang tạo…" : "Tạo Circle"}</button></form>}
  </div>;
}
