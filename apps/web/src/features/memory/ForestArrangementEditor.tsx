import { useRef, useState } from 'react';
import { defaultForestArrangement, type ForestArrangement } from '@pyneath/contracts';
import { ApiRequestError } from '../../shared/api/api';
import { forestMemories, usePersonalForest } from './PersonalForest';
import { ForestPreview } from './ForestPreview';
import { forestLayouts } from './forestArrangement';

export function ForestArrangementEditor() {
  const { data, arrangement, arrangementError, reloadArrangement, saveArrangement } = usePersonalForest();
  const [draft, setDraft] = useState<ForestArrangement | null>(null), [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(''), [conflict, setConflict] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null), firstChoice = useRef<HTMLInputElement>(null);
  const earned = data?.milestones.map(item => item.threshold) ?? [];
  const value = draft ?? arrangement;
  const close = () => { setDraft(null); setConflict(false); requestAnimationFrame(() => editButton.current?.focus()); };
  async function save() {
    if (!draft || busy) return;
    setBusy(true); setMessage('');
    try { await saveArrangement(draft); close(); setMessage('Đã lưu cách sắp xếp góc rừng.'); }
    catch (error) {
      const changed = error instanceof ApiRequestError && error.status === 409;
      setConflict(changed);
      setMessage(changed ? 'Góc rừng đã được thay đổi ở nơi khác. Tải bản đã lưu để tiếp tục; bản nháp này sẽ được thay thế.' : 'Chưa lưu được. Bản nháp vẫn ở đây để bạn thử lại.');
    } finally { setBusy(false); }
  }
  async function reload() {
    setBusy(true);
    try { const next = await reloadArrangement(); if (draft) setDraft(next); setConflict(false); setMessage('Đã tải cách sắp xếp đang lưu.'); }
    catch { setMessage('Chưa tải được. Bản nháp vẫn được giữ lại.'); }
    finally { setBusy(false); }
  }
  return <section className="forest-editor" aria-labelledby="forest-editor-title">
    <h2 id="forest-editor-title">Sắp xếp góc rừng</h2>
    <p className="field-hint">Chọn chỗ cho những điều đã ở lại. Cất một vật phẩm vẫn giữ nguyên kỷ niệm và ngày ghi nhận.</p>
    {data && value && <ForestPreview earned={earned} arrangement={value}/>}
    {!arrangement && <p role="status">{arrangementError || 'Đang mở cách sắp xếp…'}</p>}
    {arrangementError && <button className="secondary" disabled={busy} onClick={() => void reload()}>Tải lại cách sắp xếp</button>}
    <button ref={editButton} className="secondary" hidden={!!draft} disabled={!data || !arrangement || busy} onClick={() => { setDraft(structuredClone(arrangement!)); setMessage(''); requestAnimationFrame(() => firstChoice.current?.focus()); }}>Sắp xếp</button>
    {draft && <form onSubmit={event => { event.preventDefault(); void save(); }}>
      <fieldset disabled={busy}><legend>Bố cục</legend><div className="forest-layout-choices">{forestLayouts.map((layout, index) => <label key={layout.id}>
        <input ref={index === 0 ? firstChoice : undefined} type="radio" name="forest-layout" value={layout.id} checked={draft.layout === layout.id} onChange={() => setDraft({ ...draft, layout: layout.id })}/>{layout.label}
      </label>)}</div></fieldset>
      <fieldset disabled={busy}><legend>Vật phẩm trong cảnh</legend>{([1, 3, 7] as const).map(threshold => <div className="forest-item-choice" key={threshold}>
        <label><input type="checkbox" disabled={!earned.includes(threshold)} checked={earned.includes(threshold) && !draft.hidden.includes(threshold)} onChange={event => setDraft({ ...draft, hidden: event.target.checked ? draft.hidden.filter(item => item !== threshold) : [...draft.hidden, threshold] })}/>{forestMemories[threshold].title}</label>
        <p className="field-hint">{!earned.includes(threshold) ? `Mở sau ${threshold} chặng khép lại.` : draft.hidden.includes(threshold) ? 'Đã đạt · Đang cất' : 'Đã đạt · Đang hiện'}</p>
      </div>)}</fieldset>
      <p className="field-hint">Bản xem trước nhìn từ trên xuống. Thay đổi xuất hiện trong rừng khi bạn lưu.</p>
      <div className="button-row"><button type="submit" className="primary" disabled={busy || conflict}>{busy ? 'Đang lưu…' : 'Lưu góc rừng'}</button><button type="button" className="secondary" disabled={busy} onClick={() => { close(); setMessage('Đã hủy thay đổi.'); }}>Hủy</button>
        <button type="button" className="text-action" disabled={busy} onClick={() => setDraft({ ...defaultForestArrangement, hidden: [], version: draft.version })}>Về mặc định</button></div>
      {conflict && <button type="button" className="secondary" disabled={busy} onClick={() => void reload()}>Tải bản đã lưu</button>}
    </form>}
    {message && <p role="status">{message}</p>}
  </section>;
}
