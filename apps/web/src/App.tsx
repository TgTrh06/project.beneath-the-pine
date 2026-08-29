import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { approveWaitlist, completeHabit, createHabit, createNextAction, createWeeklyReview, deleteAccount, exportData, finishFocus as finishFocusSession, getAdminWaitlist, getBootstrap, helpMeStart, isConfigured, joinWaitlist, recordConsent, saveCheckin, sendMagicLink, startFocus, submitBrainDump, supabase } from "./api";
import { FocusRoom } from "./FocusRoom";
import { formatFocusTime, useFocusTimer } from "./focusTimer";
import { StudyView } from "./StudyView";

type View = "now" | "capture" | "habits" | "review" | "study" | "settings" | "admin";
type TaskStatus = "ready" | "done" | "deferred";
type Task = { id: string; title: string; minutes: number; status: TaskStatus };
type Habit = { id: string; title: string; completed: boolean };
type Energy = "low" | "medium" | "high";

const initialTasks: Task[] = [
  { id: "start-report", title: "Mở báo cáo và viết ba tiêu đề chính", minutes: 10, status: "ready" },
  { id: "reply-email", title: "Gửi email xác nhận lịch hẹn", minutes: 5, status: "ready" },
];
const initialHabits: Habit[] = [
  { id: "water", title: "Uống một cốc nước", completed: false },
  { id: "desk", title: "Dọn một góc nhỏ", completed: false },
];
const quota = { brain_dump: 3, help_me_start: 5, weekly_review: 1 };

function id() { return crypto.randomUUID(); }
function makeCandidates(content: string): Task[] {
  return content.split(/[\n;]+/).map((line) => line.replace(/^[\s\-•\d.)]+/, "").trim()).filter((line) => line.length > 2).slice(0, 4)
    .map((title, index) => ({ id: id(), title: index === 0 ? `Mở phần liên quan đến “${title}” và viết một gạch đầu dòng` : title, minutes: index === 0 ? 5 : 10, status: "ready" as const }));
}

