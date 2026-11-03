import {useState} from 'react';
import { getHistory, getMemory } from "../../shared/api/api";
import { useResource } from "../../shared/api/useResource";
import { ErrorMessage } from "../../shared/components/ui";
import { formatTime } from "../../shared/time";
import { outcomes } from "../focus/sessionState";
export function MemoryView(_: { onNotice: (text: string) => void }) {
 const history=useResource(getHistory),memory=useResource(getMemory);
 const [tab,setTab]=useState<'own'|'camp'>('own'),[page,setPage]=useState(0);
 const own=history.data?.sessions??[],shared=memory.data?.milestones??[],items=tab==='own'?own:shared;
 const current=Math.min(page,Math.max(0,Math.ceil(items.length/4)-1)),start=current*4;
 return <div className="forest-memory"><section className="page-intro"><p className="eyebrow">KỶ NIỆM</p><h1>Những lần đã có mặt.</h1><p>Mỗi chặng nhỏ, một dấu chân.</p></section>
 <div className="button-row" role="group" aria-label="Loại kỷ niệm"><button className="choice" aria-pressed={tab==='own'} onClick={()=>{setTab('own');setPage(0)}}>Chặng riêng</button><button className="choice" aria-pressed={tab==='camp'} onClick={()=>{setTab('camp');setPage(0)}}>Cùng Camp</button></div>
 <section className="forest-memory-pages" aria-label={tab==='own'?'Những chặng của bạn':'Kỷ niệm cùng Camp'}>
 {tab==='own'?<><ErrorMessage message={history.error} retry={history.reload}/>{history.loading?<p role="status">Đang mở lịch sử…</p>:history.data&&(own.length?<ul className="row-list">{own.slice(start,start+4).map(item=><li key={item.id}><strong>{item.kind==='solo'?'Một chặng riêng':'Một chặng cùng nhau'}</strong><p className="field-hint">{formatTime(item.startedAt)} · {item.outcome?outcomes[item.outcome]:item.status==='active'?'Đang diễn ra':'Đã khép lại'}</p></li>)}</ul>:<p>Một chặng nhỏ đầu tiên sẽ xuất hiện ở đây.</p>)}{own.length===100&&<p className="field-hint">Hiển thị 100 phiên gần nhất.</p>}</>:<><ErrorMessage message={memory.error} retry={memory.reload}/>{memory.loading?<p role="status">Đang mở kỷ niệm…</p>:memory.data&&(shared.length?<ul className="row-list">{shared.slice(start,start+4).map(item=><li key={item.id}>Một Focus Pact đã khép lại<p className="field-hint">{formatTime(item.recordedAt)}</p></li>)}</ul>:<p>Kỷ niệm chung xuất hiện sau phiên đủ điều kiện có ít nhất hai người tham gia.</p>)}</>}
 {items.length>4&&<div className="button-row forest-pagination"><button className="secondary" disabled={current===0} onClick={()=>setPage(current-1)}>Trước</button><span role="status">{current+1} / {Math.ceil(items.length/4)}</span><button className="secondary" disabled={start+4>=items.length} onClick={()=>setPage(current+1)}>Tiếp</button></div>}
 </section></div>;
}
