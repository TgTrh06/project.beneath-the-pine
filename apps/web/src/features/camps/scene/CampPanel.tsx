import { useEffect, useId, useRef, type ReactNode } from 'react';

/** A modal task surface over the Camp, with native focus trapping and Escape. */
export function CampPanel({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    return () => { dialog.close(); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className="camp-task-panel" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="camp-task-heading"><div><p className="eyebrow">BÊN LỬA TRẠI</p><h2 id={titleId}>{title}</h2></div><button type="button" className="secondary" onClick={onClose} aria-label="Đóng bảng, trở lại Camp">×</button></header>
    <div className="camp-task-body">{children}</div>
  </dialog>;
}
