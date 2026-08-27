import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  PORT: z.coerce.number().int().positive().default(3001),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().default("gpt-5-mini"),
  AI_PROVIDER: z.enum(["manual_fallback", "beneath_pine", "openai"]).default("manual_fallback"),
  INFERENCE_SERVICE_URL: z.string().url().optional(),
  INFERENCE_SERVICE_TOKEN: z.string().min(16).optional(),
  INFERENCE_TIMEOUT_MS: z.coerce.number().int().positive().max(30_000).default(12_000),
  CONTENT_ENCRYPTION_KEY: z.string().min(1).optional(),
  CONTENT_ENCRYPTION_KEY_VERSION: z.string().default("local-v1"),
  ADMIN_EMAILS: z.string().default(""),
});

export const env = envSchema.parse(process.env);
export const adminEmails = new Set(env.ADMIN_EMAILS.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));

export type BackendEnv = z.infer<typeof envSchema>;
export type EnvDiagnostic = {
  level: "warn" | "error";
  code: "BACKEND_ENV_PARTIAL" | "AI_PROVIDER_MISCONFIGURED";
  missing: string[];
  message: string;
};

function isValidContentEncryptionKey(value: string | undefined): boolean {
  if (!value) return false;
  return Buffer.from(value, "base64").length === 32;
}

/** Returns safe startup diagnostics: variable names only, never their values. */
export function getEnvDiagnostics(config: BackendEnv = env): EnvDiagnostic[] {
  const diagnostics: EnvDiagnostic[] = [];
  const coreMissing = [
    !config.DATABASE_URL && "DATABASE_URL",
    !config.SUPABASE_URL && "SUPABASE_URL",
    !config.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
    !isValidContentEncryptionKey(config.CONTENT_ENCRYPTION_KEY) && "CONTENT_ENCRYPTION_KEY",
  ].filter((value): value is string => Boolean(value));
  if (coreMissing.length) diagnostics.push({
    level: "warn",
    code: "BACKEND_ENV_PARTIAL",
    missing: coreMissing,
    message: "Backend is running in limited mode; protected product flows may be unavailable.",
  });

  const aiMissing = config.AI_PROVIDER === "openai"
    ? [!config.OPENAI_API_KEY && "OPENAI_API_KEY"].filter((value): value is string => Boolean(value))
    : config.AI_PROVIDER === "beneath_pine"
      ? [!config.INFERENCE_SERVICE_URL && "INFERENCE_SERVICE_URL", !config.INFERENCE_SERVICE_TOKEN && "INFERENCE_SERVICE_TOKEN"].filter((value): value is string => Boolean(value))
      : [];
  if (aiMissing.length) diagnostics.push({
    level: "error",
    code: "AI_PROVIDER_MISCONFIGURED",
    missing: aiMissing,
    message: "Configured AI provider is unavailable; use manual_fallback until its required environment variables are set.",
  });
  return diagnostics;
}
