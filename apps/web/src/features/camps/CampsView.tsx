import "./camps.css";
import { useRef, useState } from "react";
import { createCamp, listCamps } from "../../shared/api/api";
import { useResource } from "../../shared/api/useResource";
import { ErrorMessage } from "../../shared/components/ui";
import { FirstTimeHint } from '../../shared/components/FirstTimeHint';
export function CampsView({ onOpen }: { onOpen: (id: string) => void; onNotice: (text: string) => void }) {
  const pending = useRef(false); const [open,setOpen] = useState(false);
  const resource = useResource(listCamps); const [name,setName] = useState(""); const [busy,setBusy] = useState(false); const [error,setError] = useState(""); const [uncertain,setUncertain] = useState(false);
  return <div className="camps-page"><section className="page-intro"><p className="eyebrow">CAMP RIÊNG</p><h1>Làm việc riêng.<br/>Có mặt cùng nhau.</h1><p>Một nhóm nhỏ với những người bạn đã biết. Nội dung công việc vẫn riêng tư.</p></section>
    <FirstTimeHint topic="camp" title="Camp dành cho ai?">Tạo nhóm nhỏ và mời người quen bằng link. Chỉ thành viên đã tham gia mới thấy Camp; ý định và Open Seed của mỗi người vẫn riêng.</FirstTimeHint>

    <section className="camp-list"><h2>Camp của bạn</h2><ErrorMessage message={resource.error} retry={resource.reload}/>{resource.loading ? <p role="status">Đang tìm nhóm của bạn…</p> : resource.data && (resource.data.camps.length ? <ul className="row-list">{resource.data.camps.map(camp => <li key={camp.id}><button className="text-action" onClick={() => onOpen(camp.id)}>{camp.name}</button><p className="field-hint">{camp.memberCount}/8 người · {camp.status === "archived" ? "Đã lưu trữ" : camp.myRole === "owner" ? "Bạn quản lý nhóm" : "Thành viên"}</p></li>)}</ul> : <p>Chưa có Camp. Bạn có thể tạo nhóm hoặc mở link mời từ một người quen.</p>)}</section>
    <button className="secondary" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Đóng form tạo nhóm" : "Tạo Camp"}</button>
    {open && <form className="camp-panel" onSubmit={e => { e.preventDefault(); if (pending.current) return; pending.current = true; setBusy(true); setError(""); void createCamp(name.trim()).then(value => onOpen(value.camp.id)).catch(async failure => { setError(failure.message); setUncertain(true); await resource.reload(); }).finally(() => { pending.current = false; setBusy(false); }); }}><h2>Tạo một Camp</h2><label>Tên nhóm<input autoFocus disabled={busy} value={name} required maxLength={80} onChange={e => setName(e.target.value)}/></label><p className="field-hint">{name.length}/80 ký tự</p><ErrorMessage message={error}/>{uncertain && <p>Hãy kiểm tra danh sách phía trên trước khi tạo lại. Yêu cầu trước có thể đã được xử lý.<button type="button" className="text-action" onClick={() => setUncertain(false)}>Đã kiểm tra, cho phép tạo lại</button></p>}<button className="primary" disabled={busy || uncertain || !name.trim()}>{busy ? "Đang tạo…" : "Tạo Camp"}</button></form>}
  </div>;
}
