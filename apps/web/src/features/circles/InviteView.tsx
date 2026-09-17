import { useState } from "react";
import { acceptCircleInvite } from "../../shared/api/api";
import { ErrorMessage } from "../../shared/components/ui";
export function InviteView({ token, onOpen }: { token: string; onOpen: (id: string) => void }) {
  const [busy,setBusy] = useState(false); const [error,setError] = useState("");
  return <section className="feature-card narrow-content"><p className="eyebrow">LỜI MỜI RIÊNG</p><h1>Một khoảng yên cùng người quen.</h1><p>Chỉ nhận lời nếu link này đến từ người bạn biết. Thông tin nhóm sẽ hiện sau khi tham gia.</p><ErrorMessage message={error}/><button className="primary" disabled={busy} onClick={() => { if (busy) return; setBusy(true); setError(""); void acceptCircleInvite(token).then(value => { history.replaceState(null,"", "#circles"); onOpen(value.circleId); }).catch(failure => setError(failure.message)).finally(() => setBusy(false)); }}>{busy ? "Đang nhận lời…" : "Xác nhận tham gia Circle"}</button><p className="field-hint">Nếu không thể nhận lời, hãy nhờ người gửi kiểm tra hoặc tạo link mới.</p></section>;
}
