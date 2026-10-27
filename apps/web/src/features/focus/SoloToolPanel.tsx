import { useEffect, useId, useRef, type ReactNode } from 'react';
// Keep tools mounted while closed: audio playback and recovery state survive.
export function SoloToolPanel({enabled,open,title,onClose,children}:{enabled:boolean;open:boolean;title:string;onClose:()=>void;children:ReactNode}) {
  const ref=useRef<HTMLDialogElement>(null),id=useId();
  useEffect(()=>{
    if(!enabled||!open)return;
    const previous=document.activeElement as HTMLElement|null,dialog=ref.current!;dialog.showModal();
    return ()=>{dialog.close();if(previous?.isConnected)previous.focus();};
  },[enabled,open]);
  if(!enabled)return <>{children}</>;
  return <dialog ref={ref} className="solo-tool-panel" aria-labelledby={id} onCancel={e=>{e.preventDefault();onClose();}}>
    <header><h2 id={id}>{title}</h2><button className="secondary" onClick={onClose} aria-label={`Đóng ${title}`}>×</button></header><div className="solo-tool-content">{children}</div>
  </dialog>;
}