export function App() {
  const [view, setView] = useState<View>(() => (location.hash.replace("#", "") as View) || "now");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [dump, setDump] = useState("");
  const [suggestions, setSuggestions] = useState<Task[]>([]);
  const [notice, setNotice] = useState("");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [focusSessionId, setFocusSessionId] = useState<string | null>(null);
  const [focusRoomOpen, setFocusRoomOpen] = useState(false);
  const [helpSuggestion, setHelpSuggestion] = useState<{ taskId: string; title: string; minutes: number } | null>(null);
  const [energy, setEnergy] = useState<Energy>("medium");
  const [checkinNote, setCheckinNote] = useState("");
  const [consented, setConsented] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistMessage, setWaitlistMessage] = useState("");
  const [weeklyReview, setWeeklyReview] = useState(false);
  const [reviewContent, setReviewContent] = useState<{ summary: string; insight: string; experiment: { title: string; why: string } } | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const focusTimer = useFocusTimer();

  useEffect(() => { location.hash = view; }, [view]);
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session || !isConfigured) return;
    void getBootstrap(session).then((data) => {
      setTasks(data.tasks.length ? data.tasks : []);
      setHabits(data.habits.map((habit) => ({ ...habit, completed: false })));
      setConsented(Boolean(data.consent?.aiProcessing && data.consent?.contentRetention));
    }).catch((error: Error) => setNotice(error.message));
  }, [session]);
  const readyTasks = useMemo(() => tasks.filter((task) => task.status === "ready"), [tasks]);
  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? readyTasks[0];
  const format = formatFocusTime(focusTimer.seconds);

  function navigate(next: View) { setView(next); setNotice(""); }
  async function capture() {
    if (!consented) { setShowConsent(true); return; }
    if (isConfigured && !session) { setLoginOpen(true); return; }
    try { setLoading(true); const candidates = isConfigured && session ? (await submitBrainDump(session, dump)).suggestion.candidates.map((candidate) => ({ id: id(), ...candidate, status: "ready" as const })) : makeCandidates(dump); if (!candidates.length) { setNotice("Bạn chỉ cần viết một điều đang chiếm tâm trí. Không cần sắp xếp trước."); return; } setSuggestions(candidates); setDump(""); setNotice("Mình đã biến điều bạn viết thành vài bước nhỏ. Bạn chọn một bước phù hợp nhất nhé."); } catch (error) { setNotice(error instanceof Error ? error.message : "Không thể tạo gợi ý lúc này."); } finally { setLoading(false); }
  }
  async function acceptSuggestion(task: Task) { try { setLoading(true); const confirmed = isConfigured && session ? (await createNextAction(session, task)).task : task; setTasks((current) => [{ ...confirmed, status: "ready" }, ...current]); setSuggestions([]); setView("now"); setNotice("Đã giữ lại bước này. Chỉ cần bắt đầu trong vài phút thôi."); } catch (error) { setNotice(error instanceof Error ? error.message : "Không thể lưu bước này."); } finally { setLoading(false); } }
  async function start(task: Task) {
    if (activeTaskId === task.id && focusTimer.status !== "idle") { focusTimer.resume(); setFocusRoomOpen(true); return; }
    try { setLoading(true); const remote = isConfigured && session ? await startFocus(session, task.id, task.minutes) : null; setFocusSessionId(remote?.session.id ?? null); setActiveTaskId(task.id); focusTimer.start(task.minutes * 60); setFocusRoomOpen(true); setNotice("Bạn đã bắt đầu. Không cần làm hoàn hảo."); } catch (error) { setNotice(error instanceof Error ? error.message : "Không thể bắt đầu phiên này."); } finally { setLoading(false); }
  }
  async function finishFocus(outcome: "done" | "still_stuck") {
    if (!activeTask) return;
    try {
      setLoading(true);
      if (isConfigured && session && focusSessionId) await finishFocusSession(session, focusSessionId, outcome);
      if (outcome === "done") setTasks((current) => current.map((task) => task.id === activeTask.id ? { ...task, status: "done" } : task));
      focusTimer.reset(); setActiveTaskId(null); setFocusSessionId(null); setFocusRoomOpen(false);
      setNotice(outcome === "done" ? "Đủ rồi. Bạn đã đưa việc này đi thêm một đoạn." : "Không sao. Mình có thể làm bước này nhỏ hơn khi bạn sẵn sàng.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Không thể lưu phiên này."); } finally { setLoading(false); }
  }
  function smaller() { if (!activeTask) return; setTasks((current) => current.map((task) => task.id === activeTask.id ? { ...task, title: `Chỉ mở phần liên quan đến “${task.title.slice(0, 55)}”`, minutes: 2 } : task)); setNotice("Đã làm nhỏ bước tiếp theo xuống 2 phút."); }
  async function askForHelp(task: Task) { try { setLoading(true); const suggestion = isConfigured && session ? (await helpMeStart(session, task.id)).suggestion : { tinyStep: `Chỉ mở phần liên quan đến “${task.title.slice(0, 55)}”`, minutes: 2, options: [] }; setHelpSuggestion({ taskId: task.id, title: suggestion.tinyStep, minutes: suggestion.minutes }); setNotice("Mình có một bước nhỏ hơn. Bạn chọn có dùng nó hay không."); } catch (error) { setNotice(error instanceof Error ? error.message : "Không thể tạo bước nhỏ hơn."); } finally { setLoading(false); } }
  function acceptHelp() { if (!helpSuggestion) return; setTasks((current) => current.map((task) => task.id === helpSuggestion.taskId ? { ...task, title: helpSuggestion.title, minutes: helpSuggestion.minutes } : task)); setHelpSuggestion(null); setNotice("Đã thay bằng bước bạn vừa duyệt."); }
  function reset() { const keep = energy === "low" ? 1 : energy === "medium" ? 2 : 3; setTasks((current) => current.map((task, index) => task.status === "ready" && index >= keep ? { ...task, status: "deferred" } : task)); setNotice("Kế hoạch hôm nay đã nhẹ hơn. Những việc khác có thể chờ."); }
  function returnToToday() { setTasks((current) => current.map((task) => task.status === "deferred" ? { ...task, status: "ready" } : task)); setView("now"); setNotice("Mình bắt đầu lại từ hôm nay. Chọn một bước nhỏ là đủ."); }
  async function submitWaitlist(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); try { await joinWaitlist({ email: String(data.get("email")), name: String(data.get("name") || "") }); setWaitlistMessage("Bạn đã có trong waitlist. Mình sẽ gửi lời mời khi private beta mở."); event.currentTarget.reset(); } catch { setWaitlistMessage("Chưa thể gửi lúc này. Hãy thử lại sau nhé."); } }
  async function approveConsent() { try { setLoading(true); setShowConsent(false); if (isConfigured && session) await recordConsent(session); setConsented(true); setNotice("Cảm ơn bạn đã đồng ý. Giờ bạn có thể Brain Dump."); } catch (error) { setNotice(error instanceof Error ? error.message : "Không thể lưu consent."); } finally { setLoading(false); } }
  async function submitLogin(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const email = String(new FormData(event.currentTarget).get("email")); try { await sendMagicLink(email); setLoginMessage("Đã gửi magic link. Hãy mở email để tiếp tục."); } catch (error) { setLoginMessage(error instanceof Error ? error.message : "Không thể gửi magic link."); } }

  return <div className="site-shell">
    <header className="site-header">
      <button className="brand" onClick={() => navigate("now")} aria-label="Beneath the Pine, về trang hôm nay"><span className="pine">⌁</span><span>Beneath the Pine</span></button>
      <div className="header-actions"><span className={`status ${isConfigured ? "connected" : ""}`}>{isConfigured ? (session ? "Private beta" : "Beta cần đăng nhập") : "Chế độ demo local"}</span>{session ? <button className="link-button" onClick={() => void supabase?.auth.signOut()}>Đăng xuất</button> : <button className="link-button" onClick={() => isConfigured ? setLoginOpen(true) : setWaitlistOpen(true)}>{isConfigured ? "Đăng nhập beta" : "Tham gia beta"}</button>}</div>
    </header>

    <main className="main-layout">
      <aside className="navigation" aria-label="Điều hướng">
        <p className="nav-label">DÀNH CHO LÚC NÀY</p>
        {([["now", "Ngay lúc này"], ["capture", "Brain Dump"], ["habits", "Nhịp nhẹ mỗi ngày"], ["review", "Nhìn lại tuần"], ["settings", "Cài đặt"]] as [View, string][]).map(([key, label]) => <button key={key} className={view === key ? "nav-item active" : "nav-item"} onClick={() => navigate(key)}>{label}</button>)}
        <button className={view === "study" ? "nav-item active" : "nav-item"} onClick={() => navigate("study")}>Pilot study</button>
      </aside>
      <section className="content" aria-live="polite">
        {!isConfigured && <div className="demo-banner">Bạn đang xem bản local demo. Dữ liệu ở đây chỉ nằm trên thiết bị này; private beta sẽ yêu cầu đăng nhập và mã hóa nội dung.</div>}
        {notice && <div className="notice">{notice}</div>}{loading && <div className="notice">Đang chuẩn bị một bước nhỏ cho bạn…</div>}
        {view === "now" && <NowView task={activeTask} focusStatus={focusTimer.status} format={format} helpSuggestion={helpSuggestion} onCapture={() => navigate("capture")} onStart={(task) => void start(task)} onPause={focusTimer.pause} onComplete={() => void finishFocus("done")} onSmaller={(task) => void askForHelp(task)} onAcceptHelp={acceptHelp} onReset={reset} onReturn={returnToToday} />}
        {view === "capture" && <CaptureView dump={dump} setDump={setDump} suggestions={suggestions} onCapture={capture} onChoose={acceptSuggestion} />}
        {view === "habits" && <HabitsView habits={habits} setHabits={setHabits} energy={energy} setEnergy={setEnergy} note={checkinNote} setNote={setCheckinNote} remoteSession={session} onNotice={setNotice} />}
        {view === "review" && <ReviewView created={weeklyReview} content={reviewContent} onCreate={async () => { try { setLoading(true); const review = isConfigured && session ? await createWeeklyReview(session) : null; setReviewContent(review ? { summary: review.review.summary, insight: review.review.insight, experiment: review.experiment } : { summary: "Đây là một tuần có dữ liệu để quan sát, không phải để chấm điểm.", insight: "Khi bước đầu được thu nhỏ, việc bắt đầu ít nặng hơn.", experiment: { title: "Thử bắt đầu bằng 2 phút", why: "Giảm ma sát trước khi đòi hỏi hoàn thành." } }); setWeeklyReview(true); } catch (error) { setNotice(error instanceof Error ? error.message : "Không thể tạo review."); } finally { setLoading(false); } }} />}
        {view === "study" && <StudyView remoteSession={session} onNotice={setNotice} />}
        {view === "settings" && <SettingsView onAdmin={() => navigate("admin")} remoteSession={session} onNotice={setNotice} />}
        {view === "admin" && <AdminView remoteSession={session} onNotice={setNotice} />}
      </section>
    </main>
    <footer>Prototype nghiên cứu · AI chỉ hỗ trợ tự quản lý, không chẩn đoán hoặc điều trị ADHD.</footer>
    {showConsent && <ConsentDialog onClose={() => setShowConsent(false)} onAgree={() => void approveConsent()} />}
    {waitlistOpen && <WaitlistDialog message={waitlistMessage} onClose={() => { setWaitlistOpen(false); setWaitlistMessage(""); }} onSubmit={submitWaitlist} />}
    {loginOpen && <LoginDialog message={loginMessage} onClose={() => { setLoginOpen(false); setLoginMessage(""); }} onSubmit={submitLogin} />}
    {focusRoomOpen && activeTask && <FocusRoom task={activeTask} seconds={focusTimer.seconds} status={focusTimer.status} saving={loading} onPause={focusTimer.pause} onResume={focusTimer.resume} onDone={() => void finishFocus("done")} onStillStuck={() => void finishFocus("still_stuck")} onExit={() => { focusTimer.pause(); setFocusRoomOpen(false); setNotice("Phiên đã tạm dừng. Bạn có thể quay lại khi sẵn sàng."); }} />}
  </div>;
}

