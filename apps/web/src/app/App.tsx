import { useEffect, useState } from "react";
import { initializeAuth, subscribeToAuth, logout, type AuthSession } from "../shared/auth/auth";
import { LandingPage } from "../features/landing/LandingPage";
import { AuthView } from "../features/auth/AuthView";
import { ReturnView } from "../features/return/ReturnView";
import { CirclesView } from "../features/circles/CirclesView";
import { CircleView } from "../features/circles/CircleView";
import { PactView } from "../features/pacts/PactView";
import { SessionView } from "../features/focus/SessionView";
import { MemoryView } from "../features/memory/MemoryView";
import { CoreSettingsView } from "../features/settings/CoreSettingsView";
import { AppLayout } from "./AppLayout";
import { useHashRouter } from "./router";

export function App() {
  const { route, navigate } = useHashRouter(); const [session, setSession] = useState<AuthSession | null>(null); const [checking, setChecking] = useState(true); const [notice, setNotice] = useState(""); const [retry, setRetry] = useState(0);
  useEffect(() => { let active = true; const unsubscribe = subscribeToAuth(setSession); setChecking(true); void initializeAuth().then(value => { if (active) setSession(value); }).catch(() => setNotice("Chưa thể kết nối dịch vụ tài khoản.")).finally(() => { if (active) setChecking(false); }); return () => { active=false; unsubscribe(); }; }, [retry]);
  const signOut = () => void logout().then(() => navigate("landing")).catch(() => setNotice("Chưa thể đăng xuất."));
  if (route.view === "landing") return <LandingPage signedIn={Boolean(session)} />;
  if (checking) return <main className="auth-shell"><p role="status">Đang kiểm tra phiên đăng nhập…</p></main>;
  if (!session) return <AuthView mode={route.view === "register" ? "register" : "login"} connectionError={notice} onRetry={() => setRetry(value => value+1)} onSuccess={() => navigate("return")} />;
  if (route.view === "session" && route.id) return <SessionView id={route.id} onReturn={() => navigate("return")} onNotice={setNotice} />;
  return <AppLayout view={route.view} onNavigate={navigate} session={session} onLogout={signOut}>{notice && <p className="notice" role="alert">{notice}</p>}{route.view === "return" ? <ReturnView onSession={id => navigate(`session/${id}`)} onPact={id => navigate(`pact/${id}`)} onNotice={setNotice} /> : route.view === "circles" ? <CirclesView onOpen={id => navigate(`circle/${id}`)} onNotice={setNotice} /> : route.view === "circle" && route.id ? <CircleView id={route.id} onPact={id => navigate(`pact/${id}`)} onNotice={setNotice} /> : route.view === "pact" && route.id ? <PactView id={route.id} accountId={session.subject} onSession={id => navigate(`session/${id}`)} onNotice={setNotice} /> : route.view === "memory" ? <MemoryView onNotice={setNotice} /> : <CoreSettingsView email={session.email} onDeleted={() => navigate("landing")} onNotice={setNotice} />}</AppLayout>;
}
