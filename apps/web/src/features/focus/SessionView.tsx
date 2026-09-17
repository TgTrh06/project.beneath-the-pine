import { useCallback, useEffect, useRef, useState } from "react";
import type { FocusSession } from "@beneath-the-pine/contracts";
import { checkOut, getReturnState, getSession, putSeed } from "../../shared/api/api";
import { useSessionRealtime } from "../../shared/realtime/useSessionRealtime";
import { Dialog, ErrorMessage } from "../../shared/components/ui";
import { ThemeSelect } from "../../shared/theme/ThemeSelect";
import { canCheckOut, outcomes, remainingSeconds, seedPayload, type Outcome } from "./sessionState";
import { usePrivateDraft } from "../../shared/auth/usePrivateDraft";

export function SessionView({ id, accountId, onReturn }: { id: string; accountId: string; onReturn: () => void; onNotice: (text: string) => void }) {
  const [session, setSession] = useState<FocusSession | null>(null); const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [checkout, setCheckout, clearCheckout] = usePrivateDraft(`session:${id}:checkout`, false);
  const [outcome, setOutcome, clearOutcome] = usePrivateDraft<Outcome | null>(`session:${id}:outcome`, null);
  const [seed, setSeed, clearSeed] = usePrivateDraft(`session:${id}:seed`, "");
  const [mode, setMode, clearMode] = usePrivateDraft<"keep" | "replace" | "remove">(`session:${id}:mode`, "keep");
  const finish = () => { clearCheckout(); clearOutcome(); clearSeed(); clearMode(); onReturn(); };
  const clock = useRef({ received:0, snapshot:null as FocusSession | null }); const reconciled = useRef(false);
  const accept = useCallback((value: FocusSession) => {
    clock.current = { received:performance.now(), snapshot:value };
    setRemaining(remainingSeconds(value.endsAt,value.serverNow,0)); setSession(value); setError(""); setLoading(false);
  }, []);
  const load = useCallback(async () => { setLoading(true); setError(""); try { accept((await getSession(id)).session); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } }, [id,accept]);
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
  const act = async (action: () => Promise<unknown>) => { if (busy) return; setBusy(true); setError(""); try { await action(); } catch(e) { setError((e as Error).message); } finally { setBusy(false); } };
  const active = session ? canCheckOut(session,accountId) : false;
  const mine = session?.participants.find(person => person.accountId === accountId);
  const presence = { active:"Đang tập trung", break:"Đang nghỉ", disconnected:"Mất kết nối", checked_out:"Đã khép lại" };
  return <main className="focus-room"><div className="focus-room__body"><ThemeSelect/><ErrorMessage message={error} retry={load}/>
    {!session ? <>{loading && <p role="status">Đang nối lại phiên…</p>}<button className="secondary" onClick={onReturn}>Về điểm tiếp tục</button></>
    : <><p className="eyebrow">{session.kind === "solo" ? "PHIÊN RIÊNG" : "FOCUS PACT"}</p><h1>{active ? session.intention ?? "Có mặt cùng nhau là đủ." : "Chặng này đã khép lại."}</h1>
      {active && <><p role="status" className="field-hint">{({ connecting:"Đang đồng bộ phiên…", live:"Đã đồng bộ", reconnecting:"Đang nối lại; đồng hồ vẫn chạy.", offline:"Mất kết nối; đang thử đồng bộ lại." })[realtime.connection]}</p><p className="field-hint">{realtime.error}</p><div className="focus-room__timer" role="timer" aria-live="off" aria-label="Thời gian còn lại">{String(Math.floor(remaining/60)).padStart(2,"0")}:{String(remaining%60).padStart(2,"0")}</div></>}
      {session.kind === "pact" && <ul className="session-presence">{session.participants.map(person => <li key={person.accountId}>{person.displayName ?? "Wanderer"} · {presence[person.presence]}</li>)}</ul>}
      {active ? <><div className="button-row"><button className="primary" onClick={() => setCheckout(true)}>Khép lại chặng này</button>{session.kind === "pact" && <button className="secondary" disabled={realtime.connection !== "live"} onClick={() => realtime.setPresence(mine?.presence === "break" ? "active" : "break")}>{mine?.presence === "break" ? "Trở lại tập trung" : "Báo đang nghỉ"}</button>}<button className="text-action" onClick={onReturn}>Về trang quay lại</button></div><p className="field-hint">Rời màn hình hoặc báo đang nghỉ không dừng đồng hồ.</p></>
      : <section className="feature-card warm-card"><p>Đến đây cũng được. Lần sau bạn muốn mở từ đâu?</p><label>Điểm tiếp tục<textarea maxLength={500} value={seed} onChange={e => setSeed(e.target.value)}/></label><p className="field-hint">{seed.length}/500 ký tự · Chỉ riêng bạn.</p><div className="button-row"><button className="primary" disabled={busy || !seed.trim()} onClick={() => void act(async () => { await putSeed(seed.trim()); finish(); })}>Lưu điểm tiếp tục</button><button className="secondary" onClick={onReturn}>Quay lại</button></div></section>}
      {checkout && active && <Dialog title="Bạn muốn khép lại thế nào?" onClose={() => { if (!busy) setCheckout(false); }}><p>Mỗi cách dừng đều có chỗ ở đây.</p><div className="button-row">{(Object.keys(outcomes) as Outcome[]).map(value => <button className="choice" aria-pressed={outcome === value} key={value} onClick={() => setOutcome(value)}>{outcomes[value]}</button>)}</div><label>Điểm tiếp tục<select value={mode} onChange={e => setMode(e.target.value as typeof mode)}><option value="keep">Giữ nguyên điểm đã có</option><option value="replace">Viết điểm tiếp tục mới</option><option value="remove">Bỏ điểm đã có</option></select></label>{mode === "replace" && <label>Lần sau mở từ đâu?<textarea value={seed} maxLength={500} onChange={e => setSeed(e.target.value)}/><span className="field-hint">{seed.length}/500 ký tự</span></label>}<ErrorMessage message={error}/><button className="primary" disabled={busy || !outcome || (mode === "replace" && !seed.trim())} onClick={() => void act(async () => { const fresh = (await getSession(id)).session; accept(fresh); if (!canCheckOut(fresh,accountId)) { setCheckout(false); return; } const result = await checkOut(id,{ outcome:outcome!, ...seedPayload(mode,seed) });
        if (mode !== "keep") {
          const state = await getReturnState();
          const saved = mode === "remove" ? state.openSeed === null : state.openSeed?.text === seed.trim();
          if (!saved) { accept(result.session); setCheckout(false); setError(mode === "replace" ? "Điểm tiếp tục chưa được lưu. Nội dung vẫn ở bên dưới để bạn lưu lại." : "Điểm tiếp tục chưa thay đổi. Bạn có thể bỏ điểm này tại trang Quay lại."); return; }
        }
        finish(); })}>{busy ? "Đang lưu…" : "Xác nhận và quay lại"}</button></Dialog>}
    </>}
  </div></main>;
}