function NowView({ task, focusStatus, format, helpSuggestion, onCapture, onStart, onPause, onComplete, onSmaller, onAcceptHelp, onReset, onReturn }: { task?: Task; focusStatus: "idle" | "running" | "paused" | "finished"; format: string; helpSuggestion: { taskId: string; title: string; minutes: number } | null; onCapture: () => void; onStart: (task: Task) => void; onPause: () => void; onComplete: () => void; onSmaller: (task: Task) => void; onAcceptHelp: () => void; onReset: () => void; onReturn: () => void }) {
  return <><section className="hero"><p className="eyebrow">KHI MỌI THỨ ĐANG HƠI NHIỀU</p><h1>Bạn không cần xử lý hết.<br />Mình chỉ tìm một bước tiếp theo.</h1><p>Không cần viết đẹp hay sắp xếp trước. Bắt đầu bằng điều đang chiếm tâm trí bạn nhất.</p><button className="primary" onClick={onCapture}>Trút bớt trong đầu <span>→</span></button></section>
    <section className="feature-card next-action"><div className="card-heading"><div><p className="eyebrow">NGAY LÚC NÀY</p><h2>Một bước có thể bắt đầu</h2></div><span className="symbol">♧</span></div>{task ? <><span className="minutes">{task.minutes} phút là đủ</span><h3>{task.title}</h3><p>Bạn không cần hoàn hảo. Hết thời gian, bạn có thể dừng, đổi bước nhỏ hơn hoặc tiếp tục.</p>{helpSuggestion?.taskId === task.id && <div className="notice"><strong>Gợi ý nhỏ hơn:</strong> {helpSuggestion.title}<div className="button-row"><button className="secondary" onClick={onAcceptHelp}>Dùng bước này</button></div></div>}<div className="button-row"><button className="primary" onClick={() => focusStatus === "running" ? onPause() : onStart(task)}>{focusStatus === "running" ? "Tạm dừng" : focusStatus === "paused" || focusStatus === "finished" ? "Quay lại phiên" : "Bắt đầu ngay"}</button><button className="secondary" onClick={() => onSmaller(task)}>Vẫn bị kẹt</button></div></> : <><h3>Hiện không có việc nào cần chen vào.</h3><button className="primary" onClick={onCapture}>Mở Brain Dump</button></>}</section>
    <section className="two-up"><article className="feature-card timer-card"><p className="eyebrow">PHIÊN BẮT ĐẦU</p><div className="timer">{format}</div><p>{task?.title ?? "Chọn một bước phía trên để bắt đầu."}</p><div className="button-row"><button className="primary" disabled={!task || focusStatus === "running"} onClick={() => task && onStart(task)}>{focusStatus === "running" ? "Đang tập trung" : focusStatus === "paused" || focusStatus === "finished" ? "Quay lại" : "Bắt đầu"}</button><button className="secondary" disabled={!task} onClick={onComplete}>Đã xong</button></div></article><article className="feature-card reset-card"><p className="eyebrow">KHI KẾ HOẠCH VỠ</p><h2>Reset hôm nay</h2><p>Chọn lại điều còn thực tế với năng lượng và thời gian hiện tại.</p><div className="button-row"><button className="text-action" onClick={onReset}>Lập lại nhẹ nhàng →</button><button className="text-action" onClick={onReturn}>Bắt đầu lại từ hôm nay</button></div></article></section></>;
}

