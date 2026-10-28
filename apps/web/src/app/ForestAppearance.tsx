import { useEffect, useRef, type ReactNode } from 'react';
import { ThemeSelect } from '../shared/theme/ThemeSelect';

export function ForestAppearance({ children }: { children?: ReactNode }) {
  const panel = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (event.target instanceof Node && !panel.current?.contains(event.target) && panel.current) panel.current.open = false;
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  return <details className="forest-appearance" ref={panel} onKeyDown={event => {
    if (event.key === 'Escape' && panel.current?.open) {
      event.stopPropagation(); panel.current.open = false; panel.current.querySelector('summary')?.focus();
    }
  }}>
    <summary aria-label="Không khí khu rừng" title="Không khí khu rừng">
      <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="23" cy="9" r="4" fill="#e1b77b"/><path d="m12 5-6 10h3l-6 9h18l-6-9h3L12 5ZM12 24v5M22 1V0M29 9h3M27 3l2-2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
    </summary>
    <div className="forest-appearance-panel"><h2>Không khí khu rừng</h2><ThemeSelect/>{children}</div>
  </details>;
}
