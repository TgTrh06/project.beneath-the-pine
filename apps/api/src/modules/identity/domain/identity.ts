export interface AccountIdentity { id: string; email: string; }
export interface AccountRecord extends AccountIdentity { passwordHash: string; createdAt: Date; }
export interface SessionRecord { tokenHash: string; accountId: string | null; csrfToken: string; expiresAt: Date; }
export interface SessionIdentity { session: SessionRecord; account: AccountIdentity | null; }
export const validSessionToken = (token: string | undefined): token is string => Boolean(token && /^[a-f0-9]{64}$/.test(token));
export const sessionLifetime = (authenticated: boolean) => authenticated ? 7 * 86400000 : 3600000;
