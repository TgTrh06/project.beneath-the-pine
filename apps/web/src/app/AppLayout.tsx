import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { isConfigured, supabase } from "../shared/api/api";
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
  session: Session | null;
  onOpenLogin: () => void;
  onOpenWaitlist: () => void;
  children: ReactNode;
}) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <button
          className="brand"
          onClick={() => onNavigate("now")}
          aria-label="Beneath the Pine, về trang hôm nay"
        >
          <span className="pine">⌁</span>
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
              onClick={() => void supabase?.auth.signOut()}
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
      <main className="main-layout">
        <aside className="navigation" aria-label="Điều hướng">
          <p className="nav-label">DÀNH CHO LÚC NÀY</p>
          {navigationItems.map(({ view: itemView, label }) => (
            <button
              key={itemView}
              className={view === itemView ? "nav-item active" : "nav-item"}
              onClick={() => onNavigate(itemView)}
            >
              {label}
            </button>
          ))}
          <button
            className={view === "study" ? "nav-item active" : "nav-item"}
            onClick={() => onNavigate("study")}
          >
            Pilot study
          </button>
        </aside>
        <section className="content" aria-live="polite">
          {children}
        </section>
      </main>
      <footer>Prototype nghiên cứu · AI chỉ hỗ trợ tự quản lý, không chẩn đoán hoặc điều trị ADHD.</footer>
    </div>
  );
}
