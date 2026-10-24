import { MartenNote } from "../../shared/components/marten/MartenNote";
import "./session.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FocusSession } from "@beneath-the-pine/contracts";
import { checkOut, getPact, getReturnState, getSession, putSeed } from "../../shared/api/api";
import { useSessionRealtime } from "../../shared/realtime/useSessionRealtime";
import { Dialog, ErrorMessage } from "../../shared/components/ui";
import { ThemeSelect } from "../../shared/theme/ThemeSelect";
import { canCheckOut, outcomes, remainingSeconds, seedPayload, shouldAcceptSnapshot, type Outcome } from "./sessionState";
import { usePrivateDraft } from "../../shared/auth/usePrivateDraft";
import { StuckRecovery } from './StuckRecovery';

export function SessionView({ id, accountId, onReturn, onRepeatPact }: { id: string; accountId: string; onReturn: () => void; onRepeatPact: (campId: string, pactId: string) => void; onNotice: (text: string) => void }) {
  const [session, setSession] = useState<FocusSession | null>(null); const [remaining, setRemaining] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const persistDraft = session?.kind === "solo";
  const [checkout, setCheckout, clearCheckout] = usePrivateDraft(`session:${id}:checkout`, false, { persist:persistDraft });
  const [outcome, setOutcome, clearOutcome] = usePrivateDraft<Outcome | null>(`session:${id}:outcome`, null, { persist:persistDraft });
  const [seed, setSeed, clearSeed] = usePrivateDraft(`session:${id}:seed`, "", { persist:persistDraft });
  const [mode, setMode, clearMode] = usePrivateDraft<"keep" | "replace" | "remove">(`session:${id}:mode`, "keep", { persist:persistDraft });
  const [microstep, setMicrostep, clearMicrostep] = usePrivateDraft(`session:${id}:microstep`, '', { persist:true });
  const [recoverySeed, setRecoverySeed, clearRecoverySeed] = usePrivateDraft(`session:${id}:recovery-seed`, '', { persist:true });
  const [breakUntil, setBreakUntil, clearBreakUntil] = usePrivateDraft<number | null>(`session:${id}:break-until`, null, { persist:true });
  const finish = (stay = false) => { clearCheckout(); clearOutcome(); clearSeed(); clearMode(); clearMicrostep(); clearRecoverySeed(); clearBreakUntil(); setCheckout(false); if (!stay) onReturn(); };
  const clock = useRef({ received:0, snapshot:null as FocusSession | null }); const reconciled = useRef(false);
  const accept = useCallback((value: FocusSession) => {
    if (value.id !== id || !shouldAcceptSnapshot(clock.current.snapshot, value)) return;
    clock.current = { received:performance.now(), snapshot:value };
    setRemaining(remainingSeconds(value.endsAt,value.serverNow,0)); setSession(value); setLoadError(""); setLoading(false);
  }, [id]);
  const load = useCallback(async () => { setLoading(true); setLoadError(""); try { accept((await getSession(id)).session); } catch (e) { setLoadError((e as Error).message); } finally { setLoading(false); } }, [id,accept]);
  useEffect(() => { void load(); }, [load]);
  const realtime = useSessionRealtime(id,accept,Boolean(session && session.status === "active"));
  useEffect(() => {
    const tick = () => {
      const value = clock.current.snapshot; if (!value) return;
      const left = remainingSeconds(value.endsAt,value.serverNow,performance.now()-clock.current.received); setRemaining(left);
      if (left === 0 && value.status === "active" && !reconciled.current) { reconciled.current = true; void load(); }
    };
    const timer = setInterval(tick,1000); return () => clearInterval(timer);
  }, [load]);
  const submitting = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const seedInput = useRef<HTMLTextAreaElement>(null);
  const wasActive = useRef(false);
  const [endedWhileEditing, setEndedWhileEditing] = useState(false);
  const act = async (action: () => Promise<unknown>) => { if (submitting.current) return; submitting.current = true; setBusy(true); setError(""); try { await action(); } catch(e) { setError((e as Error).message); } finally { submitting.current = false; setBusy(false); } };
  const active = session ? realtime.authorized && canCheckOut(session,accountId) : false;
  useEffect(() => {
    if (session && wasActive.current && !active) {
      if (checkout) { setEndedWhileEditing(true); setCheckout(false); }
      if (!seed && recoverySeed) setSeed(recoverySeed);
      requestAnimationFrame(() => heading.current?.focus());
    }
    if (session) wasActive.current = active;
  }, [active, session, checkout, setCheckout, seed, recoverySeed, setSeed]);
  const mine = session?.participants.find(person => person.accountId === accountId);
  const presence = { active:"Đang tập trung", break:"Đang nghỉ", disconnected:"Mất kết nối", checked_out:"Đã khép lại", hidden:"Đã tham gia" };
  return <main className="focus-room"><div className="focus-room__body"><header className="session-toolbar"><button className="text-action" disabled={busy} onClick={onReturn}>Về trang quay lại</button><ThemeSelect/></header><ErrorMessage message={loadError} retry={load}/>
    {!session ? <>{loading && <p role="status">Đang nối lại phiên…</p>}<button className="secondary" onClick={onReturn}>Về điểm tiếp tục</button></>
    : !realtime.authorized ? <section className="session-ending"><h1>Quyền truy cập phiên đã thay đổi.</h1><p>Hãy quay lại để tiếp tục từ nội dung riêng của bạn.</p><button className="primary" onClick={onReturn}>Về điểm tiếp tục</button></section>
    : <><p className="eyebrow">{session.kind === "solo" ? "PHIÊN RIÊNG" : "FOCUS PACT"}</p><h1 ref={heading} tabIndex={-1}>{active ? session.intention ?? "Có mặt cùng nhau là đủ." : "Chặng này đã khép lại."}</h1>
      {active && <><p role="status" className="field-hint">{({ connecting:"Đang đồng bộ phiên…", live:"Đã đồng bộ với máy chủ.", reconnecting:"Đang nối lại; đồng hồ hiển thị mốc máy chủ gần nhất.", offline:"Realtime mất kết nối; đang thử đồng bộ lại." })[realtime.connection]}</p><p className="field-hint">{realtime.error}{realtime.lastSyncedAt && realtime.connection !== "live" ? ` Trạng thái gần nhất lúc ${new Date(realtime.lastSyncedAt).toLocaleTimeString()}.` : ""}</p>{realtime.connection !== "live" && <button className="text-action" onClick={realtime.retrySync}>Đồng bộ lại</button>}{remaining === 0 && <p role="status">{loadError ? "Chưa xác nhận được kết thúc. Hãy thử tải lại." : "Đang xác nhận kết thúc…"}</p>}<div className="focus-room__timer" role="timer" aria-live="off" aria-label="Thời gian còn lại">{String(Math.floor(remaining/60)).padStart(2,"0")}:{String(remaining%60).padStart(2,"0")}</div></>}
      {session.kind === "pact" && <ul className="session-presence">{session.participants.map(person => <li key={person.accountId}>{person.displayName ?? "Wanderer"} · {presence[person.presence]}</li>)}</ul>}
      {active ? <><div className="button-row session-actions"><button className="primary" disabled={remaining === 0} onClick={() => setCheckout(true)}>Khép lại chặng này</button>{session.kind === "pact" && <button className="secondary" disabled={realtime.connection !== "live"} onClick={() => realtime.setPresence(mine?.presence === "break" ? "active" : "break")}>{mine?.presence === "break" ? "Trở lại tập trung" : "Báo đang nghỉ"}</button>}</div><p className="field-hint">Rời màn hình hoặc báo đang nghỉ không dừng đồng hồ.</p><StuckRecovery microstep={microstep} setMicrostep={setMicrostep} seedDraft={recoverySeed} setSeedDraft={setRecoverySeed} breakUntil={breakUntil} setBreakUntil={setBreakUntil} pact={session.kind === 'pact'} connection={realtime.connection} onPresence={realtime.setPresence} onFinish={() => { setOutcome('stuck'); setCheckout(true); }}/></>
      : <section className="session-ending">{endedWhileEditing && <p role="status">Chặng đã kết thúc. Điểm tiếp tục của bạn vẫn ở đây.</p>}<ErrorMessage message={error}/><MartenNote pose="stretch">Lần sau, bạn muốn mở từ đâu?</MartenNote><label>Điểm tiếp tục<textarea disabled={busy} aria-describedby="session-seed-count" maxLength={500} value={seed} onChange={e => setSeed(e.target.value)}/></label><p className="field-hint" id="session-seed-count">{seed.length}/500 ký tự · Chỉ riêng bạn.</p><div className="button-row"><button className="primary" disabled={busy || !seed.trim()} onClick={() => void act(async () => { await putSeed(seed.trim()); finish(); })}>{busy ? "Đang lưu…" : "Lưu điểm tiếp tục"}</button><button className="secondary" disabled={busy} onClick={onReturn}>Quay lại</button>{session.kind === 'pact' && session.pactId && <button className="secondary" disabled={busy} onClick={() => void act(async () => { const source = (await getPact(session.pactId!)).pact; onRepeatPact(source.campId, source.id); })}>Hẹn lại Pact</button>}</div></section>}
      {checkout && active && <Dialog title="Bạn muốn khép lại thế nào?" onClose={() => { if (!busy) setCheckout(false); }}><p>Mỗi cách dừng đều có chỗ ở đây.</p><fieldset className="session-checkout-fields" disabled={busy}><legend>Chặng này thế nào?</legend><div className="session-outcomes">{(Object.keys(outcomes) as Outcome[]).map(value => <button className="choice" aria-pressed={outcome === value} key={value} onClick={() => setOutcome(value)}>{outcomes[value]}</button>)}</div><label>Lần sau mở từ đâu?<select value={mode} onChange={e => setMode(e.target.value as typeof mode)}><option value="keep">Giữ nguyên điểm đã có</option><option value="replace">Viết điểm tiếp tục mới</option><option value="remove">Bỏ điểm đã có</option></select></label>{mode === "replace" && <label>Lần sau mở từ đâu?<textarea ref={seedInput} value={seed} maxLength={500} onChange={e => setSeed(e.target.value)}/><span className="field-hint">{seed.length}/500 ký tự · Chỉ riêng bạn.</span></label>}<ErrorMessage message={error}/><button className="primary" disabled={busy || !outcome || (mode === "replace" && !seed.trim())} onClick={() => void act(async () => { const fresh = (await getSession(id)).session; accept(fresh); if (!canCheckOut(fresh,accountId)) { setCheckout(false); return; } const result = await checkOut(id,{ outcome:outcome!, ...seedPayload(mode,seed) });
        if (mode !== "keep") {
          const state = await getReturnState();
          const saved = mode === "remove" ? state.openSeed === null : state.openSeed?.text === seed.trim();
          if (!saved) { accept(result.session); setCheckout(false); setError(mode === "replace" ? "Điểm tiếp tục chưa được lưu. Nội dung vẫn ở bên dưới để bạn lưu lại." : "Điểm tiếp tục chưa thay đổi. Bạn có thể bỏ điểm này tại trang Quay lại."); return; }
        }
        accept(result.session); finish(session.kind === 'pact'); })}>{busy ? "Đang lưu…" : "Xác nhận và quay lại"}</button></fieldset></Dialog>}
    </>}
  </div></main>;
}
