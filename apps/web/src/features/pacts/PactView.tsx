import "../circles/circles.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { cancelPact, getPact, getProfile, joinSession, newRequestKey, respondPact, startPact } from "../../shared/api/api";
import { useResource } from "../../shared/api/useResource";
import { requestKeyStore } from "../../shared/api/requestKey";
import { Dialog, ErrorMessage } from "../../shared/components/ui";
import { deviceTimezone, formatTime } from "../../shared/time";
import { pactActions } from "./pactState";
export function PactView({ id, accountId, onSession }: { id: string; accountId: string; onSession: (id: string) => void; onNotice: (text: string) => void }) {
  const loader = useCallback(async () => { const [value,profile] = await Promise.all([getPact(id),getProfile()]); return {...value,timezone:profile.profile?.timezone ?? deviceTimezone()}; },[id]);
  const resource = useResource(loader); const pact = resource.data?.pact;
  const [busy,setBusy] = useState(false); const [error,setError] = useState(""); const [message,setMessage] = useState(""); const [confirm,setConfirm] = useState(false); const [now,setNow] = useState(Date.now);
  const pending = useRef(false); const [copyError,setCopyError] = useState("");
  const keys = useRef(requestKeyStore(newRequestKey));
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()),15000); const visible = () => { if (document.visibilityState === "visible") void resource.reload(); }; window.addEventListener("focus",visible); return () => { clearInterval(timer); window.removeEventListener("focus",visible); }; },[resource.reload]);
  const act = async (action:()=>Promise<unknown>) => { if (pending.current) return; pending.current = true; setBusy(true); setError(""); try { await action(); } catch(e) { setError((e as Error).message); await resource.reload(); } finally { pending.current = false; setBusy(false); } };
  if (!pact) return <><ErrorMessage message={resource.error} retry={resource.reload}/>{resource.loading && <p role="status">Đang mở cuộc hẹn…</p>}</>;
  const allowed = pactActions(pact,accountId,now);
  const status = { scheduled:"Đã hẹn", active:"Đang diễn ra", completed:"Đã khép lại", cancelled:"Đã hủy", expired:"Đã hết hạn" };
  const responses = { invited:"Chưa trả lời", accepted:"Đã nhận lời", declined:"Không tham gia" };
  return <section className="circles-page pact-detail"><p className="eyebrow">FOCUS PACT · {status[pact.status]}</p><h1>{pact.durationMinutes} phút có mặt cùng nhau.</h1><p>{formatTime(pact.startsAt,resource.data!.timezone)} · {resource.data!.timezone}</p><ErrorMessage message={resource.error} retry={resource.reload}/><ErrorMessage message={confirm ? "" : error}/>{message && <p role="status">{message}</p>}<ul className="row-list">{pact.participants.map(person => <li key={person.accountId}>{person.displayName ?? "Wanderer"}{person.accountId === accountId ? " · Bạn" : ""}<p className="field-hint">{responses[person.response]}</p></li>)}</ul>
    <div className="button-row">{allowed.respond && <><button className="primary" disabled={busy || pact.participants.find(p => p.accountId === accountId)?.response === "accepted"} onClick={() => void act(async () => { await respondPact(id,"accepted"); await resource.reload(); })}>Nhận lời</button><button className="secondary" disabled={busy || pact.participants.find(p => p.accountId === accountId)?.response === "declined"} onClick={() => void act(async () => { await respondPact(id,"declined"); await resource.reload(); })}>Không tham gia</button></>}
    {allowed.start && <button className="primary" disabled={busy} onClick={() => void act(async () => { const result = await startPact(id,keys.current.for({id})); onSession(result.session.id); })}>Bắt đầu Pact</button>}
    {allowed.join && <button className="primary" disabled={busy} onClick={() => void act(async () => { const result = await joinSession(pact.sessionId!); onSession(result.session.id); })}>Tham gia phiên</button>}
    {allowed.cancel && <button className="text-action" disabled={busy} onClick={() => setConfirm(true)}>Hủy cuộc hẹn</button>}</div>
    {pact.status === "scheduled" && <p className="field-hint">Người tạo có thể bắt đầu từ 10 phút trước đến 30 phút sau giờ hẹn. Tải lại để xem trạng thái mới.</p>}
    {pact.status === "scheduled" && pact.participants.find(person => person.accountId === accountId)?.response === "accepted" && !allowed.start && <p role="status">Bạn đã nhận lời. Cuộc hẹn đang chờ người tạo bắt đầu trong khung giờ cho phép.</p>}
    <ErrorMessage message={copyError}/><div className="button-row"><button className="secondary" disabled={busy || resource.loading} onClick={() => void resource.reload()}>Cập nhật trạng thái</button><button className="text-action" disabled={busy} onClick={() => { setCopyError(""); setMessage(""); void navigator.clipboard.writeText(location.origin+location.pathname+"#pact/"+id).then(() => setMessage("Đã sao chép link. Chỉ người được chọn mới truy cập được.")).catch(() => setCopyError("Chưa sao chép được link. Hãy thử lại.")); }}>Sao chép link Pact</button></div>
    {confirm && <Dialog title="Hủy cuộc hẹn này?" onClose={() => { if (!busy) setConfirm(false); }}><p>{formatTime(pact.startsAt,resource.data!.timezone)} · {pact.durationMinutes} phút</p><ErrorMessage message={error}/><button className="danger" disabled={busy} onClick={() => void act(async () => { await cancelPact(id); setConfirm(false); await resource.reload(); })}>Xác nhận hủy</button></Dialog>}
  </section>;
}