function CaptureView({ dump, setDump, suggestions, onCapture, onChoose }: { dump: string; setDump: (value: string) => void; suggestions: Task[]; onCapture: () => void | Promise<void>; onChoose: (task: Task) => void | Promise<void> }) { return <><section className="page-intro"><p className="eyebrow">BRAIN DUMP</p><h1>Cứ đặt xuống đây.</h1><p>Công cụ sẽ đề xuất vài bước nhỏ; không có gì được lưu thành task cho đến khi bạn chọn.</p></section><section className="feature-card"><label htmlFor="brain-dump">Điều đang chiếm tâm trí bạn</label><textarea id="brain-dump" value={dump} onChange={(e) => setDump(e.target.value)} placeholder="Ví dụ: phải nộp báo cáo; gọi cho mẹ; phòng hơi bừa; chưa biết bắt đầu từ đâu…" /><button className="primary full" onClick={() => void onCapture()}>Gợi ý một bước đầu tiên →</button></section>{suggestions.length > 0 && <section className="suggestions"><p className="eyebrow">BẠN CHỌN, CÔNG CỤ KHÔNG QUYẾT ĐỊNH THAY</p>{suggestions.map((task) => <article className="suggestion" key={task.id}><div><span className="minutes">{task.minutes} phút</span><h3>{task.title}</h3></div><button className="secondary" onClick={() => void onChoose(task)}>Chọn bước này</button></article>)}</section>}</> }

