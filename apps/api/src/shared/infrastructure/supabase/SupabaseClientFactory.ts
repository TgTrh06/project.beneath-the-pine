import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../../../env.js";

export class SupabaseClientFactory {
  private client: SupabaseClient | null = null;

  public serviceClient(): SupabaseClient | null {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
    this.client ??= createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    return this.client;
  }
}
