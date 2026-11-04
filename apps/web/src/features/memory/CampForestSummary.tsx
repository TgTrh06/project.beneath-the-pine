import type { CampForest } from '@pyneath/contracts';
import { ForestPreview } from './ForestPreview';

export function CampForestSummary({ forest, loading, error, onRetry }: { forest: CampForest | null; loading: boolean; error: string; onRetry: () => void }) {
  const latest = forest?.milestones.at(-1)?.threshold;
  const title = latest === 7 ? 'Ánh đèn chung' : latest === 3 ? 'Khoảng hoa chung' : latest === 1 ? 'Mầm cây chung' : 'Một góc rừng đang đợi.';
  return <section className="camp-forest-summary" aria-label="Góc rừng chung">
    {loading ? <p role="status">Đang mở dấu chân chung…</p> : error ? <p role="status">{error} <button type="button" className="text-action" onClick={onRetry}>Tải lại dấu chân</button></p> : forest && <>
      <ForestPreview earned={forest.milestones.map(item => item.threshold)} arrangement={null}/>
      <div><p><strong>{title}</strong></p><p>{forest.sharedSessions ? `${forest.sharedSessions} phiên chung đã được ghi nhận.` : 'Sau chặng đã khép lại có ít nhất hai người tham gia.'}</p></div>
    </>}
  </section>;
}
