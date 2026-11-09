import { PactsView } from "../features/pacts/public-api";
import { LandingPage } from "../features/landing/public-api";
import { AuthView } from "../features/auth/public-api";
import { ReturnView } from "../features/return/public-api";
import { CampsView } from "../features/camps/public-api";
import { CampView } from "../features/camps/public-api";
import { PactView } from "../features/pacts/public-api";
import { SessionView } from "../features/focus/public-api";
import { MemoryView } from "../features/memory/public-api";
import { CoreSettingsView } from "../features/settings/public-api";
import { AuthLoading } from "../features/auth/public-api";
import { AppLayout } from "./AppLayout";
import { useAppSession } from './useAppSession';
import { InviteView } from "../features/camps/public-api";
import { writePrivateDraft, draftOwner } from '../shared/auth/privateDrafts';
import { PactReminder } from '../features/pacts/public-api';

import { PersonalForestProvider } from "../features/memory/public-api";

export function App() {
  const { route, navigate, session, checking, notice, setNotice, signOut, retryConnection, authenticated } = useAppSession();
  if (route.view === "landing") return <LandingPage signedIn={Boolean(session)} />;
  if (checking) return <AuthLoading/>;
  if (!session) return <AuthView mode={route.view === "register" ? "register" : "login"} connectionError={notice} onRetry={retryConnection} onSuccess={authenticated} />;
  const reminder = <PactReminder key={session.subject} onOpen={id => navigate(`pact/${id}`)}/>;
  if (route.view === "session" && route.id) return <PersonalForestProvider key={session.subject}>{reminder}<SessionView key={`${session.subject}:${route.id}`} id={route.id} accountId={session.subject} onReturn={() => navigate("return")} onRepeatPact={(campId, pactId) => { writePrivateDraft(draftOwner(), `camp:${campId}:repeat`, pactId, true); navigate(`camp/${campId}`); }} onNotice={setNotice} /></PersonalForestProvider>;
  return <PersonalForestProvider key={session.subject}>{route.view === "camp" && reminder}<AppLayout key={session.subject} view={route.view} onNavigate={navigate} session={session} onLogout={signOut}>{route.view !== "camp" && reminder}{notice && <p className="notice" role="alert">{notice}</p>}{["return","login","register"].includes(route.view) ? <ReturnView onSession={id => navigate(`session/${id}`)} onPact={id => navigate(`pact/${id}`)} onNotice={setNotice} /> : route.view === "pacts" ? <PactsView onOpen={id => navigate(`pact/${id}`)} onSession={id => navigate(`session/${id}`)}/> : route.view === "camps" ? <CampsView onOpen={id => navigate(`camp/${id}`)} onNotice={setNotice} /> : route.view === "camp" && route.id ? <CampView key={route.id} id={route.id} accountId={session.subject} onLeave={() => navigate("camps")} onPact={id => navigate(`pact/${id}`)} onNotice={setNotice} /> : route.view === "pact" && route.id ? <PactView key={route.id} id={route.id} accountId={session.subject} onSession={id => navigate(`session/${id}`)} onPacts={() => navigate("pacts")} onNotice={setNotice} /> : route.view === "invite" && route.id ? <InviteView key={route.id} token={route.id} onOpen={id => navigate(`camp/${id}`)} onDeclined={() => { setNotice("Đã chọn không tham gia Camp này."); navigate("camps"); }} onCamps={() => navigate("camps")} /> : route.view === "memory" ? <MemoryView onNotice={setNotice} /> : <CoreSettingsView email={session.email} onDeleted={() => navigate("landing")} onNotice={setNotice} />}</AppLayout></PersonalForestProvider>;
}
