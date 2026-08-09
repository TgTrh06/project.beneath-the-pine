export type AuthIdentity = { id: string; email: string };

export interface AuthIdentityProvider {
  getIdentity(accessToken: string): Promise<AuthIdentity | null>;
  invite(email: string, redirectTo: string): Promise<AuthIdentity>;
}
