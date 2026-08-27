import { ConflictError } from "../../../shared/errors/ConflictError.js";
import { SupabaseClientFactory } from "../../../shared/infrastructure/supabase/SupabaseClientFactory.js";
import type { AuthIdentity, AuthIdentityProvider } from "../domain/AuthIdentity.js";

export class SupabaseAuthIdentityProvider implements AuthIdentityProvider {
  public constructor(private readonly clients: SupabaseClientFactory) {}

  public async getIdentity(accessToken: string): Promise<AuthIdentity | null> {
    const client = this.clients.serviceClient();
    if (!client) return null;
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user.email) return null;
    return { id: data.user.id, email: data.user.email.toLowerCase() };
  }

  public async invite(email: string, redirectTo: string): Promise<AuthIdentity> {
    const client = this.clients.serviceClient();
    if (!client) throw new ConflictError("Cần cấu hình Supabase service role và SMTP trước khi gửi invite.");
    const { data, error } = await client.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (error || !data.user?.email) throw new ConflictError("Không thể gửi invite lúc này.");
    return { id: data.user.id, email: data.user.email.toLowerCase() };
  }
}