function HabitsView({ habits, setHabits, energy, setEnergy, note, setNote, remoteSession, onNotice }: { habits: Habit[]; setHabits: (value: Habit[]) => void; energy: Energy; setEnergy: (value: Energy) => void; note: string; setNote: (value: string) => void; remoteSession: Session | null; onNotice: (value: string) => void }) { const [title, setTitle] = useState(""); const add = async () => { if (!title.trim() || habits.length >= 3) return; try { const remote = isConfigured && remoteSession ? (await createHabit(remoteSession, title.trim())).habit : { id: id(), title: title.trim() }; setHabits([...habits, { ...remote, completed: false }]); setTitle(""); } catch (error) { onNotice(error instanceof Error ? error.message : "Không thể thêm habit."); } }; const complete = async (habit: Habit) => { try { if (isConfigured && remoteSession && !habit.completed) await completeHabit(remoteSession, habit.id); setHabits(habits.map((item) => item.id === habit.id ? { ...item, completed: !item.completed } : item)); } catch (error) { onNotice(error instanceof Error ? error.message : "Không thể lưu habit."); } }; const save = async () => { try { if (isConfigured && remoteSession) await saveCheckin(remoteSession, { energy, note: note || undefined }); onNotice("Check-in đã được ghi nhận."); setNote(""); } catch (error) { onNotice(error instanceof Error ? error.message : "Không thể lưu check-in."); } }; return <><section className="page-intro"><p className="eyebrow">NHỊP NHẸ MỖI NGÀY</p><h1>Chỉ ba điều là đủ.</h1><p>Không streak. Không điểm. Chỉ một vài tín hiệu nhỏ rằng bạn đã ở đây với chính mình.</p></section><section className="feature-card"><div className="card-heading"><h2>Hôm nay</h2><span>{habits.filter((item) => item.completed).length}/{habits.length}</span></div><div className="habit-list">{habits.map((habit) => <label className={habit.completed ? "habit complete" : "habit"} key={habit.id}><input type="checkbox" checked={habit.completed} onChange={() => void complete(habit)} /><span>{habit.title}</span></label>)}</div>{habits.length < 3 && <div className="add-row"><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="Một habit rất nhỏ" /><button className="secondary" onClick={() => void add()}>Thêm</button></div>}</section><section className="feature-card checkin"><p className="eyebrow">CHECK-IN 30 GIÂY</p><h2>Năng lượng lúc này?</h2><div className="choice-row">{(["low", "medium", "high"] as Energy[]).map((item) => <button className={energy === item ? "choice selected" : "choice"} key={item} onClick={() => setEnergy(item)}>{item === "low" ? "Thấp" : item === "medium" ? "Vừa" : "Cao"}</button>)}</div><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú nếu bạn muốn (tùy chọn)" /><button className="secondary" onClick={() => void save()}>Lưu check-in</button><p className="muted">Ghi chú trong beta sẽ được mã hóa trước khi lưu.</p></section></> }

function ReviewView({ created, content, onCreate }: { created: boolean; content: { summary: string; insight: string; experiment: { title: string; why: string } } | null; onCreate: () => Promise<void> }) { return <><section className="page-intro"><p className="eyebrow">NHÌN LẠI TUẦN</p><h1>Quan sát, không chấm điểm.</h1><p>Review chỉ được tạo khi bạn chủ động yêu cầu.</p></section>{created && content ? <section className="feature-card review-result"><p className="eyebrow">WEEKLY REVIEW</p><h2>{content.summary}</h2><dl><div><dt>Một quan sát</dt><dd>{content.insight}</dd></div><div><dt>Experiment</dt><dd><strong>{content.experiment.title}</strong><br />{content.experiment.why}</dd></div></dl><button className="primary">Đồng ý thử điều này</button></section> : <section className="feature-card"><h2>Sẵn sàng xem lại tuần này?</h2><p>AI chỉ dùng các facts hoạt động của bạn trong tuần, không tự đọc nội dung Brain Dump thô.</p><button className="primary" onClick={() => void onCreate()}>Tạo Weekly Review</button><p className="muted">1 review AI mỗi tuần.</p></section>}</> }

function SettingsView({ onAdmin, remoteSession, onNotice }: { onAdmin: () => void; remoteSession: Session | null; onNotice: (value: string) => void }) { const exportAccount = async () => { try { if (!isConfigured || !remoteSession) { onNotice("Cần đăng nhập beta để export dữ liệu."); return; } const data = await exportData(remoteSession); const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "beneath-the-pine-export.json"; anchor.click(); URL.revokeObjectURL(url); } catch (error) { onNotice(error instanceof Error ? error.message : "Không thể export dữ liệu."); } }; const removeAccount = async () => { if (!remoteSession || !confirm("Xóa tài khoản và dữ liệu? Thao tác này không thể hoàn tác.")) return; try { await deleteAccount(remoteSession); await supabase?.auth.signOut(); onNotice("Tài khoản đã được xóa."); } catch (error) { onNotice(error instanceof Error ? error.message : "Không thể xóa tài khoản."); } }; return <><section className="page-intro"><p className="eyebrow">CÀI ĐẶT</p><h1>Dữ liệu của bạn thuộc về bạn.</h1></section><section className="settings-list"><article><h2>Consent & AI</h2><p>Bạn luôn xem, sửa và duyệt đề xuất trước khi nó trở thành hành động.</p><button className="secondary">Xem consent</button></article><article><h2>Export dữ liệu</h2><p>Tải một bản dữ liệu có thể đọc được, gồm task và dữ liệu chưa hết hạn.</p><button className="secondary" onClick={() => void exportAccount()}>Yêu cầu export</button></article><article><h2>Xóa dữ liệu</h2><p>Brain Dump thô tự xóa sau 30 ngày. Bạn có thể xóa tài khoản sớm hơn.</p><button className="danger" onClick={() => void removeAccount()}>Xóa tài khoản</button></article><article className="admin-shortcut"><h2>Quản trị beta</h2><p>Chỉ dành cho người vận hành; không hiển thị nội dung cá nhân.</p><button className="text-action" onClick={onAdmin}>Mở admin demo →</button></article></section></> }

function AdminView({ remoteSession, onNotice }: { remoteSession: Session | null; onNotice: (value: string) => void }) { const [entries, setEntries] = useState<Array<{ id: string; email: string; name: string | null; status: string }>>([{ id: "demo-1", email: "linh@example.com", name: "Linh", status: "Chờ duyệt" }, { id: "demo-2", email: "minh@example.com", name: "Minh", status: "Đã mời" }]); useEffect(() => { if (!isConfigured || !remoteSession) return; void getAdminWaitlist(remoteSession).then((data) => setEntries(data.entries)).catch((error: Error) => onNotice(error.message)); }, [remoteSession, onNotice]); const approve = async (entry: { id: string; email: string; name: string | null; status: string }) => { try { if (isConfigured && remoteSession) await approveWaitlist(remoteSession, entry.id); setEntries(entries.map((item) => item.id === entry.id ? { ...item, status: "Đã mời" } : item)); onNotice(`Đã duyệt ${entry.email}.`); } catch (error) { onNotice(error instanceof Error ? error.message : "Không thể duyệt waitlist."); } }; return <><section className="page-intro"><p className="eyebrow">ADMIN · BETA</p><h1>Waitlist và tín hiệu sản phẩm.</h1><p>Nội dung Brain Dump và Check-in không bao giờ xuất hiện ở đây.</p></section><div className="metric-grid"><article><span>Waitlist</span><strong>{entries.length}</strong></article><article><span>Đã active</span><strong>{entries.filter((entry) => entry.status === "active" || entry.status === "Đã mời").length}</strong></article><article><span>Raw content</span><strong>0</strong></article></div><section className="feature-card"><h2>Đăng ký gần đây</h2><table><thead><tr><th>Tên</th><th>Email</th><th>Trạng thái</th><th></th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td>{entry.name ?? "—"}</td><td>{entry.email}</td><td>{entry.status}</td><td><button className="secondary" disabled={entry.status === "active" || entry.status === "Đã mời"} onClick={() => void approve(entry)}>Duyệt</button></td></tr>)}</tbody></table></section></> }

