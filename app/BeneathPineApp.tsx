"use client";

import { useEffect, useMemo, useState } from "react";

type TaskStatus = "ready" | "done";
type Energy = "thấp" | "vừa" | "cao";

type Task = {
  id: string;
  title: string;
  minutes: number;
  status: TaskStatus;
  createdAt: string;
};

const initialTasks: Task[] = [
  {
    id: "seed-1",
    title: "Mở báo cáo và viết 3 tiêu đề chính",
    minutes: 10,
    status: "ready",
    createdAt: "2026-08-04T08:00:00.000Z",
  },
  {
    id: "seed-2",
    title: "Gửi email xác nhận lịch hẹn",
    minutes: 5,
    status: "ready",
    createdAt: "2026-08-04T08:00:00.000Z",
  },
  {
    id: "seed-3",
    title: "Chuẩn bị một chai nước cho chiều nay",
    minutes: 2,
    status: "done",
    createdAt: "2026-08-04T08:00:00.000Z",
  },
];

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function extractItems(text: string) {
  const normalized = text
    .replace(/\n+/g, "\n")
    .split(/[\n;]+/)
    .map((item) => item.replace(/^[\s\-•\d.)]+/, "").trim())
    .filter((item) => item.length > 2);

  return normalized.slice(0, 5);
}

