import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AuthSession } from "../shared/auth/auth";
import type { View } from "../shared/types/domain";
import { navigationItems } from "./router";
import { Dialog } from "../shared/components/ui";
import { ThemeSelect } from "../shared/theme/ThemeSelect";
import { ForestAppearance } from './ForestAppearance';
import { ReturnScene } from '../features/return/ReturnScene';
import './app-forest.css';

const navPaths: Record<string, string> = {
  home: 'M3 11 12 3l9 8M5 10v11h14V10M9 21v-7h6v7',
  return: 'M9 5 3 11l6 6M3 11h11a6 6 0 0 1 0 12',
  camps: 'm12 3-9 18h18L12 3ZM12 12l-5 9m5-9 5 9',
  pacts: 'M5 5h14v16H5zM8 2v6m8-6v6M5 11h14m-10 4h2m3 0h2',
  memory: 'M5 3h14v18l-7-4-7 4V3Z',
  settings: 'M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6',
};
function NavIcon({ name }: { name: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={navPaths[name]} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function AppLayout({ view, onNavigate, onLogout, children }: {
  view: View;
  onNavigate: (view: View | string) => void;
  session: AuthSession | null;
  onLogout: () => void;
  children: ReactNode;
}) {
  const contentRef = useRef<HTMLElement>(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    contentRef.current?.focus();
    document.title = (navigationItems.find(item => item.view === view)?.label ?? "Pyneath") + " — Pyneath";
  }, [view]);

  const nav = <>
    <a className="nav-item" href="#home"><NavIcon name="home"/><span>Về Pyneath</span></a>
    {navigationItems.map(item => {
      const active = view === item.view || (item.view === "pacts" && view === "pact") || (item.view === "camps" && ["camp", "invite"].includes(view));
      return <button
        key={item.view}
        className={active ? "nav-item active" : "nav-item"}
        aria-current={active ? "page" : undefined}
        onClick={() => { setMenu(false); onNavigate(item.view); }}
      ><NavIcon name={item.view}/><span>{item.label}</span></button>;
    })}
  </>;

  if (view === "camp") return <div className="camp-immersive-shell">
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); contentRef.current?.focus(); }}>Đến nội dung Camp</a>
    <button type="button" className="camp-app-menu" aria-haspopup="dialog" aria-expanded={menu} onClick={() => setMenu(true)}>Menu <span aria-hidden="true">☰</span></button>
    <main id="main-content" ref={contentRef} tabIndex={-1}>{children}</main>
    {menu && <Dialog kind="menu" title="Điều hướng" onClose={() => setMenu(false)}><nav className="app-dialog-nav" aria-label="Điều hướng ứng dụng">{nav}</nav><ThemeSelect/><button className="text-action" onClick={onLogout}>Đăng xuất</button></Dialog>}
  </div>;

  const isReturn = ["return", "login", "register"].includes(view);
  const shell = (controls: ReactNode) => <div className={`site-shell forest-shell${isReturn ? ' forest-shell-return' : ''}`}>
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); contentRef.current?.focus(); }}>Đến nội dung chính</a>
    <header className="site-header">
      <div className="site-header-inner">
        <button className="brand" onClick={() => onNavigate("return")} aria-label="Pyneath, về điểm tiếp tục">
          <svg width="28" height="32" viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 31V5M16 5 8 15h5L5 25h22l-8-10h5L16 5Z" stroke="currentColor" strokeWidth="2"/></svg>
          <span>Pyneath.</span>
        </button>
        <div className="header-actions">
          {controls}
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
  return isReturn ? <ReturnScene>{shell}</ReturnScene> : shell(<ForestAppearance/>);
}