function ConsentDialog({ onClose, onAgree }: { onClose: () => void; onAgree: () => void }) { return <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="consent-title"><button className="close" onClick={onClose} aria-label="Đóng">×</button><p className="eyebrow">TRƯỚC KHI DÙNG AI</p><h2 id="consent-title">Bạn vẫn là người quyết định.</h2><p>Trong beta, nội dung Brain Dump được xử lý để gợi ý bước nhỏ và được mã hóa trước khi lưu. Nội dung thô tự xóa sau 30 ngày.</p><p>Đây không phải công cụ chẩn đoán hay hỗ trợ khẩn cấp.</p><button className="primary full" onClick={onAgree}>Tôi hiểu và đồng ý</button></section></div> }

function WaitlistDialog({ onClose, onSubmit, message }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; message: string }) { return <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="waitlist-title"><button className="close" onClick={onClose} aria-label="Đóng">×</button><p className="eyebrow">PRIVATE BETA</p><h2 id="waitlist-title">Tham gia khi sẵn sàng.</h2><p>Beneath the Pine đang mời một nhóm nhỏ cùng thử nghiệm sản phẩm.</p><form onSubmit={onSubmit}><label>Tên (tùy chọn)<input name="name" maxLength={80} /></label><label>Email<input name="email" type="email" required autoComplete="email" /></label><button className="primary full" type="submit">Đăng ký waitlist</button></form>{message && <p className="notice">{message}</p>}</section></div> }
function LoginDialog({ onClose, onSubmit, message }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; message: string }) { return <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="login-title"><button className="close" onClick={onClose} aria-label="Đóng">×</button><p className="eyebrow">PRIVATE BETA</p><h2 id="login-title">Đăng nhập bằng magic link.</h2><p>Chỉ những email đã được duyệt mới truy cập được không gian riêng tư.</p><form onSubmit={onSubmit}><label>Email<input name="email" type="email" required autoComplete="email" /></label><button className="primary full" type="submit">Gửi magic link</button></form>{message && <p className="notice">{message}</p>}</section></div> }
