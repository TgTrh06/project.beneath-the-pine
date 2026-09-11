import { csrfSync } from 'csrf-sync';
import type { Request } from 'express';

export type SessionUser = { id: string; email: string };
declare module 'express-session' {
  interface SessionData { user?: SessionUser }
}

export const csrf = csrfSync({ getTokenFromRequest: request => request.get('X-XSRF-TOKEN') });

export const saveSession = (request: Request): Promise<void> =>
  new Promise((resolve, reject) => request.session.save(error => error ? reject(error) : resolve()));

export async function establishSession(request: Request, user: SessionUser) {
  await new Promise<void>((resolve, reject) => request.session.regenerate(error => error ? reject(error) : resolve()));
  request.session.user = user;
  const csrfToken = csrf.generateToken(request, true);
  await saveSession(request);
  return { authenticated: true, user, csrfToken };
}
