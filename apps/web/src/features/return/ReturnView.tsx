import { useRef, useState } from "react";
import { ApiRequestError, deleteSeed, getProfile, getReturnState, newRequestKey, startSolo, updateProfile } from "../../shared/api/api";
import { useResource } from "../../shared/api/useResource";
import { requestKeyStore } from "../../shared/api/requestKey";
import { Dialog, DurationPicker, ErrorMessage, type Duration } from "../../shared/components/ui";
import { deviceTimezone, formatTime, validTimezone } from "../../shared/time";
import { usePrivateDraft } from "../../shared/auth/usePrivateDraft";

const loadReturn = async () => {
  const [state, profile] = await Promise.all([getReturnState(), getProfile()]);
  return { ...state, timezone: profile.profile?.timezone ?? deviceTimezone() };
};
export function ReturnView({ onSession, onPact }: { onSession: (id: string) => void; onPact: (id: string) => void; onNotice: (text: string) => void }) {
  const resource = useResource(loadReturn); const state = resource.data;
  const [intention, setIntention, clearIntention] = usePrivateDraft("return:intention", "");
  const [duration, setDuration, clearDuration] = usePrivateDraft<Duration>("return:duration", 10);
  const [editing, setEditing, clearEditing] = usePrivateDraft("return:editing", false);
  const [keys] = usePrivateDraft("return:request-key", () => requestKeyStore(newRequestKey));
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [confirm, setConfirm] = useState(false);
  const [timezone, setTimezone] = useState(deviceTimezone); const input = useRef<HTMLTextAreaElement>(null);
  const perform = async (action: () => Promise<unknown>) => {
    if (busy) return; setBusy(true); setError("");
    try { await action(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  if (!state) return <><ErrorMessage message={resource.error} retry={resource.reload}/>{resource.loading && <p role="status">Đang tìm điểm bạn đã dừng…</p>}</>;
  return <div className="narrow-content"><ErrorMessage message={error || resource.error} retry={resource.error ? resource.reload : undefined}/>
    {state.activeSession ? <section className="feature-card warm-card"><p className="eyebrow">PHIÊN ĐANG MỞ</p><h1>Bạn vẫn có thể quay lại.</h1><p>Một chặng đang đợi bạn tiếp tục.</p><button className="primary" onClick={() => onSession(state.activeSession!.id)}>Quay lại phiên</button></section>
    : !state.profileReady ? <form className="feature-card" onSubmit={e => { e.preventDefault(); void perform(async () => { await updateProfile({ timezone }); await resource.reload(); }); }}><p className="eyebrow">BƯỚC ĐẦU TIÊN</p><h1>Giờ địa phương của bạn.</h1><p>Kiểm tra múi giờ để Pine hiển thị đúng lịch hẹn.</p><label>Múi giờ IANA<input value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="Asia/Ho_Chi_Minh" required /></label><button className="primary" disabled={busy || !validTimezone(timezone)}>{busy ? "Đang lưu…" : "Xác nhận múi giờ"}</button></form>
    : <><section className="page-intro"><p className="eyebrow">QUAY LẠI</p><h1>{state.openSeed ? "Lần trước bạn dừng ở đây." : "Một bước thôi, ngay lúc này."}</h1><p>Không cần biết cả con đường. Chỉ cần bước tiếp theo.</p></section>
      {state.openSeed && <section className="feature-card warm-card"><p className="eyebrow">ĐIỂM TIẾP TỤC · OPEN SEED</p><blockquote>{state.openSeed.text}</blockquote>{!editing && <div className="button-row"><button className="primary" onClick={() => { setEditing(true); if (state.openSeed!.text.length <= 280) setIntention(state.openSeed!.text); else setError("Điểm tiếp tục dài hơn 280 ký tự. Hãy viết gọn việc bạn muốn bắt đầu bên dưới."); requestAnimationFrame(() => input.current?.focus()); }}>Tiếp tục từ đây</button><button className="text-action" onClick={() => { setEditing(true); setIntention(""); }}>Bắt đầu việc khác</button></div>}<button className="text-action" disabled={busy} onClick={() => setConfirm(true)}>Bỏ điểm này</button></section>}
      {(!state.openSeed || editing) && <form className="feature-card" onSubmit={e => { e.preventDefault(); void perform(async () => {
        const payload = { intention:intention.trim(), durationMinutes:duration };
        try { const value = await startSolo(payload, keys.for(payload)); keys.clear(); clearIntention(); clearDuration(); clearEditing(); onSession(value.session.id); }
        catch (failure) { if (failure instanceof ApiRequestError && failure.status === 409) await resource.reload(); throw failure; }
      }); }}><label>Việc nhỏ bạn muốn bắt đầu<textarea ref={input} value={intention} required maxLength={280} onChange={e => setIntention(e.target.value)} aria-describedby="intention-count" /></label><p className="field-hint" id="intention-count">{intention.length}/280 ký tự · Chỉ riêng bạn nhìn thấy.</p><DurationPicker value={duration} onChange={setDuration}/><button className="primary" disabled={busy || !intention.trim()}>{busy ? "Đang mở phiên…" : "Bắt đầu phiên"}</button></form>}
    </>}
    {state.upcomingPacts.length > 0 && <section className="feature-card"><h2>Những cuộc hẹn đã nhận lời</h2><p className="field-hint">Múi giờ: {state.timezone}</p><ul className="row-list">{state.upcomingPacts.map(pact => <li key={pact.id}><button className="text-action" onClick={() => onPact(pact.id)}>{formatTime(pact.startsAt,state.timezone)} · {pact.durationMinutes} phút</button></li>)}</ul></section>}
    {confirm && <Dialog title="Bỏ điểm tiếp tục này?" onClose={() => { if (!busy) setConfirm(false); }}><p>Bạn có thể viết điểm mới sau phiên tiếp theo.</p><button className="danger" disabled={busy} onClick={() => void perform(async () => { await deleteSeed(); setConfirm(false); await resource.reload(); })}>Bỏ điểm tiếp tục</button><ErrorMessage message={error}/></Dialog>}
  </div>;
}
