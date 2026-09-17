import { logFrontendError } from "../logging/logger";
import { accountSessionSchema, type AccountSessionPayload } from "@beneath-the-pine/contracts";
import { discardPrivateDrafts, setDraftOwner } from "./privateDrafts";

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || "/api/v1";
export const isAuthConfigured = Boolean(apiUrl);

export type AuthSession = Readonly<{ subject: string; email: string }>;
export type AuthCredentials = Readonly<{ email: string; password: string }>;

type SessionPayload = AccountSessionPayload;
type SessionListener = (session: AuthSession | null) => void;

const listeners = new Set<SessionListener>();
let initialization: Promise<AuthSession | null> | null = null;
let csrfToken: string | null = null;

function publishSession(session: AuthSession | null): AuthSession | null {
  listeners.forEach((listener) => listener(session));
  return session;
}

function readSession(payload: SessionPayload): AuthSession | null {
  csrfToken = payload.csrfToken;
  if (payload.authenticated && payload.account) setDraftOwner(payload.account.id);
  return payload.authenticated && payload.account
    ? { subject: payload.account.id, email: payload.account.email }
    : null;
}

async function parseSessionResponse(response: Response): Promise<AuthSession | null> {
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new Error("Dịch vụ tài khoản chưa sẵn sàng. Vui lòng thử lại sau."); }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) csrfToken = null;
    const messages: Record<number, string> = { 400: "Kiểm tra email và mật khẩu (12–64 ký tự).", 401: "Email hoặc mật khẩu không đúng.", 403: "Phiên bảo vệ đã hết hạn. Vui lòng gửi lại.", 409: "Không thể tạo tài khoản với email này. Hãy đăng nhập hoặc dùng email khác.", 429: "Bạn thao tác quá nhanh. Vui lòng thử lại sau một phút.", 503: "Dịch vụ tài khoản chưa sẵn sàng. Vui lòng thử lại sau." };
    throw new Error(messages[response.status] ?? "Không thể xác thực lúc này.");
  }
  const result = accountSessionSchema.safeParse(payload);
  if (!result.success) throw new Error("Không thể xác nhận phiên đăng nhập. Vui lòng thử lại.");
  return readSession(result.data);
}

async function loadSession(): Promise<AuthSession | null> {
  if (!apiUrl) return null;
  const response = await fetch(`${apiUrl}/auth/session`, { credentials: "include" });
  return parseSessionResponse(response);
}

async function submitCredentials(path: "login" | "register", credentials: AuthCredentials): Promise<AuthSession> {
  if (!apiUrl) throw new Error("Đăng nhập chưa được cấu hình.");
  const token = await getCsrfToken();
  const response = await fetch(`${apiUrl}/auth/${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json", "X-XSRF-TOKEN": token },
    body: JSON.stringify(credentials),
  });
  const session = await parseSessionResponse(response);
  if (!session) throw new Error("Không thể tạo phiên đăng nhập.");
  initialization = Promise.resolve(session);
  publishSession(session);
  return session;
}

export function subscribeToAuth(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function initializeAuth(): Promise<AuthSession | null> {
  if (!isAuthConfigured) return Promise.resolve(null);
  if (!initialization) {
    initialization = loadSession()
      .then(publishSession)
      .catch((error: unknown) => {
        initialization = null;
        logFrontendError({ event: "auth_initialization_failed", area: "auth" });
        throw error;
      });
  }
  return initialization;
}

export async function login(credentials: AuthCredentials): Promise<AuthSession> {
  try {
    return await submitCredentials("login", credentials);
  } catch (error) {
    logFrontendError({ event: "login_failed", area: "auth" });
    throw error instanceof TypeError ? new Error("Chưa thể kết nối dịch vụ tài khoản. Vui lòng thử lại sau.") : error;
  }
}

export async function register(credentials: AuthCredentials): Promise<AuthSession> {
  try {
    return await submitCredentials("register", credentials);
  } catch (error) {
    logFrontendError({ event: "registration_failed", area: "auth" });
    throw error instanceof TypeError ? new Error("Chưa thể kết nối dịch vụ tài khoản. Vui lòng thử lại sau.") : error;
  }
}

export async function logout(): Promise<void> {
  if (!apiUrl) return;
  const token = await getCsrfToken();
  const response = await fetch(`${apiUrl}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: { "X-XSRF-TOKEN": token },
  });
  if (!response.ok) throw new Error("Không thể đăng xuất lúc này.");
  discardPrivateDrafts();
  csrfToken = null;
  initialization = null;
  publishSession(null);
}

export async function getCsrfToken(): Promise<string> {
  if (!csrfToken) await loadSession().then(publishSession);
  if (!csrfToken) throw new Error("Không thể tạo mã bảo vệ yêu cầu.");
  return csrfToken;
}

export function expireSession(discardDrafts = false): void {
  if (discardDrafts) discardPrivateDrafts();
  csrfToken = null;
  initialization = null;
  publishSession(null);
}
