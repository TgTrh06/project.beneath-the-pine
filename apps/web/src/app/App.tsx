import { PactsView } from "../features/pacts/PactsView";
import { useEffect, useRef, useState } from "react";
import { initializeAuth, subscribeToAuth, logout, type AuthSession } from "../shared/auth/auth";
import { LandingPage } from "../features/landing/LandingPage";
import { AuthView } from "../features/auth/AuthView";
import { ReturnView } from "../features/return/ReturnView";
import { CampsView } from "../features/camps/CampsView";
import { CampView } from "../features/camps/CampView";
import { PactView } from "../features/pacts/PactView";
import { SessionView } from "../features/focus/SessionView";
import { MemoryView } from "../features/memory/MemoryView";
import { CoreSettingsView } from "../features/settings/CoreSettingsView";
import { AppLayout } from "./AppLayout";
import { useHashRouter } from "./router";
import { InviteView } from "../features/camps/InviteView";
import { writePrivateDraft, draftOwner } from '../shared/auth/privateDrafts';
import { PactReminder } from '../features/pacts/PactReminder';

export function App() {
  const pendingRoute = useRef<string | null>(null);
  const { route, navigate } = useHashRouter(); const [session, setSession] = useState<AuthSession | null>(null); const [checking, setChecking] = useState(true); const [notice, setNotice] = useState(""); const [retry, setRetry] = useState(0);
  useEffect(() => { let active = true; const unsubscribe = subscribeToAuth(setSession); setChecking(true); void initializeAuth().then(value => { if (active) { setSession(value); setNotice(""); } }).catch(() => setNotice("Chưa thể kết nối dịch vụ tài khoản.")).finally(() => { if (active) setChecking(false); }); return () => { active=false; unsubscribe(); }; }, [retry]);
  useEffect(() => { if (!session && !["landing","login","register"].includes(route.view)) pendingRoute.current = route.id ? `${route.view}/${route.id}` : route.view; if (route.view === "landing") pendingRoute.current = null; }, [route,session]);
  useEffect(() => { if (route.view === "invite") setNotice(""); }, [route.view, route.id]);
  const signOut = () => void logout().then(() => { pendingRoute.current = null; navigate("landing"); }).catch(() => setNotice("Chưa thể đăng xuất."));
  if (route.view === "landing") return <LandingPage signedIn={Boolean(session)} />;
  if (checking) return <main className="auth-shell"><p role="status">Đang kiểm tra phiên đăng nhập…</p></main>;
  if (!session) return <AuthView mode={route.view === "register" ? "register" : "login"} connectionError={notice} onRetry={() => setRetry(value => value+1)} onSuccess={() => { setNotice(""); const destination = pendingRoute.current ?? "return"; pendingRoute.current = null; navigate(destination); }} />;
  const reminder = <PactReminder key={session.subject} onOpen={id => navigate(`pact/${id}`)}/>;
  if (route.view === "session" && route.id) return <>{reminder}<SessionView key={`${session.subject}:${route.id}`} id={route.id} accountId={session.subject} onReturn={() => navigate("return")} onRepeatPact={(campId, pactId) => { writePrivateDraft(draftOwner(), `camp:${campId}:repeat`, pactId, true); navigate(`camp/${campId}`); }} onNotice={setNotice} /></>;
  return <>{reminder}<AppLayout key={session.subject} view={route.view} onNavigate={navigate} session={session} onLogout={signOut}>{notice && <p className="notice" role="alert">{notice}</p>}{["return","login","register"].includes(route.view) ? <ReturnView onSession={id => navigate(`session/${id}`)} onPact={id => navigate(`pact/${id}`)} onNotice={setNotice} /> : route.view === "pacts" ? <PactsView onOpen={id => navigate(`pact/${id}`)} onSession={id => navigate(`session/${id}`)}/> : route.view === "camps" ? <CampsView onOpen={id => navigate(`camp/${id}`)} onNotice={setNotice} /> : route.view === "camp" && route.id ? <CampView key={route.id} id={route.id} accountId={session.subject} onLeave={() => navigate("camps")} onPact={id => navigate(`pact/${id}`)} onNotice={setNotice} /> : route.view === "pact" && route.id ? <PactView key={route.id} id={route.id} accountId={session.subject} onSession={id => navigate(`session/${id}`)} onPacts={() => navigate("pacts")} onNotice={setNotice} /> : route.view === "invite" && route.id ? <InviteView key={route.id} token={route.id} onOpen={id => navigate(`camp/${id}`)} onDeclined={() => { setNotice("Đã chọn không tham gia Camp này."); navigate("camps"); }} onCamps={() => navigate("camps")} /> : route.view === "memory" ? <MemoryView onNotice={setNotice} /> : <CoreSettingsView email={session.email} onDeleted={() => navigate("landing")} onNotice={setNotice} />}</AppLayout></>;
}
