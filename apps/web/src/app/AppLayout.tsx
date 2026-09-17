import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AuthSession } from "../shared/auth/auth";
import type { View } from "../shared/types/domain";
import { navigationItems } from "./router";
import { Dialog } from "../shared/components/ui";
import { ThemeSelect } from "../shared/theme/ThemeSelect";

export function AppLayout({ view, onNavigate, onLogout, children }: {
  view: View;
  onNavigate: (view: View) => void;
  session: AuthSession | null;
  onLogout: () => void;
  children: ReactNode;
}) {
  const contentRef = useRef<HTMLElement>(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    contentRef.current?.focus();
    document.title = (navigationItems.find(item => item.view === view)?.label ?? "Beneath the Pine") + " — Beneath the Pine";
  }, [view]);

  const nav = <>
    <a className="nav-item" href="#home">Về Beneath the Pine</a>
    {navigationItems.map(item => {
      const active = view === item.view || (item.view === "circles" && ["circle", "pact", "invite"].includes(view));
      return <button
        key={item.view}
        className={active ? "nav-item active" : "nav-item"}
        aria-current={view === item.view ? "page" : undefined}
        onClick={() => { setMenu(false); onNavigate(item.view); }}
      >{item.label}</button>;
    })}
  </>;

  return <div className="site-shell">
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); contentRef.current?.focus(); }}>Đến nội dung chính</a>
    <header className="site-header">
      <div className="site-header-inner">
        <button className="brand" onClick={() => onNavigate("return")} aria-label="Beneath the Pine, về điểm tiếp tục">
          <svg width="28" height="32" viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 31V5M16 5 8 15h5L5 25h22l-8-10h5L16 5Z" stroke="currentColor" strokeWidth="2"/></svg>
          <span>Beneath the Pine.</span>
        </button>
        <div className="header-actions">
          <ThemeSelect/>
          <button className="secondary app-menu-button" aria-haspopup="dialog" aria-expanded={menu} onClick={() => setMenu(true)}>Menu</button>
          <button className="text-action app-logout" onClick={onLogout}>Đăng xuất</button>
        </div>
      </div>
    </header>
    <div className="main-layout">
      <nav className="navigation" aria-label="Điều hướng ứng dụng">
        <p className="nav-label">DƯỚI TÁN THÔNG</p>
        {nav}
      </nav>
      <div className="app-main-column">
        <main className="content" id="main-content" ref={contentRef} tabIndex={-1}>{children}</main>
        <footer>Có mặt và quay lại là đủ. Việc của bạn vẫn riêng tư.</footer>
      </div>
    </div>
    {menu && <Dialog kind="menu" title="Dưới tán thông" onClose={() => setMenu(false)}>
      <nav className="app-dialog-nav" aria-label="Điều hướng ứng dụng">{nav}</nav>
      <ThemeSelect/>
      <button className="text-action" onClick={onLogout}>Đăng xuất</button>
    </Dialog>}
  </div>;
}
