import { useId, useRef, useState, type ReactNode } from 'react';
import { draftOwner } from '../auth/privateDrafts';
import { readBrandValue } from '../brandStorage';

function storageKey(topic:string) { return `pyneath:hint:v1:${encodeURIComponent(draftOwner() ?? 'guest')}:${topic}`; }
function wasDismissed(topic:string) { try { return readBrandValue(localStorage, storageKey(topic)) === 'done'; } catch { return false; } }

export function FirstTimeHint({topic,title,children,compact = false}: {topic:'focus'|'seed'|'camp'|'pact';title:string;children:ReactNode;compact?:boolean}) {
  const [open,setOpen] = useState(() => !compact && !wasDismissed(topic));
  const id = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const dismiss = () => { setOpen(false); try { localStorage.setItem(storageKey(topic),'done'); } catch { /* Hint remains dismissed in memory. */ } requestAnimationFrame(() => toggle.current?.focus()); };
  return <aside className="first-time-hint" aria-labelledby={id}>
    <div className="first-time-hint__header"><strong id={id}>{title}</strong><button ref={toggle} type="button" className="text-action" aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? 'Ẩn hướng dẫn' : 'Xem hướng dẫn'}</button></div>
    {open && <div><p>{children}</p><button type="button" className="text-action" onClick={dismiss}>Tôi đã hiểu</button></div>}
  </aside>;
}
