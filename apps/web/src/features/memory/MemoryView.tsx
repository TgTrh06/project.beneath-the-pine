import { getHistory, getMemory } from "../../shared/api/api";
import { useResource } from "../../shared/api/useResource";
import { ErrorMessage } from "../../shared/components/ui";
import { formatTime } from "../../shared/time";
import { outcomes } from "../focus/sessionState";
export function MemoryView(_: { onNotice: (text: string) => void }) {
  const history = useResource(getHistory); const memory = useResource(getMemory);
  return <><section className="page-intro"><p className="eyebrow">KỶ NIỆM</p><h1>Những lần đã có mặt.</h1><p>Không điểm số, không xếp hạng. Chỉ những dấu chân đã qua.</p></section>
    <section className="feature-card"><h2>Những chặng của bạn</h2><ErrorMessage message={history.error} retry={history.reload}/>{history.loading ? <p role="status">Đang mở lịch sử…</p> : history.data && (history.data.sessions.length ? <ul className="row-list">{history.data.sessions.map(item => <li key={item.id}><strong>{item.kind === "solo" ? "Một chặng riêng" : "Một chặng cùng nhau"}</strong><p className="field-hint">{formatTime(item.startedAt)} · {item.outcome ? outcomes[item.outcome] : item.status === "active" ? "Đang diễn ra" : "Đã khép lại"}</p></li>)}</ul> : <p>Một chặng nhỏ đầu tiên sẽ xuất hiện ở đây.</p>)}{history.data?.sessions.length === 100 && <p className="field-hint">Hiển thị 100 phiên gần nhất.</p>}</section>
    <section className="feature-card warm-card"><h2>Kỷ niệm cùng Circle</h2><ErrorMessage message={memory.error} retry={memory.reload}/>{memory.loading ? <p role="status">Đang mở kỷ niệm…</p> : memory.data && (memory.data.milestones.length ? <ul className="row-list">{memory.data.milestones.map(item => <li key={item.id}>Một Focus Pact đã khép lại<p className="field-hint">{formatTime(item.recordedAt)}</p></li>)}</ul> : <p>Kỷ niệm chung xuất hiện sau phiên đủ điều kiện có ít nhất hai người tham gia.</p>)}</section>
  </>;
}
