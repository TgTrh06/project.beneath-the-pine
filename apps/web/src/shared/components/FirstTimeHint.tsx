import { useId, useState, type ReactNode } from 'react';
import { draftOwner } from '../auth/privateDrafts';

function storageKey(topic:string) { return `btp:hint:v1:${encodeURIComponent(draftOwner() ?? 'guest')}:${topic}`; }
function wasDismissed(topic:string) { try { return localStorage.getItem(storageKey(topic)) === 'done'; } catch { return false; } }

export function FirstTimeHint({topic,title,children}: {topic:'focus'|'seed'|'camp'|'pact';title:string;children:ReactNode}) {
  const [open,setOpen] = useState(() => !wasDismissed(topic));
  const id = useId();
  const dismiss = () => { setOpen(false); try { localStorage.setItem(storageKey(topic),'done'); } catch { /* Hint remains dismissed in memory. */ } };
  return <aside className="first-time-hint" aria-labelledby={id}>
    <div className="first-time-hint__header"><strong id={id}>{title}</strong><button type="button" className="text-action" aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? 'Ẩn hướng dẫn' : 'Xem hướng dẫn'}</button></div>
    {open && <div><p>{children}</p><button type="button" className="text-action" onClick={dismiss}>Tôi đã hiểu</button></div>}
  </aside>;
}
