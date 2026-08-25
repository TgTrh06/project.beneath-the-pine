import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
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
