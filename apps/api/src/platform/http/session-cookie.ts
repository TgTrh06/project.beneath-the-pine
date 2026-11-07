import type { Response } from 'express';
export const sessionCookieName = 'PYNEATH_SESSION';
export const legacySessionCookieName = 'BTP_SESSION';
export function cookieValue(cookie: string | undefined, name: string) {
  return cookie?.split(';').map(item => item.trim()).find(item => item.startsWith(`${name}=`))?.slice(name.length + 1);
}
export function sessionTokenFromCookie(cookie?: string) {
  const value = cookieValue(cookie, sessionCookieName) ?? cookieValue(cookie, legacySessionCookieName);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : undefined;
}
export function sessionTokensFromCookie(cookie?: string) {
  return [cookieValue(cookie, sessionCookieName), cookieValue(cookie, legacySessionCookieName)];
}
export function sessionCookieOptions(origin: string) {
  return { httpOnly: true, secure: origin.startsWith('https:'), sameSite: 'lax' as const, path: '/' };
}
export function clearSessionCookies(response: Response, origin: string) {
  response.clearCookie(sessionCookieName, sessionCookieOptions(origin));
  response.clearCookie(legacySessionCookieName, sessionCookieOptions(origin));
}
