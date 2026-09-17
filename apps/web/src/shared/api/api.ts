import type { Circle, FocusPact, FocusSession, Profile, ReturnState } from "@beneath-the-pine/contracts";
import { expireSession, getCsrfToken } from "../auth/auth";
import { logFrontendError } from "../logging/logger";

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || "/api/v1";
export const realtimeUrl = (import.meta.env.VITE_REALTIME_URL as string | undefined) || undefined;
export class ApiRequestError extends Error { constructor(message: string, readonly status?: number, readonly code?: string) { super(message); } }
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
const mutation = <T>(path: string, method: string, value?: unknown, key?: string) => request<T>(path, { method, body: value === undefined ? undefined : JSON.stringify(value), headers: key ? { "Idempotency-Key": key } : undefined });
export const newRequestKey = () => crypto.randomUUID();
export const getReturnState = () => request<ReturnState>("/me/return");
export const getProfile = () => request<{ profile: Profile | null }>("/me/profile");
export const updateProfile = (value: Partial<Profile>) => mutation<{ profile: Profile }>("/me/profile", "PATCH", value);
export const startSolo = (value: { intention: string; durationMinutes: 5 | 10 | 25 | 50 }, key: string) => mutation<{ session: FocusSession }>("/focus-sessions", "POST", value, key);
export const getSession = (id: string) => request<{ session: FocusSession }>(`/focus-sessions/${id}`);
export const joinSession = (id: string) => mutation<{ session: FocusSession }>(`/focus-sessions/${id}/join`, "POST");
export const checkOut = (id: string, value: { outcome: "completed" | "progress" | "stuck" | "stopped"; openSeed?: string | null }) => mutation<{ session: FocusSession }>(`/focus-sessions/${id}/check-out`, "POST", value);
export const putSeed = (text: string) => mutation("/me/open-seed", "PUT", { text });
export const deleteSeed = () => mutation<void>("/me/open-seed", "DELETE");
export const listCircles = () => request<{ circles: Circle[] }>("/circles");
export const getCircle = (id: string) => request<{ circle: Circle }>(`/circles/${id}`);
export const createCircle = (name: string) => mutation<{ circle: { id: string } }>("/circles", "POST", { name });
export const createCircleInvite = (id: string) => mutation<{ invite: { id: string; token: string; expiresAt: string } }>(`/circles/${id}/invites`, "POST", { expiresInHours: 72 });
export const acceptCircleInvite = (token: string) => mutation<{ circleId: string }>(`/circle-invites/${token}/accept`, "POST");
export const createPact = (circleId: string, value: { participantIds: string[]; startsAt: string; durationMinutes: 5 | 10 | 25 | 50 }, key: string) => mutation<{ pact: FocusPact }>(`/circles/${circleId}/pacts`, "POST", value, key);
export const getPact = (id: string) => request<{ pact: FocusPact }>(`/pacts/${id}`);
export const respondPact = (id: string, response: "accepted" | "declined") => mutation<{ pact: FocusPact }>(`/pacts/${id}/respond`, "POST", { response });
export const startPact = (id: string, key: string) => mutation<{ session: FocusSession }>(`/pacts/${id}/start`, "POST", undefined, key);
export const getMemory = () => request<{ milestones: Array<{ id: string; circleId: string; recordedAt: string }> }>("/me/memory");
export const exportData = () => request<unknown>("/me/data-export");
export const deleteAccount = (password: string) => mutation<void>("/me/account", "DELETE", { password });
export const updateCircle = (id: string, name: string) => mutation(`/circles/${id}`, "PATCH", { name });
export const revokeInvite = (id: string, inviteId: string) => mutation<void>(`/circles/${id}/invites/${inviteId}`, "DELETE");
export const removeMember = (id: string, accountId: string) => mutation<void>(`/circles/${id}/members/${accountId}`, "DELETE");
export const leaveCircle = (id: string) => mutation<void>(`/circles/${id}/members/me`, "DELETE");
export const transferCircle = (id: string, accountId: string) => mutation<void>(`/circles/${id}/ownership-transfer`, "POST", { accountId });
export const cancelPact = (id: string) => mutation<{ pact: FocusPact }>(`/pacts/${id}/cancel`, "POST");
export type HistoryEntry = { id: string; kind: "solo" | "pact"; startedAt: string; endsAt: string; status: string; outcome: "completed" | "progress" | "stuck" | "stopped" | null };
export const getHistory = () => request<{ sessions: HistoryEntry[] }>("/me/focus-history");
