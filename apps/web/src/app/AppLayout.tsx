import { useEffect, useRef, type ReactNode } from "react";
import { isConfigured } from "../shared/api/api";
import { logout, type AuthSession } from "../shared/auth/auth";
import type { View } from "../shared/types/domain";
import { navigationItems } from "./router";

export function AppLayout({
  view,
  onNavigate,
  session,
  onOpenLogin,
  onOpenWaitlist,
  children,
}: {
  view: View;
  onNavigate: (view: View) => void;
  session: AuthSession | null;
  onOpenLogin: () => void;
  onOpenWaitlist: () => void;
  children: ReactNode;
}) {
  const contentRef = useRef<HTMLElement>(null);
  useEffect(() => {
    contentRef.current?.focus();
    contentRef.current?.scrollIntoView({ block: "start" });
    const label = navigationItems.find((item) => item.view === view)?.label
      ?? (view === "study" ? "Pilot study" : "Quản trị beta");
    document.title = `${label} — Beneath the Pine`;
  }, [view]);
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById("main-content")?.focus(); }}>Đến nội dung chính</a>
      <header className="site-header">
        <button
          className="brand"
          onClick={() => onNavigate("now")}
          aria-label="Beneath the Pine, về trang hôm nay"
        >
          <span className="pine" aria-hidden="true">⌁</span>
          <span>Beneath the Pine</span>
        </button>
        <div className="header-actions">
          <span className={`status ${isConfigured ? "connected" : ""}`}>
            {isConfigured
              ? session
                ? "Private beta"
                : "Beta cần đăng nhập"
              : "Chế độ demo local"}
          </span>
          {session ? (
            <button
              className="link-button"
              onClick={() => void logout()}
            >
              Đăng xuất
            </button>
          ) : (
            <button
              className="link-button"
              onClick={isConfigured ? onOpenLogin : onOpenWaitlist}
            >
              {isConfigured ? "Đăng nhập beta" : "Tham gia beta"}
            </button>
          )}
        </div>
      </header>
      <div className="main-layout">
        <main className="content" id="main-content" ref={contentRef} tabIndex={-1}>
          {children}
        </main>
        <nav className="navigation" aria-label="Điều hướng">
          <p className="nav-label">DÀNH CHO LÚC NÀY</p>
          <a className="nav-item" href="#home" style={{ textDecoration: "none" }}>Về Beneath the Pine ↗</a>
          {navigationItems.map(({ view: itemView, label }) => (
            <button
              key={itemView}
              className={view === itemView ? "nav-item active" : "nav-item"}
              aria-current={view === itemView ? "page" : undefined}
              onClick={() => onNavigate(itemView)}
            >
              {label}
            </button>
          ))}
          <button
            className={view === "study" ? "nav-item active" : "nav-item"}
            aria-current={view === "study" ? "page" : undefined}
            onClick={() => onNavigate("study")}
          >
            Pilot study
          </button>
        </nav>

      </div>
      <footer>Prototype nghiên cứu · AI chỉ hỗ trợ tự quản lý, không chẩn đoán hoặc điều trị ADHD.</footer>
    </div>
  );
}
