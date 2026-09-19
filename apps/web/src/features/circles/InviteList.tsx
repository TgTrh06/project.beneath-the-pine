import { useEffect, useRef, useState } from 'react';
import type { InviteListItem } from '@beneath-the-pine/contracts';
import { listCircleInvites, revokeInvite } from '../../shared/api/api';
import { Dialog, ErrorMessage } from '../../shared/components/ui';
import { formatTime } from '../../shared/time';
export function InviteList({id,timezone,revision,onRevoked}:{id:string;timezone:string;revision:number;onRevoked?:(id:string)=>void}) {
  const [items,setItems]=useState<InviteListItem[]>([]);const [cursor,setCursor]=useState<string|null>(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [confirm,setConfirm]=useState<string|null>(null);const lock=useRef(false);const alive=useRef(true);
  const load=async(next?:string)=>{setError('');const page=await listCircleInvites(id,next);if(alive.current){setItems(old=>next?[...old,...page.items.filter(item=>!old.some(x=>x.id===item.id))]:page.items);setCursor(page.nextCursor);}};
  const act=async(action:()=>Promise<void>)=>{if(lock.current)return;lock.current=true;setBusy(true);try{await action();}catch(e){if(alive.current)setError((e as Error).message);}finally{lock.current=false;if(alive.current)setBusy(false);}};
  useEffect(()=>{alive.current=true;void act(()=>load());return()=>{alive.current=false;};},[id,revision]);
  const labels={pending:'Còn hiệu lực',accepted:'Đã sử dụng',revoked:'Đã thu hồi',expired:'Đã hết hạn'};
  return <section><h3>Lời mời đã tạo</h3><p className="field-hint">Token chỉ hiển thị khi tạo. Muốn chia sẻ link mới, hãy thu hồi lời mời cũ còn hiệu lực rồi tạo lại.</p><ErrorMessage message={error} retry={()=>void act(()=>load())}/>{busy && <p role="status">Đang cập nhật lời mời…</p>}{!busy&&!error&&!items.length&&<p>Chưa có lời mời.</p>}<ul className="row-list">{items.map(item=>{const state=item.status==='pending'&&Date.parse(item.expiresAt)<=Date.now()?'expired':item.status;return <li key={item.id}><strong>{labels[state]}</strong><p className="field-hint">Tạo: {formatTime(item.createdAt,timezone)}<br/>Hết hạn: {formatTime(item.expiresAt,timezone)}</p>{state==='pending'&&<button className="text-action" disabled={busy} onClick={()=>setConfirm(item.id)}>Thu hồi lời mời</button>}</li>;})}</ul>{cursor&&<button className="secondary" disabled={busy} onClick={()=>void act(()=>load(cursor))}>Tải thêm lời mời</button>}
    {confirm&&<Dialog title="Thu hồi lời mời này?" onClose={()=>{if(!busy)setConfirm(null);}}><p>Link này sẽ không còn dùng để tham gia nhóm.</p><ErrorMessage message={error}/><button className="danger" disabled={busy} onClick={()=>void act(async()=>{await revokeInvite(id,confirm);onRevoked?.(confirm);setConfirm(null);await load();})}>Xác nhận thu hồi</button></Dialog>}
  </section>;
}
