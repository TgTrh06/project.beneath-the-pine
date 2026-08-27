import { createClient, type Session } from "@supabase/supabase-js";
import { logFrontendError } from "./logger";

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
export const isConfigured = Boolean(apiUrl && supabaseUrl && supabaseKey);
export const supabase = isConfigured ? createClient(supabaseUrl!, supabaseKey!, { auth: { flowType: "pkce" } }) : null;

type ApiError = { error?: string; message?: string };
class ApiRequestError extends Error { constructor(message: string, readonly status?: number, readonly code?: string) { super(message); } }
async function request<T>(path: string, options: RequestInit = {}, session?: Session | null): Promise<T> {
  const method = options.method ?? "GET";
  if (!apiUrl) { logFrontendError({ event: "api_not_configured", area: "api", method, path }); throw new ApiRequestError("API chưa được cấu hình.", undefined, "API_NOT_CONFIGURED"); }
  try {
    const token = session?.access_token ?? (await supabase?.auth.getSession())?.data.session?.access_token;
    const response = await fetch(`${apiUrl}${path}`, { ...options, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...options.headers } });
    if (response.status === 204) return undefined as T;
    const body = await response.json() as T & ApiError;
    if (!response.ok) throw new ApiRequestError(body.message ?? "Không thể hoàn thành yêu cầu lúc này.", response.status, body.error);
    return body;
  } catch (error) {
    const apiError = error instanceof ApiRequestError ? error : new ApiRequestError("Không thể kết nối API.");
    logFrontendError({ event: "api_request_failed", area: "api", method, path, status: apiError.status, code: apiError.code });
    throw error;
  }
}

export type RemoteTask = { id: string; title: string; minutes: number; status: "ready" | "done" | "deferred"; userId?: string; sourceBrainDumpId?: string | null };
export type Bootstrap = { profile: unknown; consent: { aiProcessing: boolean; contentRetention: boolean } | null; tasks: RemoteTask[]; habits: { id: string; title: string }[]; isAdmin: boolean; quota: Record<string, { used: number; remaining: number }> };

export async function joinWaitlist(input: { email: string; name?: string; context?: string }) { if (!apiUrl) return { ok: true, demo: true }; return request<{ ok: boolean }>("/waitlist", { method: "POST", body: JSON.stringify(input) }); }
export async function sendMagicLink(email: string): Promise<void> { if (!supabase) { logFrontendError({ event: "auth_not_configured", area: "auth" }); throw new Error("Đăng nhập beta sẽ sẵn sàng khi cấu hình Supabase."); } const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } }); if (error) { logFrontendError({ event: "magic_link_failed", area: "auth", code: error.code }); throw error; } }
export async function getBootstrap(session: Session): Promise<Bootstrap> { return request<Bootstrap>("/me/bootstrap", {}, session); }
export async function recordConsent(session: Session): Promise<void> { await request("/consents", { method: "POST", body: JSON.stringify({ aiProcessing: true, contentRetention: true, researchAnalytics: false }) }, session); }
export async function submitBrainDump(session: Session, content: string) { return request<{ suggestion: { candidates: Array<{ title: string; minutes: number }> } }>("/brain-dumps", { method: "POST", body: JSON.stringify({ content }) }, session); }
export async function createNextAction(session: Session, task: { title: string; minutes: number }) { return request<{ task: RemoteTask }>("/next-actions", { method: "POST", body: JSON.stringify(task) }, session); }
export async function helpMeStart(session: Session, taskId: string) { return request<{ suggestion: { tinyStep: string; minutes: number; options: string[] } }>("/help-me-start", { method: "POST", body: JSON.stringify({ taskId }) }, session); }
export async function startFocus(session: Session, taskId: string, plannedMinutes: number) { return request<{ session: { id: string } }>("/focus-sessions", { method: "POST", body: JSON.stringify({ taskId, plannedMinutes }) }, session); }
export async function finishFocus(session: Session, sessionId: string, outcome: "done" | "still_stuck" | "paused") { return request(`/focus-sessions/${sessionId}`, { method: "PATCH", body: JSON.stringify({ outcome }) }, session); }
export async function createHabit(session: Session, title: string) { return request<{ habit: { id: string; title: string } }>("/habits", { method: "POST", body: JSON.stringify({ title }) }, session); }
export async function completeHabit(session: Session, id: string) { return request<{ ok: true; completedOn: string }>(`/habits/${id}/completion`, { method: "PUT" }, session); }
export async function saveCheckin(session: Session, input: { energy: "low" | "medium" | "high"; note?: string }) { return request("/checkins", { method: "POST", body: JSON.stringify(input) }, session); }
export async function createWeeklyReview(session: Session) { return request<{ review: { summary: string; insight: string }; experiment: { id: string; title: string; why: string } }>("/weekly-reviews", { method: "POST" }, session); }
export async function exportData(session: Session) { return request<unknown>("/export", {}, session); }
export async function deleteAccount(session: Session) { await request("/account", { method: "DELETE" }, session); }
export async function getAdminWaitlist(session: Session) { return request<{ entries: Array<{ id: string; email: string; name: string | null; status: string; createdAt: string }> }>("/admin/waitlist", {}, session); }
export async function approveWaitlist(session: Session, id: string) { return request(`/admin/waitlist/${id}/approve`, { method: "POST" }, session); }
export type StudyState = { enrollment: { id: string; participantCode: string; sequence: "control_first" | "intervention_first"; retentionUntil: string } | null; condition: "control" | "intervention" | null };
export async function getStudy(session: Session) { return request<StudyState>("/study", {}, session); }
export async function enrollStudy(session: Session) { return request<StudyState>("/study/enroll", { method: "POST", body: JSON.stringify({ consent: true }) }, session); }
export async function beginStudySession(session: Session, frictionBefore: number) { return request<{ session: { id: string; condition: "control" | "intervention"; stuckAt: string } }>("/study/sessions", { method: "POST", body: JSON.stringify({ frictionBefore }) }, session); }
export async function markStudyStarted(session: Session, id: string) { return request<{ session: { id: string; startedAt: string } }>(`/study/sessions/${id}/start`, { method: "POST", body: JSON.stringify({}) }, session); }
export async function completeStudySession(session: Session, id: string, input: { frictionAfter: number; focusOutcome: "done" | "still_stuck" | "not_recorded" }) { return request<{ session: { id: string } }>(`/study/sessions/${id}`, { method: "PATCH", body: JSON.stringify(input) }, session); }
export async function withdrawStudy(session: Session) { await request("/study", { method: "DELETE" }, session); }
