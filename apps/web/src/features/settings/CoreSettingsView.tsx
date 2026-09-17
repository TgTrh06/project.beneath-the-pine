import { useEffect, useState } from "react";
import { deleteAccount, exportData, getProfile, updateProfile } from "../../shared/api/api";
import { expireSession } from "../../shared/auth/auth";
import { useResource } from "../../shared/api/useResource";
import { Dialog, ErrorMessage } from "../../shared/components/ui";
import { ThemeSelect } from "../../shared/theme/ThemeSelect";
import { deviceTimezone, validTimezone } from "../../shared/time";

export function CoreSettingsView({ email, onDeleted }: { email: string; onDeleted: () => void; onNotice: (text: string) => void }) {
  const profile = useResource(getProfile);
  const [name,setName] = useState(""); const [timezone,setTimezone] = useState(deviceTimezone);
  const [password,setPassword] = useState(""); const [confirm,setConfirm] = useState(false);
  const [busy,setBusy] = useState(false); const [error,setError] = useState(""); const [message,setMessage] = useState("");
  useEffect(() => { if (profile.data) { setName(profile.data.profile?.displayName ?? ""); setTimezone(profile.data.profile?.timezone ?? deviceTimezone()); } },[profile.data]);
  const act = async (action:()=>Promise<unknown>) => { if(busy) return; setBusy(true); setError(""); setMessage(""); try { await action(); } catch(e) { setError((e as Error).message); } finally { setBusy(false); } };
  return <div className="narrow-content"><section className="page-intro"><p className="eyebrow">CÀI ĐẶT</p><h1>Khoảng riêng của bạn.</h1><p>{email}</p></section><ErrorMessage message={error}/>{message && <p className="notice" role="status">{message}</p>}
    <section className="feature-card"><h2>Hồ sơ Wanderer</h2><ErrorMessage message={profile.error} retry={profile.reload}/>{profile.loading ? <p role="status">Đang mở hồ sơ…</p> : profile.data && <form onSubmit={e => { e.preventDefault(); void act(async () => { await updateProfile({ displayName:name.trim() || null,timezone }); setMessage("Đã lưu hồ sơ."); }); }}><label>Tên hiển thị<input value={name} maxLength={80} onChange={e => setName(e.target.value)} /></label><label>Múi giờ IANA<input value={timezone} required maxLength={64} onChange={e => setTimezone(e.target.value)}/></label><p className="field-hint">Ví dụ: Asia/Ho_Chi_Minh. Tên hiển thị có thể để trống.</p><button className="primary" disabled={busy || !validTimezone(timezone)}>{busy ? "Đang lưu…" : "Lưu hồ sơ"}</button></form>}</section>
    <section className="feature-card"><h2>Ánh sáng dưới tán thông</h2><ThemeSelect/><p className="field-hint">Lựa chọn được ghi nhớ trên trình duyệt này.</p></section>
    <section className="feature-card"><h2>Dữ liệu thuộc về bạn</h2><p>Tải bản sao hồ sơ, điểm tiếp tục và lịch sử của bạn.</p><button className="secondary" disabled={busy} onClick={() => void act(async () => { const data = await exportData(); const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"})); const anchor = document.createElement("a"); anchor.href=url; anchor.download="beneath-the-pine-export.json"; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url),1000); setMessage("Đã chuẩn bị bản xuất dữ liệu."); })}>Tải bản JSON</button></section>
    <section className="feature-card"><h2>Xóa tài khoản</h2><p>Dữ liệu riêng sẽ bị xóa. Circle có thành viên khác được chuyển quyền; Circle chỉ có bạn sẽ bị xóa. Thao tác không thể hoàn tác.</p><button className="danger" disabled={busy} onClick={() => { setPassword(""); setError(""); setConfirm(true); }}>Yêu cầu xóa tài khoản</button></section>
    {confirm && <Dialog title="Xóa tài khoản của bạn?" onClose={() => { if (!busy) { setConfirm(false); setPassword(""); } }}><p>Nhập mật khẩu hiện tại để xác nhận. Dữ liệu đã xóa không thể khôi phục.</p><form onSubmit={e => { e.preventDefault(); void act(async () => { await deleteAccount(password); setPassword(""); setConfirm(false); onDeleted(); expireSession(true); }); }}><label>Mật khẩu hiện tại<input type="password" value={password} required minLength={12} maxLength={64} autoComplete="current-password" onChange={e => setPassword(e.target.value)}/></label><ErrorMessage message={error}/><button className="danger" disabled={busy || password.length < 12}>{busy ? "Đang xóa…" : "Xóa tài khoản vĩnh viễn"}</button></form></Dialog>}
  </div>;
}
