import { MartenNote } from "../../shared/components/marten/MartenNote";
import { StartHelp } from "./StartHelp";
import "./return.css";
import { useRef, useState } from "react";
import { ApiRequestError, deleteSeed, getProfile, getReturnState, newRequestKey, putSeed, startSolo, updateProfile } from "../../shared/api/api";
import { stableRequestKey } from "../../shared/api/requestKey";
import { useResource } from "../../shared/api/useResource";
import { Dialog, DurationPicker, ErrorMessage, type Duration } from "../../shared/components/ui";
import { deviceTimezone, formatTime, validTimezone } from "../../shared/time";
import { usePrivateDraft } from "../../shared/auth/usePrivateDraft";
import { PresetFocus } from './PresetFocus';
import type { SoundId } from '../focus/Soundscape';
import { draftOwner, writePrivateDraft } from '../../shared/auth/privateDrafts';

const loadReturn = async () => {
  const [state, profile] = await Promise.all([getReturnState(), getProfile()]);
  return { ...state, timezone: profile.profile?.timezone ?? deviceTimezone() };
};
export function ReturnView({ onSession, onPact }: { onSession: (id: string) => void; onPact: (id: string) => void; onNotice: (text: string) => void }) {
  const resource = useResource(loadReturn); const state = resource.data;
  const [intention, setIntention, clearIntention] = usePrivateDraft("return:intention", "", { persist:true });
  const [duration, setDuration, clearDuration] = usePrivateDraft<Duration>("return:duration", 10, { persist:true });
  const [sound, setSound] = usePrivateDraft<SoundId | null>('return:soundscape',null,{persist:true});
  const [editing, setEditing, clearEditing] = usePrivateDraft("return:editing", false, { persist:true });
  const [startRequest, setStartRequest, clearStartRequest] = usePrivateDraft<{ payload:string; key:string } | null>("return:start-request", null, { persist:true });
  const [seedDraft, setSeedDraft, clearSeedDraft] = usePrivateDraft("return:seed-replacement", "", { persist:true });
  const [editingSeed, setEditingSeed, clearEditingSeed] = usePrivateDraft("return:editing-seed", false, { persist:true });
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [confirm, setConfirm] = useState(false);
  const [timezone, setTimezone] = useState(deviceTimezone); const input = useRef<HTMLTextAreaElement>(null); const seedEditTrigger = useRef<HTMLButtonElement>(null);
  const submitting = useRef(false);
  const beginEditing = (fromSeed: boolean) => {
    setEditingSeed(false); clearEditingSeed();
    setEditing(true); setError("");
    clearStartRequest();
    const text = fromSeed ? state?.openSeed?.text ?? "" : "";
    setIntention(text.length <= 280 ? text : "");
    if (text.length > 280) setError("Điểm tiếp tục dài hơn 280 ký tự. Hãy viết gọn việc bạn muốn bắt đầu bên dưới.");
    requestAnimationFrame(() => input.current?.focus());
  };
  const beginSeedEditing = () => {
    clearStartRequest(); clearEditing(); setEditingSeed(true); setError("");
    setSeedDraft(state?.openSeed?.text ?? "");
  };
  const closeSeedEditor = () => {
    setEditingSeed(false); clearSeedDraft(); clearEditingSeed(); setError("");
    requestAnimationFrame(() => seedEditTrigger.current?.focus());
  };
  const perform = async (action: () => Promise<unknown>) => {
    if (submitting.current) return; submitting.current = true; setBusy(true); setError("");
    try { await action(); } catch (e) { setError((e as Error).message); } finally { submitting.current = false; setBusy(false); }
  };
  if (!state) return <div className="return-page return-loading"><p className="eyebrow">QUAY LẠI</p><ErrorMessage message={resource.error} retry={resource.reload}/>{resource.loading && <p role="status">Đang tìm điểm bạn đã dừng…</p>}</div>;
  return <div className="return-page"><ErrorMessage message={resource.error} retry={resource.reload}/><div className="return-grid"><div className="return-main">
    {state.activeSession ? <section className="return-panel return-resume"><p className="eyebrow">PHIÊN ĐANG MỞ</p><h1>Bạn đang có một chặng chưa khép lại.</h1><MartenNote>Một chặng đang đợi bạn tiếp tục.</MartenNote><button className="primary" onClick={() => onSession(state.activeSession!.id)}>Quay lại phiên</button></section>
    : !state.profileReady ? <form className="return-panel return-composer" aria-busy={busy} onSubmit={e => { e.preventDefault(); void perform(async () => { await updateProfile({ timezone }); await resource.reload(); }); }}><p className="eyebrow">BƯỚC ĐẦU TIÊN</p><h1>Giờ địa phương của bạn.</h1><p>Kiểm tra múi giờ để Pine hiển thị đúng lịch hẹn.</p>{state.openSeed && <div className="return-seed"><p className="eyebrow">ĐIỂM TIẾP TỤC ĐÃ LƯU</p><blockquote>{state.openSeed.text}</blockquote><p className="field-hint">Điểm này đã được lưu riêng cho bạn.</p></div>}<label>Múi giờ IANA<input value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="Asia/Ho_Chi_Minh" required /></label><ErrorMessage message={error}/><button className="primary" disabled={busy || !validTimezone(timezone)}>{busy ? "Đang lưu…" : "Xác nhận múi giờ"}</button></form>
    : <><section className="page-intro"><p className="eyebrow">QUAY LẠI</p><h1>{state.openSeed ? "Lần trước bạn dừng ở đây." : "Một bước thôi, ngay lúc này."}</h1><MartenNote>{state.openSeed ? "Bạn có thể tiếp tục từ đây, hoặc chọn việc khác." : "Chọn một việc đủ nhỏ để bắt đầu."}</MartenNote></section>
      {state.openSeed && <section className="return-seed"><p className="eyebrow">ĐIỂM TIẾP TỤC · OPEN SEED</p>{!editingSeed && <blockquote>{state.openSeed.text}</blockquote>}{editingSeed ? <form className="return-seed-editor" aria-busy={busy} onSubmit={event => { event.preventDefault(); void perform(async () => {
        const saved = await putSeed(seedDraft.trim());
        resource.setData(current => current ? { ...current, openSeed:saved.openSeed } : current);
        closeSeedEditor();
      }); }}><label>Thay điểm tiếp tục<textarea autoFocus value={seedDraft} maxLength={500} required onChange={event => setSeedDraft(event.target.value)} aria-describedby="return-seed-count" /></label><p className="field-hint" id="return-seed-count">{seedDraft.length}/500 ký tự · Chỉ riêng bạn.</p><ErrorMessage message={error}/><div className="button-row"><button className="primary" disabled={busy || !seedDraft.trim()}>{busy ? "Đang lưu…" : "Lưu điểm mới"}</button><button type="button" className="text-action" disabled={busy} onClick={closeSeedEditor}>Hủy</button></div></form> : !editing && <div className="button-row"><button className="primary" onClick={() => beginEditing(true)}>Tiếp tục từ đây</button><button className="text-action" onClick={() => beginEditing(false)}>Bắt đầu việc khác</button><button ref={seedEditTrigger} className="text-action" onClick={beginSeedEditing}>Thay điểm này</button></div>}{!editingSeed && <button className="text-action" disabled={busy} onClick={() => { setError(""); setConfirm(true); }}>Bỏ điểm này</button>}</section>}
      {(!state.openSeed || editing) && <form className="return-panel return-composer" aria-busy={busy} onSubmit={e => { e.preventDefault(); void perform(async () => {
        const payload = { intention:intention.trim(), durationMinutes:duration };
        const request = stableRequestKey(startRequest, payload, newRequestKey);
        if (request !== startRequest) setStartRequest(request);
        try { const value = await startSolo(payload, request.key); writePrivateDraft(draftOwner(), `session:${value.session.id}:soundscape`, sound, true); clearStartRequest(); clearIntention(); clearDuration(); clearEditing(); onSession(value.session.id); }
        catch (failure) { if (failure instanceof ApiRequestError && failure.status === 409) await resource.reload(); throw failure; }
      }); }}><fieldset className="return-fields" disabled={busy}><label>Việc nhỏ bạn muốn bắt đầu<textarea ref={input} placeholder="Ví dụ: mở tài liệu và viết một câu đầu tiên" value={intention} required maxLength={280} onChange={e => { clearStartRequest(); setIntention(e.target.value); }} aria-describedby="intention-count" /></label><p className="field-hint" id="intention-count">{intention.length}/280 ký tự · Chỉ riêng bạn nhìn thấy.</p><StartHelp value={intention} onChoose={value => { clearStartRequest(); setIntention(value); requestAnimationFrame(() => input.current?.focus()); }}/><DurationPicker value={duration} onChange={value => { clearStartRequest(); setDuration(value); }}/><PresetFocus duration={duration} setDuration={setDuration} sound={sound} setSound={setSound}/><ErrorMessage message={confirm ? "" : error}/><button className="primary" disabled={busy || !intention.trim()}>{busy ? "Đang mở phiên…" : "Bắt đầu phiên"}</button></fieldset></form>}
    </>}
    </div><aside className="return-schedule" aria-labelledby="return-schedule-title"><p className="eyebrow">CÙNG NHAU</p><h2 id="return-schedule-title">Hẹn cùng nhau</h2>
      {state.upcomingPacts.length > 0 ? <><p className="field-hint">Những cuộc hẹn đã nhận lời · {state.timezone}</p><ul className="return-appointments">{state.upcomingPacts.map(pact => <li key={pact.id}><button onClick={() => onPact(pact.id)}><span>{formatTime(pact.startsAt,state.timezone)}</span><span className="field-hint">{pact.durationMinutes} phút · Xem cuộc hẹn</span></button></li>)}</ul></> : <p className="muted">Chưa có cuộc hẹn nào đã nhận lời. Bạn có thể dành chặng này cho riêng mình.</p>}
    </aside></div>
    {confirm && <Dialog title="Bỏ điểm tiếp tục này?" onClose={() => { if (!busy) setConfirm(false); }}><p>Bạn có thể viết điểm mới sau phiên tiếp theo.</p><button className="danger" disabled={busy} onClick={() => void perform(async () => { await deleteSeed(); setConfirm(false); await resource.reload(); })}>Bỏ điểm tiếp tục</button><ErrorMessage message={error}/></Dialog>}
  </div>;
}