export function BeneathPineApp() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activePanel, setActivePanel] = useState<"capture" | "reset" | "review" | null>(null);
  const [brainDump, setBrainDump] = useState("");
  const [captureNotice, setCaptureNotice] = useState("");
  const [energy, setEnergy] = useState<Energy>("vừa");
  const [availableMinutes, setAvailableMinutes] = useState(45);
  const [resetNotice, setResetNotice] = useState("");
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [focusSeconds, setFocusSeconds] = useState(600);
  const [isFocusing, setIsFocusing] = useState(false);
  const [weeklyExperiment, setWeeklyExperiment] = useState("");

  useEffect(() => {
    const savedTasks = window.localStorage.getItem("beneath-pine-tasks");
    const savedExperiment = window.localStorage.getItem("beneath-pine-experiment");
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks) as Task[]);
      } catch {
        window.localStorage.removeItem("beneath-pine-tasks");
      }
    }
    if (savedExperiment) setWeeklyExperiment(savedExperiment);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) window.localStorage.setItem("beneath-pine-tasks", JSON.stringify(tasks));
  }, [tasks, isHydrated]);

  useEffect(() => {
    if (isHydrated) window.localStorage.setItem("beneath-pine-experiment", weeklyExperiment);
  }, [weeklyExperiment, isHydrated]);

  useEffect(() => {
    if (!isFocusing) return;
    const interval = window.setInterval(() => {
      setFocusSeconds((seconds) => {
        if (seconds <= 1) {
          setIsFocusing(false);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isFocusing]);

  const readyTasks = useMemo(() => tasks.filter((task) => task.status === "ready"), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((task) => task.status === "done"), [tasks]);
  const currentTask = readyTasks[0] ?? null;
  const focusedTask = tasks.find((task) => task.id === focusTaskId) ?? currentTask;
  const taskProgress = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  function addBrainDumpItems() {
    const items = extractItems(brainDump);
    if (!items.length) {
      setCaptureNotice("Hãy viết một điều đang chiếm tâm trí bạn — không cần phải rõ ràng.");
      return;
    }
    const newTasks = items.map((item, index) => ({
      id: createId(),
      title: index === 0 ? `Bước đầu: ${item}` : item,
      minutes: index === 0 ? 10 : 5,
      status: "ready" as TaskStatus,
      createdAt: new Date().toISOString(),
    }));
    setTasks((existing) => [...newTasks, ...existing]);
    setBrainDump("");
    setCaptureNotice(`Mình đã giữ lại ${newTasks.length} điều. Việc đầu tiên đã được đặt lên trước.`);
  }

  function completeTask(taskId: string) {
    setTasks((existing) => existing.map((task) => (task.id === taskId ? { ...task, status: "done" } : task)));
    if (focusTaskId === taskId) {
      setIsFocusing(false);
      setFocusTaskId(null);
      setFocusSeconds(600);
    }
  }

  function makeTaskSmaller() {
    if (!currentTask) return;
    setTasks((existing) =>
      existing.map((task) =>
        task.id === currentTask.id
          ? { ...task, title: `Mở phần liên quan đến “${task.title.replace(/^Bước đầu:\s*/, "")}” và viết một gạch đầu dòng`, minutes: 5 }
          : task,
      ),
    );
  }

  function startFocus(task: Task | null) {
    if (!task) return;
    setFocusTaskId(task.id);
    setFocusSeconds(task.minutes * 60);
    setIsFocusing(true);
  }

  function saveReset() {
    const manageable = energy === "thấp" ? 1 : energy === "vừa" ? 2 : 3;
    const kept = readyTasks.slice(0, manageable);
    if (!kept.length) {
      setResetNotice("Hôm nay không còn việc nào cần giữ. Nghỉ một chút cũng là một kế hoạch hợp lệ.");
      return;
    }
    setTasks((existing) => {
      const keepIds = new Set(kept.map((task) => task.id));
      return existing.map((task) => (task.status === "ready" && !keepIds.has(task.id) ? { ...task, status: "done" } : task));
    });
    setResetNotice(`Mình giữ lại ${kept.length} việc phù hợp với ${availableMinutes} phút và năng lượng ${energy} của bạn.`);
  }

  function resetPrototype() {
    window.localStorage.removeItem("beneath-pine-tasks");
    window.localStorage.removeItem("beneath-pine-experiment");
    setTasks(initialTasks);
    setWeeklyExperiment("");
    setCaptureNotice("");
    setResetNotice("");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#now" aria-label="Beneath the Pine, về trang hôm nay">
          <span className="brand-mark" aria-hidden="true">⌁</span>
          <span>Beneath the Pine</span>
        </a>
        <div className="topbar-actions">
          <span className="local-badge">Lưu trên thiết bị này</span>
          <button className="avatar" type="button" aria-label="Hồ sơ thử nghiệm">TL</button>
        </div>
      </header>

      <section className="welcome" id="now" aria-labelledby="welcome-title">
        <div>
          <p className="eyebrow">Thứ Hai, 04 tháng 08</p>
          <h1 id="welcome-title">Chào bạn. Mình bắt đầu từ điều nhỏ nhất nhé.</h1>
          <p className="welcome-copy">Bạn không cần xử lý hết mọi thứ hôm nay. Chỉ cần chọn một bước tiếp theo.</p>
        </div>
        <div className="forest-orb" aria-label="Tiến trình hôm nay: 42 phần trăm" role="img">
          <span className="tree-trunk" />
          <span className="tree-crown crown-one" />
          <span className="tree-crown crown-two" />
          <span className="tree-crown crown-three" />
          <span className="orb-caption">hôm nay</span>
        </div>
      </section>

      <nav className="quick-actions" aria-label="Hành động nhanh">
        <button className="quick-action is-primary" type="button" onClick={() => setActivePanel("capture")}>
          <span aria-hidden="true">✦</span>
          <span><strong>Trút bớt trong đầu</strong><small>Brain dump tự do</small></span>
        </button>
        <button className="quick-action" type="button" onClick={() => currentTask && startFocus(currentTask)} disabled={!currentTask}>
          <span aria-hidden="true">◷</span>
          <span><strong>Bắt đầu 10 phút</strong><small>Chỉ cần mở đầu</small></span>
        </button>
        <button className="quick-action" type="button" onClick={() => setActivePanel("reset")}>
          <span aria-hidden="true">↺</span>
          <span><strong>Reset hôm nay</strong><small>Lập lại nhẹ nhàng</small></span>
        </button>
      </nav>

      <div className="dashboard-grid">
        <section className="panel now-panel" aria-labelledby="next-action-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">NGAY LÚC NÀY</p>
              <h2 id="next-action-title">Một bước tiếp theo</h2>
            </div>
            <span className="leaf-dot" aria-hidden="true">●</span>
          </div>

          {currentTask ? (
            <div className="next-action-card">
              <span className="soft-tag">{currentTask.minutes} phút là đủ</span>
              <h3>{currentTask.title}</h3>
              <p>Không cần hoàn hảo. Khi thời gian hết, bạn có thể dừng hoặc tiếp tục.</p>
              <div className="next-action-buttons">
                <button className="button button-primary" type="button" onClick={() => startFocus(currentTask)}>Bắt đầu ngay <span aria-hidden="true">→</span></button>
                <button className="button button-quiet" type="button" onClick={makeTaskSmaller}>Vẫn bị kẹt</button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <span aria-hidden="true">✧</span>
              <h3>Hôm nay đã đủ rồi.</h3>
              <p>Bạn có thể nghỉ, hoặc trút thêm điều đang ở trong đầu.</p>
              <button className="button button-primary" type="button" onClick={() => setActivePanel("capture")}>Mở Brain Dump</button>
            </div>
          )}

          <div className="gentle-note"><span aria-hidden="true">🦦</span> Pine Marten nhắc nhỏ: quay lại cũng là tiến bộ.</div>
        </section>

        <aside className="panel focus-panel" aria-labelledby="focus-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">KHÔNG GIAN TẬP TRUNG</p>
              <h2 id="focus-title">{isFocusing ? "Bạn đang ở đây" : "Sẵn sàng khi bạn muốn"}</h2>
            </div>
            <span className={`focus-pulse ${isFocusing ? "is-active" : ""}`} aria-hidden="true" />
          </div>
          <div className="timer" aria-live="polite">{formatTime(focusSeconds)}</div>
          <p className="focus-task">{focusedTask ? focusedTask.title : "Chọn một bước trước nhé"}</p>
          <div className="timer-actions">
            <button className="button button-primary" type="button" onClick={() => setIsFocusing((value) => !value)} disabled={!focusedTask}>
              {isFocusing ? "Tạm dừng" : focusSeconds === 0 ? "Bắt đầu lại" : "Bắt đầu"}
            </button>
            <button className="button button-quiet" type="button" onClick={() => focusedTask && completeTask(focusedTask.id)} disabled={!focusedTask}>Đã xong</button>
          </div>
        </aside>
      </div>

      <section className="lower-grid">
        <section className="panel tasks-panel" aria-labelledby="tasks-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">NHỮNG ĐIỀU ĐANG CHỜ</p>
              <h2 id="tasks-title">Danh sách nhẹ</h2>
            </div>
            <button className="text-button" type="button" onClick={() => setActivePanel("capture")}>Thêm điều mới</button>
          </div>
          <div className="task-list">
            {readyTasks.slice(0, 4).map((task, index) => (
              <article className="task-row" key={task.id}>
                <button className="task-check" type="button" aria-label={`Đánh dấu hoàn thành: ${task.title}`} onClick={() => completeTask(task.id)} />
                <div>
                  <p>{task.title}</p>
                  <span>{index === 0 ? "Ưu tiên nhẹ nhàng" : `${task.minutes} phút`}</span>
                </div>
                {index === 0 && <span className="task-current">bây giờ</span>}
              </article>
            ))}
            {!readyTasks.length && <p className="list-empty">Không có gì đang đòi hỏi sự chú ý của bạn.</p>}
          </div>
        </section>

        <section className="panel growth-panel" aria-labelledby="growth-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">NHỊP ĐỘ CỦA BẠN</p>
              <h2 id="growth-title">Khu rừng nhỏ</h2>
            </div>
            <button className="text-button" type="button" onClick={() => setActivePanel("review")}>Xem tuần này</button>
          </div>
          <div className="growth-content">
            <div className="ring-wrap" style={{ "--progress": `${Math.max(taskProgress, 18)}%` } as React.CSSProperties}>
              <span>{taskProgress}%</span>
            </div>
            <div>
              <p className="growth-title">Mỗi lần bạn quay lại, rễ lại sâu hơn.</p>
              <p className="growth-copy">{completedTasks.length} điều đã được khép lại trong dữ liệu thử nghiệm này.</p>
              <button className="mini-link" type="button" onClick={resetPrototype}>Làm mới dữ liệu demo</button>
            </div>
          </div>
        </section>
      </section>

      <footer className="prototype-footer">
        <span>Prototype nội bộ · Dữ liệu chỉ lưu trong trình duyệt của bạn.</span>
        <span>Không phải công cụ chẩn đoán hoặc điều trị ADHD.</span>
      </footer>

      {activePanel && (
        <div className="overlay" role="presentation" onMouseDown={() => setActivePanel(null)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby={`${activePanel}-title`} onMouseDown={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" aria-label="Đóng" onClick={() => setActivePanel(null)}>×</button>

            {activePanel === "capture" && (
              <>
                <p className="eyebrow">BRAIN DUMP</p>
                <h2 id="capture-title">Cứ đặt xuống đây.</h2>
                <p className="modal-copy">Không cần sắp xếp, không cần viết đẹp. Mỗi dòng hoặc dấu chấm phẩy sẽ được giữ thành một điều riêng.</p>
                <label className="sr-only" htmlFor="brain-dump">Những điều đang chiếm tâm trí bạn</label>
                <textarea id="brain-dump" value={brainDump} onChange={(event) => setBrainDump(event.target.value)} placeholder="Ví dụ: phải nộp báo cáo; gọi lại cho mẹ; phòng hơi bừa; chưa biết bắt đầu từ đâu…" autoFocus />
                {captureNotice && <p className="modal-notice" aria-live="polite">{captureNotice}</p>}
                <button className="button button-primary button-wide" type="button" onClick={addBrainDumpItems}>Giữ lại và chọn bước đầu <span aria-hidden="true">→</span></button>
              </>
            )}

            {activePanel === "reset" && (
              <>
                <p className="eyebrow">RESET HÔM NAY</p>
                <h2 id="reset-title">Mình làm lại từ lúc này.</h2>
                <p className="modal-copy">Không cần cứu cả ngày. Hãy chọn điều còn thực tế với thời gian và năng lượng của bạn.</p>
                <fieldset>
                  <legend>Năng lượng hiện tại</legend>
                  <div className="choice-row">
                    {(["thấp", "vừa", "cao"] as Energy[]).map((item) => (
                      <button key={item} type="button" className={`choice ${energy === item ? "is-selected" : ""}`} onClick={() => setEnergy(item)}>{item}</button>
                    ))}
                  </div>
                </fieldset>
                <label className="range-label" htmlFor="available-time">Bạn còn khoảng <strong>{availableMinutes} phút</strong> cho hôm nay</label>
                <input id="available-time" type="range" min="15" max="180" step="15" value={availableMinutes} onChange={(event) => setAvailableMinutes(Number(event.target.value))} />
                {resetNotice && <p className="modal-notice" aria-live="polite">{resetNotice}</p>}
                <button className="button button-primary button-wide" type="button" onClick={saveReset}>Tạo một kế hoạch nhẹ</button>
              </>
            )}

            {activePanel === "review" && (
              <>
                <p className="eyebrow">PHẢN TƯ TUẦN NÀY</p>
                <h2 id="review-title">Một điều đáng để nhận ra.</h2>
                <div className="insight-card">
                  <span className="insight-label">DỮ KIỆN</span>
                  <p>Bạn đã khép lại <strong>{completedTasks.length}/{tasks.length || 1}</strong> điều trong danh sách thử nghiệm.</p>
                  <span className="insight-label">GỢI Ý NHẸ NHÀNG</span>
                  <p>Những việc có bước đầu nhỏ thường dễ quay lại hơn. Tuần tới, hãy thử bắt đầu mọi việc lớn bằng một hành động dưới 10 phút.</p>
                </div>
                <label htmlFor="experiment">Thử nghiệm nhỏ của tuần tới</label>
                <input id="experiment" value={weeklyExperiment} onChange={(event) => setWeeklyExperiment(event.target.value)} placeholder="Ví dụ: Mở file trước khi pha cà phê" />
                <button className="button button-primary button-wide" type="button" onClick={() => setActivePanel(null)}>Lưu điều này cho tuần tới</button>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
