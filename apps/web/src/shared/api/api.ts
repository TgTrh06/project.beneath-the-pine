import type { AssistanceInteraction, AssistanceRequest, AssistanceResponse, Camp, CampInvitePreview, FocusPact, FocusSession, PactReminderClaim, Preferences, Profile, ReturnState } from "@pyneath/contracts";
import { expireSession, getCsrfToken } from "../auth/auth";
import { logFrontendError } from "../logging/logger";

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || "/api/v1";

export const realtimeUrl = (import.meta.env.VITE_REALTIME_URL as string | undefined) || undefined;

export class ApiRequestError extends Error {
  constructor(message: string, readonly status?: number, readonly code?: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method ?? "GET";
  try {
    const csrf = !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase()) ? await getCsrfToken() : null;
    const response = await fetch(`${apiUrl}${path}`, { ...options, credentials: "include", headers: { "content-type": "application/json", ...(csrf ? { "X-XSRF-TOKEN": csrf } : {}), ...options.headers } });
    if (response.status === 401) expireSession();
    if (response.status === 204) return undefined as T;
    const result = await response.json() as T & { message?: string; code?: string };
    if (!response.ok) {
      const messages: Record<number, string> = { 400: "Kiểm tra lại thông tin bạn vừa nhập.", 401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", 403: "Bạn chưa thể thực hiện thao tác này.", 404: "Không tìm thấy nội dung hoặc bạn không có quyền truy cập.", 409: "Trạng thái đã thay đổi hoặc thao tác hiện chưa khả dụng. Hãy tải lại để kiểm tra.", 429: "Bạn thao tác hơi nhanh. Vui lòng thử lại sau." };
      throw new ApiRequestError(messages[response.status] ?? "Chưa thể hoàn thành yêu cầu. Vui lòng thử lại.", response.status, result.code);
    }
    return result;
  } catch (error) { const failure = error instanceof ApiRequestError ? error : new ApiRequestError("Không thể kết nối API."); logFrontendError({ event: "api_request_failed", area: "api", method, path, status: failure.status, code: failure.code }); throw failure; }
}
const mutation = <T>(
  path: string,
  method: string,
  value?: unknown,
  key?: string
) => request<T>(path, {
  method,
  body: value === undefined ? undefined : JSON.stringify(value),
  headers: key ? { "Idempotency-Key": key } : undefined
});

export const newRequestKey = () => crypto.randomUUID();
export const getReturnState = () => request<ReturnState>("/me/return");
export const getProfile = () => request<{ profile: Profile | null }>("/me/profile");
export const getPreferences = () => request<{ preferences: Preferences }>("/me/preferences");
export const updatePreferences = (value: Partial<Preferences>) => mutation<{ preferences: Preferences }>("/me/preferences", "PATCH", value);
export const updateProfile = (value: Partial<Profile>) => mutation<{ profile: Profile }>("/me/profile", "PATCH", value);
export const startSolo = (value: { intention: string; durationMinutes: 5 | 10 | 25 | 50 }, key: string) => mutation<{ session: FocusSession }>("/focus-sessions", "POST", value, key);
export const getSession = (id: string) => request<{ session: FocusSession }>(`/focus-sessions/${id}`);
export const joinSession = (id: string) => mutation<{ session: FocusSession }>(`/focus-sessions/${id}/join`, "POST");
export const checkOut = (id: string, value: { outcome: "completed" | "progress" | "stuck" | "stopped"; openSeed?: string | null }) => mutation<{ session: FocusSession }>(`/focus-sessions/${id}/check-out`, "POST", value);
export const putSeed = (text: string) => mutation<{ openSeed: NonNullable<ReturnState["openSeed"]> }>("/me/open-seed", "PUT", { text });
export const deleteSeed = () => mutation<void>("/me/open-seed", "DELETE");
export const listCamps = () => request<{ camps: Camp[] }>("/camps");
export const getCamp = (id: string) => request<{ camp: Camp }>(`/camps/${id}`);
export const getRecentPartners = (id: string) => request<{ accountIds: string[] }>(`/camps/${id}/recent-partners`);
export const createCamp = (name: string) => mutation<{ camp: { id: string } }>("/camps", "POST", { name });
export const createCampInvite = (id: string) => mutation<{ invite: { id: string; token: string; expiresAt: string } }>(`/camps/${id}/invites`, "POST", { expiresInHours: 72 });
export const getCampInvitePreview = (token: string) => request<{ invite: CampInvitePreview }>(`/camp-invites/${token}/preview`);
export const declineCampInvite = (token: string) => mutation<void>(`/camp-invites/${token}/decline`, "POST");
export const acceptCampInvite = (token: string) => mutation<{ campId: string }>(`/camp-invites/${token}/accept`, "POST");
export const createPact = (
  campId: string,
  value: {
    participantIds: string[];
    startsAt: string;
    durationMinutes: 5 | 10 | 25 | 50
  },
  key: string
) => mutation<{ pact: FocusPact }>(`/camps/${campId}/pacts`, "POST", value, key);

export const getPact = (id: string) => request<{ pact: FocusPact }>(`/pacts/${id}`);
export const respondPact = (id: string, response: "accepted" | "declined") => mutation<{ pact: FocusPact }>(`/pacts/${id}/respond`, "POST", { response });
export const startPact = (id: string, key: string) => mutation<{ session: FocusSession }>(`/pacts/${id}/start`, "POST", undefined, key);
export const getMemory = () => request<{ milestones: Array<{ id: string; campId: string; recordedAt: string }> }>("/me/memory");
export const exportData = () => request<unknown>("/me/data-export");
export const deleteAccount = (password: string) => mutation<void>("/me/account", "DELETE", { password });
export const updateCamp = (id: string, name: string) => mutation(`/camps/${id}`, "PATCH", { name });
export const revokeInvite = (id: string, inviteId: string) => mutation<void>(`/camps/${id}/invites/${inviteId}`, "DELETE");
export const removeMember = (id: string, accountId: string) => mutation<void>(`/camps/${id}/members/${accountId}`, "DELETE");
export const leaveCamp = (id: string) => mutation<void>(`/camps/${id}/members/me`, "DELETE");
export const transferCamp = (id: string, accountId: string) => mutation<void>(`/camps/${id}/ownership-transfer`, "POST", { accountId });
export const cancelPact = (id: string) => mutation<{ pact: FocusPact }>(`/pacts/${id}/cancel`, "POST");
export type HistoryEntry = {
  id: string;
  kind: "solo" | "pact";
  startedAt: string;
  endsAt: string;
  status: string;
  outcome: "completed" | "progress" | "stuck" | "stopped" | null
};
export const getHistory = () => request<{ sessions: HistoryEntry[] }>("/me/focus-history");

export const listPacts = (group: string, cursor?: string, campId?: string) =>
  request<import('@pyneath/contracts').PactPage>(`${campId ? `/camps/${campId}/pacts` : '/me/pacts'}?group=${encodeURIComponent(group)}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
export const claimDuePactReminders = () => mutation<PactReminderClaim>('/me/pact-reminders/claim-due', 'POST');

export const listCampInvites = (id: string, cursor?: string) =>
  request<import('@pyneath/contracts').InvitePage>(`/camps/${id}/invites${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);

export const setCampStatus = (id: string, status: 'active' | 'archived') =>
  mutation(`/camps/${id}`, 'PATCH', { status });

export const requestAssistance = (value: AssistanceRequest) => mutation<AssistanceResponse>('/me/assistance', 'POST', value);
export const recordAssistanceInteraction = (value: AssistanceInteraction) => mutation<void>('/me/assistance/interactions', 'POST', value);
