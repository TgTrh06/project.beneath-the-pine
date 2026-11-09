import { expireSession, getCsrfToken } from '../auth/auth';
import { logFrontendError } from '../logging/logger';
import { apiUrl } from './config';

export class ApiRequestError extends Error {
  constructor(message: string, readonly status?: number, readonly code?: string) {
    super(message);
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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
export const mutation = <T>(
  path: string,
  method: string,
  value?: unknown,
  key?: string
) => request<T>(path, {
  method,
  body: value === undefined ? undefined : JSON.stringify(value),
  headers: key ? { "Idempotency-Key": key } : undefined
});

