import { useCallback, useEffect, useRef, useState } from 'react';
import type { CampForest, ForestThreshold } from '@pyneath/contracts';
import { getCampForests, getMemory } from '../../shared/api/clients/memory';
import { ErrorMessage } from '../../shared/components/ui';
import { formatTime } from '../../shared/time';
import { ForestMemoryMark } from './PersonalForest';
import { ForestPreview } from './ForestPreview';

const memories: Record<ForestThreshold, { title: string; detail: string }> = {
  1: { title: 'Mầm cây chung', detail: 'Một lần cùng có mặt, một mầm cây ở lại.' },
  3: { title: 'Khoảng hoa chung', detail: 'Những lần gặp nhau đã để lại một khoảng hoa.' },
  7: { title: 'Ánh đèn chung', detail: 'Góc rừng chung có thêm một ánh đèn.' },
};
type SharedMemory = Awaited<ReturnType<typeof getMemory>>['milestones'][number];
type Journal = { camps: CampForest[]; entries: SharedMemory[] };

/** Mounted only for the Camp tab, beneath the account-keyed app layout. Never retain stale access data. */
export function CampForestJournal() {
  const [data, setData] = useState<Journal | null>(null), [error, setError] = useState('');
  const [selected, setSelected] = useState('');
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    const request = ++sequence.current;
    setData(null); setError('');
    try {
      const [forest, memory] = await Promise.all([getCampForests(), getMemory()]);
      if (request !== sequence.current) return;
      const allowed = new Set(forest.camps.map(camp => camp.campId));
      setData({ camps: forest.camps, entries: memory.milestones.filter(entry => allowed.has(entry.campId)) });
    } catch {
      if (request === sequence.current) setError('Chưa tải được kỷ niệm chung. Hãy thử lại để cập nhật quyền xem và dấu chân của Camp.');
    }
  }, []);
  useEffect(() => {
    const visibility = () => {
      if (document.visibilityState === 'visible') void reload();
      else { sequence.current++; setData(null); setError(''); }
    };
    visibility(); document.addEventListener('visibilitychange', visibility);
    return () => { sequence.current++; document.removeEventListener('visibilitychange', visibility); };
  }, [reload]);
  if (error) return <section className="camp-forest-journal" aria-label="Kỷ niệm cùng Camp"><ErrorMessage message={error} retry={reload}/></section>;
  if (!data) return <p role="status">Đang mở dấu chân chung…</p>;
  if (!data.camps.length) return <section className="camp-forest-journal" aria-label="Kỷ niệm cùng Camp"><p>Bạn chưa có Camp để xem kỷ niệm chung.</p><a href="#camps">Xem Camp của bạn</a></section>;
  const camp = data.camps.find(item => item.campId === selected) ?? data.camps[0];
  return <section className="camp-forest-journal" aria-label="Kỷ niệm cùng Camp">
    {data.camps.length > 1 && <label className="camp-forest-select">Chọn Camp<select value={camp.campId} onChange={event => setSelected(event.target.value)}>{data.camps.map(item => <option key={item.campId} value={item.campId}>{item.name}{item.status === 'archived' ? ' · Đã lưu trữ' : ''}</option>)}</select></label>}
    {selected && selected !== camp.campId && <p role="status" className="field-hint">Danh sách Camp đã được cập nhật.</p>}
    <CampMemories key={camp.campId} camp={camp} entries={data.entries.filter(item => item.campId === camp.campId)}/>
  </section>;
}

function CampMemories({ camp, entries }: { camp: CampForest; entries: SharedMemory[] }) {
  const [page, setPage] = useState(0);
  const sorted = [...entries].sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt) || a.id.localeCompare(b.id));
  const start = page * 4;
  return <>
    <div className="personal-forest-heading"><div><p className="eyebrow">GÓC RỪNG CHUNG</p><h2>{camp.name}</h2></div></div>
    {camp.status === 'archived' && <p className="field-hint">Camp đã lưu trữ · Những dấu chân vẫn ở đây.</p>}
    <ForestPreview earned={camp.milestones.map(item => item.threshold)} arrangement={null}/>
    <p className="field-hint">{camp.sharedSessions ? `${camp.sharedSessions} phiên chung đã được ghi nhận.` : 'Một góc rừng đang đợi những lần cùng có mặt.'}</p>
    <p className="field-hint">Kỷ niệm chung xuất hiện sau phiên đã khép lại có ít nhất hai người tham gia. Mỗi lần gặp nhau đều có chỗ, bất cứ khi nào mọi người sẵn sàng.</p>
    <ol className="forest-milestones">{([1, 3, 7] as const).map(threshold => {
      const milestone = camp.milestones.find(item => item.threshold === threshold);
      return <li key={threshold} data-earned={Boolean(milestone)}><ForestMemoryMark threshold={threshold}/><div><h3>{memories[threshold].title}</h3>
        {milestone ? <><p>{memories[threshold].detail}</p><p className="field-hint">Đã ghi nhận · <time dateTime={milestone.recordedAt}>{formatTime(milestone.recordedAt)}</time></p></> : <p className="field-hint">Sẽ xuất hiện sau {threshold} phiên chung được ghi nhận.</p>}
      </div></li>;
    })}</ol>
    <section className="forest-memory-pages" aria-label={`Những lần cùng có mặt · ${camp.name}`}><h3>Những lần cùng có mặt</h3>
      {sorted.length ? <ul className="row-list">{sorted.slice(start, start + 4).map(item => <li key={item.id}>Một Focus Pact đã khép lại<p className="field-hint"><time dateTime={item.recordedAt}>{formatTime(item.recordedAt)}</time></p></li>)}</ul> : <p>Những phiên chung đủ điều kiện sẽ được lưu ở đây.</p>}
      {sorted.length > 4 && <div className="button-row forest-pagination"><button className="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Trước</button><span role="status">{page + 1} / {Math.ceil(sorted.length / 4)}</span><button className="secondary" disabled={start + 4 >= sorted.length} onClick={() => setPage(page + 1)}>Tiếp</button></div>}
    </section>
  </>;
}
