import { useCallback, useEffect, useRef, useState } from 'react';
import type { PactListItem } from '@beneath-the-pine/contracts';
import { joinSession, listPacts, respondPact, getProfile } from '../../shared/api/api';
import { useResource } from '../../shared/api/useResource';
import { ErrorMessage } from '../../shared/components/ui';
import { deviceTimezone, formatTime } from '../../shared/time';
import '../circles/circles.css';

const groups = {pending:'Chờ trả lời',upcoming:'Sắp tới',active:'Đang diễn ra',past:'Đã qua'} as const;
const status = {scheduled:'Đã hẹn',active:'Đang diễn ra',completed:'Đã khép lại',cancelled:'Đã hủy',expired:'Đã hết hạn'};
export function PactsView({circleId,onOpen,onSession}:{circleId?:string;onOpen:(id:string)=>void;onSession?:(id:string)=>void}) {
  const [group,setGroup]=useState<keyof typeof groups>('pending');
  return <section className="circles-page pact-list"><p className="eyebrow">FOCUS PACT</p>{circleId ? <h2>Cuộc hẹn của bạn trong nhóm</h2> : <h1>Cuộc hẹn của tôi</h1>}<p>Chỉ những cuộc hẹn bạn được chọn tham gia.</p>
    <div className="button-row" role="group" aria-label="Nhóm cuộc hẹn">{Object.entries(groups).map(([key,label])=><button key={key} className="choice" aria-pressed={key===group} onClick={()=>setGroup(key as keyof typeof groups)}>{label}</button>)}</div>
    <PactRows key={`${circleId ?? 'all'}:${group}`} circleId={circleId} group={group} onOpen={onOpen} onSession={onSession}/>
  </section>;
}
function PactRows({circleId,group,onOpen,onSession}:{circleId?:string;group:keyof typeof groups;onOpen:(id:string)=>void;onSession?:(id:string)=>void}) {
  const [items,setItems]=useState<PactListItem[]>([]); const [cursor,setCursor]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [actionError,setActionError]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
  const lock=useRef(false); const generation=useRef(0);const mounted=useRef(true);
  const profile=useResource(getProfile); const timezone=profile.data?.profile?.timezone ?? deviceTimezone();
  const load=useCallback(async(next?:string)=>{const seq=++generation.current;setLoading(true);setError('');try {const page=await listPacts(group,next,circleId);if(mounted.current && seq===generation.current){setItems(old=>next ? [...old,...page.items.filter(item=>!old.some(row=>row.id===item.id))] : page.items);setCursor(page.nextCursor);}}catch(e){if(mounted.current)setError((e as Error).message);}finally{if(mounted.current && seq===generation.current)setLoading(false);}},[group,circleId]);
  useEffect(()=>{mounted.current=true;void load();return()=>{mounted.current=false;generation.current++;};},[load]);
  const act=async(action:()=>Promise<void>)=>{if(lock.current)return;lock.current=true;setBusy(true);setActionError('');try{await action();await load();}catch(e){setActionError((e as Error).message);await load();}finally{lock.current=false;setBusy(false);}};
  return <><ErrorMessage message={profile.error}/><ErrorMessage message={error} retry={()=>void load(items.length ? cursor ?? undefined : undefined)}/><ErrorMessage message={actionError}/>{message && <p role="status">{message}</p>}
    {!loading && !error && !items.length && <p className="field-hint">Chưa có cuộc hẹn trong mục “{groups[group]}”.</p>}
    <ul className="row-list">{items.map(item=><li key={item.id}><button className="text-action" onClick={()=>onOpen(item.id)}>{item.circleName}</button><p>{formatTime(item.startsAt,timezone)} · {item.durationMinutes} phút</p><p className="field-hint">{status[item.status]} · {item.response==='invited'?'Chưa trả lời':item.response==='accepted'?'Đã nhận lời':'Không tham gia'}{item.isCreator?' · Bạn tạo cuộc hẹn':''}</p>
      {group==='pending' && <div className="button-row"><button className="primary" disabled={busy} onClick={()=>void act(async()=>{await respondPact(item.id,'accepted');setMessage('Đã nhận lời. Cuộc hẹn nằm trong mục Sắp tới.');})}>Nhận lời</button><button className="secondary" disabled={busy} onClick={()=>void act(async()=>{await respondPact(item.id,'declined');setMessage('Đã cập nhật: không tham gia.');})}>Không tham gia</button></div>}
      {group==='active' && item.sessionId && onSession && <button className="primary" disabled={busy} onClick={()=>void act(async()=>{const result=await joinSession(item.sessionId!);onSession(result.session.id);})}>Tham gia phiên</button>}
      <button className="text-action" onClick={()=>onOpen(item.id)}>Xem cuộc hẹn</button></li>)}</ul>
    {loading && <p role="status">Đang tải cuộc hẹn…</p>}<div className="button-row">{cursor && <button className="secondary" disabled={loading||busy} onClick={()=>void load(cursor)}>Tải thêm</button>}<button className="text-action" disabled={loading||busy} onClick={()=>void load()}>Cập nhật danh sách</button></div>
  </>;
}
