import { useEffect, useState } from "react";
import { initializeAuth, subscribeToAuth, logout, type AuthSession } from "../shared/auth/auth";
import { LandingPage } from "../features/landing/LandingPage";
import { AuthView } from "../features/auth/AuthView";
import { AdminView } from "../features/admin/AdminView";
import { AppLayout } from "./AppLayout";
import { useHashRouter, navigationItems } from "./router";

export function App() {
  const { view, navigate } = useHashRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToAuth(setSession);
    setChecking(true);
    setError("");
    void initializeAuth().then(value => { if (active) setSession(value); })
      .catch(() => { if (active) setError("Chưa thể kết nối dịch vụ tài khoản. Vui lòng thử lại sau."); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; unsubscribe(); };
  }, [retry]);
  const signOut = async () => {
    try { await logout(); navigate("landing"); } catch { setError("Chưa thể đăng xuất. Vui lòng thử lại."); }
  };
  if (view === "landing") return <LandingPage signedIn={Boolean(session)} />;
  if (checking) return <main className="auth-shell"><p role="status">Đang kiểm tra phiên đăng nhập…</p></main>;
  if (!session) return <AuthView key={view} mode={view === "register" ? "register" : "login"} connectionError={error} onRetry={() => setRetry(value => value + 1)} onSuccess={() => navigate(view === "admin" ? "admin" : "now")} />;
  const label = navigationItems.find(item => item.view === view)?.label ?? "Không gian của bạn";
  return <AppLayout view={view} onNavigate={navigate} session={session} onLogout={() => void signOut()}>
    {error && <p className="notice" role="alert">{error}</p>}
    {view === "admin" ? session.role === "pine_keeper" ? <AdminView remoteSession={session} onNotice={setError} /> : <section className="feature-card"><h1>Khu vực Pine Keeper</h1><p>Tài khoản Wanderer không có quyền truy cập khu vực quản trị.</p></section>
      : view === "settings" ? <section className="feature-card"><p className="eyebrow">TÀI KHOẢN</p><h1>{session.role === "pine_keeper" ? "Pine Keeper" : "Wanderer"}</h1><p>{session.email}</p><p>Đây là tài khoản đang đăng nhập của bạn.</p><button className="secondary" onClick={() => void signOut()}>Đăng xuất</button></section>
      : <section className="feature-card"><p className="eyebrow">{session.role === "pine_keeper" ? "PINE KEEPER" : "WANDERER"}</p><h1>{label}</h1><p>Bạn đã đăng nhập vào không gian của mình.</p><p role="status">Tính năng này đang được hoàn thiện và chưa khả dụng. Bạn có thể xem thông tin tài khoản trong Cài đặt.</p><button className="secondary" onClick={() => navigate("settings")}>Xem tài khoản</button></section>}
  </AppLayout>;
}
